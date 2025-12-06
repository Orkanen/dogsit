const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /club-certifier
 * Body: { clubId, userId, courseId?, competitionId? }
 *
 * Behavior:
 * - If courseId is provided, create a course-level assignment (courseCertifierAssignment).
 * - If competitionId is provided:
 *   * If a competition assignment model exists (CompetitionCertifierAssignment), create that assignment.
 *   * Otherwise: create-or-reuse a club-level clubCertifier row for club+user and return it.
 *     (We DO NOT update competition.certifierId here because that field's FK target may not be a user id;
 *      updating it caused foreign-key violations. If you want competition.certifierId updated instead,
 *      please paste the Prisma model for Competition so I can make the correct FK update.)
 * - If neither courseId nor competitionId is provided, create a club-level nomination (clubCertifier).
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const actorId = req.user?.id;
    const { clubId, userId, courseId, competitionId } = req.body;

    if (!clubId || !userId) return res.status(400).json({ error: "clubId and userId required" });

    const club = await prisma.club.findUnique({ where: { id: Number(clubId) } });
    if (!club) return res.status(404).json({ error: "Club not found" });

    // Verify actor has permission to nominate (OWNER or EMPLOYEE)
    const actorMembership = await prisma.clubMember.findFirst({
      where: { clubId: Number(clubId), userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
    });
    if (!actorMembership) return res.status(403).json({ error: "Not authorized to nominate for this club" });

    // If a courseId is supplied, handle course-level assignment
    if (courseId != null) {
      const cid = Number(courseId);
      if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid courseId" });

      const course = await prisma.course.findUnique({ where: { id: cid } });
      if (!course || course.clubId !== Number(clubId)) {
        return res.status(400).json({ error: "Course not found for this club" });
      }

      // Prevent duplicate assignment for same course + user
      const existingAssignment = await prisma.courseCertifierAssignment.findUnique({
        where: { courseId_userId: { courseId: cid, userId: Number(userId) } },
      });
      if (existingAssignment) {
        return res.status(409).json({ error: "Nomination already exists for this course" });
      }

      const certMember = await prisma.clubMember.findFirst({
        where: { clubId: Number(clubId), userId: Number(userId), status: "ACCEPTED" },
      });
      if (!certMember) {
        return res.status(400).json({ error: "Nominee must be an accepted member of the club" });
      }

      const assignment = await prisma.courseCertifierAssignment.create({
        data: { courseId: cid, userId: Number(userId), assignedAt: new Date(), role: null },
        include: { user: { select: { id: true, email: true, profile: true } } },
      });

      return res.status(201).json(assignment);
    }

    // If a competitionId is supplied, handle competition-level assignment/update
    if (competitionId != null) {
      const compId = Number(competitionId);
      if (!Number.isFinite(compId)) return res.status(400).json({ error: "Invalid competitionId" });

      const competition = await prisma.competition.findUnique({ where: { id: compId } });
      if (!competition || competition.clubId !== Number(clubId)) {
        return res.status(400).json({ error: "Competition not found for this club" });
      }

      // Ensure nominee is an accepted club member
      const certMember = await prisma.clubMember.findFirst({
        where: { clubId: Number(clubId), userId: Number(userId), status: "ACCEPTED" },
      });
      if (!certMember) {
        return res.status(400).json({ error: "Nominee must be an accepted member of the club" });
      }

      // If your schema contains a competition assignment model, create that assignment.
      // Detect presence of CompetitionCertifierAssignment model in the DMMF.
      const hasAssignmentModel = !!(prisma._dmmf && prisma._dmmf.modelMap && prisma._dmmf.modelMap["CompetitionCertifierAssignment"]);
      if (hasAssignmentModel && typeof prisma.competitionCertifierAssignment !== "undefined") {
        // Prevent duplicate assignment
        const existing = await prisma.competitionCertifierAssignment.findUnique({
          where: { competitionId_userId: { competitionId: compId, userId: Number(userId) } },
        });
        if (existing) return res.status(409).json({ error: "Nomination already exists for this competition" });

        const assignment = await prisma.competitionCertifierAssignment.create({
          data: { competitionId: compId, userId: Number(userId), assignedAt: new Date(), role: null },
          include: { user: { select: { id: true, email: true, profile: true } } },
        });
        return res.status(201).json(assignment);
      }

      // FALLBACK: we do NOT update competition.certifierId here because your schema's FK target
      // for certifierId may not be a User.id (it may point to clubCertifier.id or another table).
      // To avoid foreign-key violations, create or reuse a club-level clubCertifier row and return it.
      let clubCert = await prisma.clubCertifier.findUnique({
        where: { clubId_userId: { clubId: Number(clubId), userId: Number(userId) } },
      });

      if (!clubCert) {
        clubCert = await prisma.clubCertifier.create({
          data: {
            clubId: Number(clubId),
            userId: Number(userId),
            requestedAt: new Date(),
            grantedById: actorId,
            status: "PENDING",
          },
        });
      }

      // Return created-or-existing clubCertifier so frontend can show nomination status.
      return res.status(201).json({ clubCertifier: clubCert });
    }

    // No courseId or competitionId: create a club-level nomination (existing behavior)
    const existing = await prisma.clubCertifier.findUnique({
      where: { clubId_userId: { clubId: Number(clubId), userId: Number(userId) } },
    });
    if (existing) {
      return res.status(409).json({ error: "Nomination already exists" });
    }

    const created = await prisma.clubCertifier.create({
      data: {
        clubId: Number(clubId),
        userId: Number(userId),
        requestedAt: new Date(),
        grantedById: actorId,
        status: "PENDING",
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("Create club certifier failed", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Failed to create nomination", details: err?.message || String(err) });
  }
});

module.exports = router;