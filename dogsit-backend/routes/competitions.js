const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /competitions
 * Create a competition. Only OWNER of the issuing KENNEL/CLUB may create.
 * Body: { title, description, issuerType, kennelId?, clubId?, startAt?, endAt? }
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, issuerType, kennelId, clubId, startAt, endAt } = req.body;
    if (!title || !issuerType) return res.status(400).json({ error: "title and issuerType required" });

    let authorized = false;
    if (issuerType === "CLUB" && clubId) {
      const member = await prisma.clubMember.findFirst({ where: { clubId: Number(clubId), userId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (issuerType === "KENNEL" && kennelId) {
      const member = await prisma.kennelMember.findFirst({ where: { kennelId: Number(kennelId), userId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Not authorized to create competition for this issuer" });

    const created = await prisma.competition.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        issuerType,
        kennelId: issuerType === "KENNEL" ? Number(kennelId) : null,
        clubId: issuerType === "CLUB" ? Number(clubId) : null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
      }
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Create competition failed", err);
    res.status(500).json({ error: "Failed to create competition", details: err.message });
  }
});

/**
 * POST /competitions/:id/apply
 * Body: { targetType: 'USER'|'PET', targetId }
 */
router.post("/:id/apply", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const { targetType, targetId } = req.body;
    const actorId = req.user.id;
    if (!targetType || !targetId) return res.status(400).json({ error: "targetType and targetId required" });

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return res.status(404).json({ error: "Competition not found" });

    if (targetType === "USER") {
      if (Number(targetId) !== actorId) return res.status(403).json({ error: "You can only apply as yourself" });
    } else if (targetType === "PET") {
      const pet = await prisma.pet.findUnique({ where: { id: Number(targetId) } });
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      if (pet.ownerId !== actorId) return res.status(403).json({ error: "Only pet owner can apply pet to competition" });
    } else {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    // duplicate guard
    const existing = await prisma.competitionEntry.findFirst({
      where: {
        competitionId,
        ...(targetType === "USER" ? { userId: Number(targetId) } : { petId: Number(targetId) }),
      },
    });
    if (existing) return res.status(409).json({ error: "Entry already exists", existing });

    const entry = await prisma.competitionEntry.create({
      data: {
        competitionId,
        userId: targetType === "USER" ? Number(targetId) : null,
        petId: targetType === "PET" ? Number(targetId) : null,
        status: "PENDING",
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("Apply competition failed", err);
    res.status(500).json({ error: "Failed to apply", details: err.message });
  }
});

/**
 * PATCH /competitions/:id/entries/:entryId/process
 * Body: { action: 'APPROVE'|'REJECT', notes? }
 * OWNER or EMPLOYEE (club) or OWNER (kennel) process entries.
 */
router.patch("/:id/entries/:entryId/process", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const entryId = Number(req.params.entryId);
    const { action, notes } = req.body;
    const actorId = req.user.id;

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return res.status(404).json({ error: "Competition not found" });

    let authorized = false;
    if (competition.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: { clubId: competition.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } },
      });
      if (member) authorized = true;
    }
    if (competition.kennelId) {
      const member = await prisma.kennelMember.findFirst({
        where: { kennelId: competition.kennelId, userId: actorId, role: "OWNER" },
      });
      if (member) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Not authorized to process entries for this competition" });

    const newStatus = action === "APPROVE" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.competitionEntry.update({
      where: { id: entryId },
      data: {
        status: newStatus,
        notes: notes?.trim() || null,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Process entry failed", err);
    res.status(500).json({ error: "Failed to process entry", details: err.message });
  }
});

/**
 * POST /competitions/:id/award
 * Assign an award to a competition or to a specific entry.
 * Body: { awardId, entryId?, awardedByUserId }
 * Only club/kennel OWNER can assign awards (owner chooses which user is recorded as awardedByUserId).
 * Validation: awardedByUserId must be:
 *  - an ACCEPTED CompetitionAllowedAwarder for the competition, OR
 *  - the actor assigning the award (owner assigning themselves)
 */
router.post("/:id/award", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const { awardId, entryId, awardedByUserId } = req.body;
    const actorId = req.user.id;

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return res.status(404).json({ error: "Competition not found" });

    // Only OWNER may assign awards
    let authorized = false;
    if (competition.clubId) {
      const member = await prisma.clubMember.findFirst({ where: { clubId: competition.clubId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (competition.kennelId) {
      const member = await prisma.kennelMember.findFirst({ where: { kennelId: competition.kennelId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Only OWNER can assign awards for this competition" });

    // Validate award exists
    const award = await prisma.award.findUnique({ where: { id: Number(awardId) } });
    if (!award) return res.status(404).json({ error: "Award not found" });
    if (award.competitionId && award.competitionId !== competitionId) {
      return res.status(400).json({ error: "Award is already assigned to a different competition" });
    }

    // If entryId provided: validate it belongs to competition
    if (entryId) {
      const entry = await prisma.competitionEntry.findUnique({ where: { id: Number(entryId) } });
      if (!entry) return res.status(404).json({ error: "Entry not found" });
      if (entry.competitionId !== competitionId) return res.status(400).json({ error: "Entry does not belong to this competition" });
    }

    // Validate awardedByUserId exists
    if (!awardedByUserId) return res.status(400).json({ error: "awardedByUserId is required" });

    const awardedUser = await prisma.user.findUnique({ where: { id: Number(awardedByUserId) } });
    if (!awardedUser) return res.status(404).json({ error: "awardedByUserId not found" });

    // Check allowed-awarder condition: either awardedByUserId is an ACCEPTED allowed-awarder, OR awardedByUserId === actorId (owner assigns themself)
    const allowedRecord = await prisma.competitionAllowedAwarder.findUnique({
      where: { competitionId_userId: { competitionId: competitionId, userId: Number(awardedByUserId) } },
    });

    const isAcceptedAllow = allowedRecord && allowedRecord.status === "ACCEPTED";
    const isOwnerAssigningSelf = Number(awardedByUserId) === actorId;

    if (!isAcceptedAllow && !isOwnerAssigningSelf) {
      return res.status(403).json({ error: "The awardedBy user is not an accepted awarder for this competition" });
    }

    // Create competition award
    const created = await prisma.competitionAward.create({
      data: {
        competitionId,
        awardId: Number(awardId),
        entryId: entryId ? Number(entryId) : null,
        awardedByUserId: Number(awardedByUserId),
      }
    });

    // Link award -> competition if missing
    if (!award.competitionId) {
      await prisma.award.update({
        where: { id: Number(awardId) },
        data: { competitionId },
      });
    }

    res.status(201).json(created);
  } catch (err) {
    console.error("Assign award failed", err);
    // Handle unique constraint / P2002
    if (err.code === "P2002") {
      return res.status(409).json({ error: "This award is already assigned to this competition" });
    }
    res.status(500).json({ error: "Failed to assign award", details: err.message });
  }
});

/**
 * POST /competitions/:id/awarders
 * Nominate a user as an allowed-awarder for the competition.
 * Body: { userId }
 * Only competition OWNER can nominate (per policy).
 * Creates CompetitionAllowedAwarder with status = PENDING.
 */
router.post("/:id/awarders", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const { userId } = req.body;
    const actorId = req.user.id;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return res.status(404).json({ error: "Competition not found" });

    // Only OWNER may nominate
    let authorized = false;
    if (competition.clubId) {
      const member = await prisma.clubMember.findFirst({ where: { clubId: competition.clubId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (competition.kennelId) {
      const member = await prisma.kennelMember.findFirst({ where: { kennelId: competition.kennelId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Only OWNER can nominate awarders for this competition" });

    // Ensure nominee exists
    const nominee = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!nominee) return res.status(404).json({ error: "Nominee user not found" });

    try {
      const nomination = await prisma.competitionAllowedAwarder.create({
        data: {
          competitionId,
          userId: Number(userId),
          nominatedById: actorId,
          status: "PENDING",
        },
      });
      return res.status(201).json(nomination);
    } catch (err) {
      // Unique key exists -> already nominated
      if (err.code === "P2002") {
        const existing = await prisma.competitionAllowedAwarder.findUnique({
          where: { competitionId_userId: { competitionId, userId: Number(userId) } },
        });
        return res.status(409).json({ error: "Nomination already exists", existing });
      }
      throw err;
    }
  } catch (err) {
    console.error("Nominate awarder failed", err);
    res.status(500).json({ error: "Failed to nominate awarder", details: err.message });
  }
});

/**
 * GET /competitions/:id/awarders
 * List nominations and accepted awarders for a competition.
 * Query: ?status=PENDING|ACCEPTED|REJECTED (optional)
 */
router.get("/:id/awarders", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const status = req.query.status;
    const where = { competitionId: competitionId, ...(status ? { status } : {}) };

    const nominations = await prisma.competitionAllowedAwarder.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        nominatedBy: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
        processedBy: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { nominatedAt: "desc" },
    });

    res.json(nominations);
  } catch (err) {
    console.error("List awarders failed", err);
    res.status(500).json({ error: "Failed to list awarders", details: err.message });
  }
});

/**
 * PATCH /competitions/:id/awarders/:userId/:action
 * Approve or reject a nomination. Only competition OWNER or platform admin may process.
 *
 * Note: route uses a generic :action param to avoid path-to-regexp parsing issues.
 * Handler validates action is "approve" or "reject".
 */
router.patch("/:id/awarders/:userId/:action", authenticateToken, async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const action = req.params.action; // expected "approve" or "reject"
    const actorId = req.user.id;
    const notes = req.body.notes;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'." });
    }

    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) return res.status(404).json({ error: "Competition not found" });

    // Only OWNER or admin may process
    let authorized = false;
    if (competition.clubId) {
      const member = await prisma.clubMember.findFirst({ where: { clubId: competition.clubId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }
    if (competition.kennelId) {
      const member = await prisma.kennelMember.findFirst({ where: { kennelId: competition.kennelId, userId: actorId, role: "OWNER" } });
      if (member) authorized = true;
    }

    // platform admin may also process
    const isAdmin = await prisma.userRole.findFirst({
      where: {
        userId: actorId,
        role: { is: { name: "admin" } },
      },
    });
    if (isAdmin) authorized = true;

    if (!authorized) return res.status(403).json({ error: "Not authorized to process this nomination" });

    const record = await prisma.competitionAllowedAwarder.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });
    if (!record) return res.status(404).json({ error: "Nomination not found" });

    const newStatus = action === "approve" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.competitionAllowedAwarder.update({
      where: { competitionId_userId: { competitionId, userId } },
      data: {
        status: newStatus,
        processedAt: new Date(),
        processedById: actorId,
        notes: notes?.trim() || record.notes,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Process nomination failed", err);
    res.status(500).json({ error: "Failed to process nomination", details: err.message });
  }
});

module.exports = router;