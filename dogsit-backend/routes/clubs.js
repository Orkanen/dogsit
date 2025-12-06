const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * Club routes
 *
 * Mount at: app.use("/club", require("./routes/clubs"))
 *
 * Exposed endpoints:
 * GET    /club               - list public clubs
 * GET    /club/my            - clubs the actor can manage (OWNER/EMPLOYEE)
 * POST   /club               - create club (actor becomes OWNER)
 * GET    /club/:id           - club details
 * POST   /club/:id/join      - request membership
 * GET    /club/:id/requests  - list incoming requests & enrollments/entries (OWNER/EMPLOYEE)
 * PATCH  /club/requests/members/:clubId/:userId/:action
 * PATCH  /club/requests/enrollments/:enrollmentId/process
 * PATCH  /club/requests/entries/:entryId/process
 */

/**
 * GET /club
 * Public list of clubs (basic info).
 */
router.get("/", async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        membershipType: true,
        verificationStatus: true,
        members: {
          select: {
            user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
            role: true,
            status: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(clubs);
  } catch (err) {
    console.error("List clubs failed", err);
    res.status(500).json({ error: "Failed to list clubs", details: err.message });
  }
});

/**
 * GET /club/my
 * Clubs the current user can manage (OWNER/EMPLOYEE).
 */
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const clubs = await prisma.club.findMany({
      where: { members: { some: { userId, role: { in: ["OWNER", "EMPLOYEE"] } } } },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
        },
        // Use relation names that exist in your schema
        coursesIssued: true,
        competitions: {
          include: { entries: true, competitionAwards: true },
        },
        awardsIssued: true,
        certifiers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(clubs);
  } catch (err) {
    console.error("Load my clubs failed", err);
    res.status(500).json({ error: "Failed to load clubs", details: err.message });
  }
});

/**
 * POST /club
 * Create a club. Actor becomes OWNER.
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, membershipType = "OPEN" } = req.body;
    const userId = req.user.id;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });

    const existing = await prisma.club.findUnique({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ error: "Club with this name already exists", existing });

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        membershipType,
        members: {
          create: {
            userId,
            role: "OWNER",
            status: "ACCEPTED",
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } } },
      },
    });

    res.status(201).json(club);
  } catch (err) {
    console.error("Create club failed", err);
    if (err?.code === "P2002") {
      const existing = await prisma.club.findUnique({ where: { name: req.body.name?.trim() } }).catch(() => null);
      return res.status(409).json({ error: "Club with this name already exists", existing });
    }
    res.status(500).json({ error: "Failed to create club", details: err.message });
  }
});

/**
 * GET /club/:id
 * Full club details.
 *
 * This handler fetches the club, then fetches that club's courses and separately
 * fetches any course certifier assignment rows (join table). We attach those rows
 * to each course in JS. This avoids trying to include a relation name that may not exist
 * on the Course model.
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid club id" });

    // Fetch basic club data and members
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } } },
        competitions: {
          include: {
            entries: { include: { user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } }, pet: true } },
            competitionAwards: { include: { award: true, awardedBy: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } }, entry: true } },
          },
        },
        awardsIssued: true,
        certifiers: true,
      },
    });

    if (!club) return res.status(404).json({ error: "Club not found" });

    // Fetch courses separately so we can include any fields we need without relying on a Course -> assignment relation name
    const courses = await prisma.course.findMany({
      where: { clubId: id },
      orderBy: { createdAt: "asc" },
      // include any course-level relations you do want here (kennel, club, enrollments, etc) — avoid non-existent relation names
      include: {
        kennel: true,
        club: true,
        certifiers: true,
        certifications: true,
        enrollments: true,
      },
    });

    // If there are no courses, just return club with empty courses arrays
    if (!courses.length) {
      return res.json({ ...club, courses: [], coursesIssued: [] });
    }

    // Fetch course certifier assignments (join table) for these courses in one query
    const courseIds = courses.map((c) => c.id);
    const assignments = await prisma.courseCertifierAssignment.findMany({
      where: { courseId: { in: courseIds } },
      include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
    });

    // Group assignments by courseId
    const assignmentsByCourse = assignments.reduce((acc, a) => {
      acc[a.courseId] = acc[a.courseId] || [];
      acc[a.courseId].push(a);
      return acc;
    }, {});

    // Attach assignments to each course object (under a predictable field)
    const coursesWithAssignments = courses.map((c) => ({
      ...c,
      courseCertifierAssignments: assignmentsByCourse[c.id] || [],
    }));

    // Return club with courses in both shapes some frontends expect
    const result = {
      ...club,
      courses: coursesWithAssignments,
      coursesIssued: coursesWithAssignments,
    };

    res.json(result);
  } catch (err) {
    console.error("Get club failed", err && err.stack ? err.stack : err);
    res.status(500).json({ error: "Failed to load club", details: err.message });
  }
});

/**
 * POST /club/:id/join
 * Request membership (authenticated).
 */
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    if (!Number.isFinite(clubId)) return res.status(400).json({ error: "Invalid club id" });
    const userId = req.user.id;

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ error: "Club not found" });

    const existing = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } } });
    if (existing) {
      if (existing.status === "ACCEPTED") return res.status(409).json({ error: "Already a member", existing });
      if (existing.status === "PENDING") return res.status(409).json({ error: "Membership request already pending", existing });
      const updated = await prisma.clubMember.update({ where: { clubId_userId: { clubId, userId } }, data: { status: "PENDING", joinedAt: null } });
      return res.json(updated);
    }

    const created = await prisma.clubMember.create({
      data: { clubId, userId, status: "PENDING", role: "MEMBER", joinedAt: null },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Join club failed", err);
    res.status(500).json({ error: "Failed to request membership", details: err.message });
  }
});

/**
 * GET /club/:id/requests
 * Returns pending membership requests, course enrollments for club courses (APPLIED),
 * and competition entries for club competitions (PENDING).
 */
router.get("/:id/requests", authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    if (!Number.isFinite(clubId)) return res.status(400).json({ error: "Invalid club id" });

    const actorId = req.user.id;

    // Authorization: only OWNER/EMPLOYEE can view
    const membership = await prisma.clubMember.findFirst({
      where: { clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } },
    });
    if (!membership) return res.status(403).json({ error: "Not authorized to view requests for this club" });

    // Pending membership requests
    const membershipRequests = await prisma.clubMember.findMany({
      where: { clubId, status: "PENDING" },
      include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
      orderBy: { joinedAt: "desc" },
    });

    // Course enrollments where the course belongs to this club and enrollment is APPLIED
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        status: "APPLIED",
        course: { clubId },
      },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
        pet: { select: { id: true, name: true } },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Competition entries where competition belongs to this club and status is PENDING
    const competitionEntries = await prisma.competitionEntry.findMany({
      where: {
        status: "PENDING",
        competition: { clubId },
      },
      include: {
        competition: { select: { id: true, title: true } },
        user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
        pet: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ membershipRequests, courseEnrollments, competitionEntries });
  } catch (err) {
    console.error("Load club requests failed", err);
    res.status(500).json({ error: "Failed to load club requests", details: err.message });
  }
});

/**
 * PATCH /club/requests/members/:clubId/:userId/:action
 * Accept or reject a membership request.
 */
router.patch("/requests/members/:clubId/:userId/:action", authenticateToken, async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = Number(req.params.userId);
    const action = req.params.action.toLowerCase();
    const actorId = req.user.id;

    if (!Number.isFinite(clubId) || !Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid clubId or userId" });
    }
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'accept' or 'reject'." });
    }

    // Authorization
    const processor = await prisma.clubMember.findFirst({
      where: { clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
    });
    if (!processor) return res.status(403).json({ error: "Not authorized" });

    const record = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
    });
    if (!record) return res.status(404).json({ error: "Request not found" });

    if (action === "accept") {
      const updated = await prisma.clubMember.update({
        where: { clubId_userId: { clubId, userId } },
        data: { status: "ACCEPTED", joinedAt: new Date() },
      });
      return res.json({ success: true, membership: updated });
    }

    if (action === "reject") {
      await prisma.clubMember.delete({
        where: { clubId_userId: { clubId, userId } },
      });
      return res.json({ success: true, deleted: true });
    }
  } catch (err) {
    console.error("Process membership failed", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

/**
 * PATCH /club/requests/enrollments/:enrollmentId/process
 * Body: { action: "APPROVE"|"REJECT", notes? }
 */
router.patch("/requests/enrollments/:enrollmentId/process", authenticateToken, async (req, res) => {
  try {
    const enrollmentId = Number(req.params.enrollmentId);
    const { action, notes } = req.body;
    const actorId = req.user.id;

    if (!Number.isFinite(enrollmentId)) return res.status(400).json({ error: "Invalid enrollment id" });

    const enrollment = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    if (!enrollment.course || !enrollment.course.clubId) return res.status(400).json({ error: "This enrollment is not for a club course" });
    const clubId = enrollment.course.clubId;

    // Check actor is OWNER/EMPLOYEE of the club
    const member = await prisma.clubMember.findFirst({ where: { clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } } });
    if (!member) return res.status(403).json({ error: "Not authorized to process enrollments for this club" });

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: newStatus,
        processedAt: new Date(),
        processedBy: actorId,
        notes: notes?.trim() || null,
      },
    });

    res.json({ success: true, enrollment: updated });
  } catch (err) {
    console.error("Process enrollment failed", err);
    res.status(500).json({ error: "Failed to process enrollment", details: err.message });
  }
});

/**
 * PATCH /club/requests/entries/:entryId/process
 * Body: { action: "APPROVE"|"REJECT", notes? }
 */
router.patch("/requests/entries/:entryId/process", authenticateToken, async (req, res) => {
  try {
    const entryId = Number(req.params.entryId);
    const { action, notes } = req.body;
    const actorId = req.user.id;

    if (!Number.isFinite(entryId)) return res.status(400).json({ error: "Invalid entry id" });

    const entry = await prisma.competitionEntry.findUnique({ where: { id: entryId }, include: { competition: true } });
    if (!entry) return res.status(404).json({ error: "Competition entry not found" });

    if (!entry.competition || !entry.competition.clubId) return res.status(400).json({ error: "This entry is not for a club competition" });
    const clubId = entry.competition.clubId;

    // Check actor is OWNER/EMPLOYEE of the club
    const member = await prisma.clubMember.findFirst({ where: { clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } } });
    if (!member) return res.status(403).json({ error: "Not authorized to process competition entries for this club" });

    const newStatus = action === "APPROVE" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.competitionEntry.update({
      where: { id: entryId },
      data: {
        status: newStatus,
        notes: notes?.trim() || null,
      },
    });

    res.json({ success: true, entry: updated });
  } catch (err) {
    console.error("Process competition entry failed", err);
    res.status(500).json({ error: "Failed to process competition entry", details: err.message });
  }
});

module.exports = router;