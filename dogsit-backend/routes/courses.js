const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /courses
 * Create a course (CLUB only).
 *
 * Body: {
 *   title,
 *   description?,
 *   issuerType: "CLUB",
 *   issuerId: <clubId>,
 *   certifierUserId?   // optional: user.id of a club member who will be assigned as certifier
 * }
 *
 * Behavior:
 * - Verifies caller is OWNER or EMPLOYEE of the club (status = "ACCEPTED").
 * - If certifierUserId is provided, verifies that the user is a member of the same club
 *   with role OWNER or EMPLOYEE (status = "ACCEPTED") and then creates a CourseCertifierAssignment.
 * - Returns 201 with the created course and an explicit certifiers array (may be empty).
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, issuerType, issuerId, certifierUserId } = req.body;
    const actorId = req.user.id;

    if (!title || !title.trim()) return res.status(400).json({ error: "Course title is required" });

    if (issuerType !== "CLUB") {
      return res.status(400).json({ error: "Courses must be issued by a CLUB. Set issuerType to 'CLUB'." });
    }

    const clubId = Number(issuerId);
    if (!Number.isFinite(clubId)) return res.status(400).json({ error: "Valid issuerId (club id) is required" });

    // Verify the club exists
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ error: "Club not found" });

    // Verify actor's role in the club (OWNER or EMPLOYEE) and accepted membership
    const membership = await prisma.clubMember.findFirst({
      where: { clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
    });
    if (!membership) {
      return res.status(403).json({ error: "Only club owners or employees can create courses for this club" });
    }

    // Create the course
    const created = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        issuerType: "CLUB",
        clubId,
      },
    });

    // If a certifierUserId was supplied, validate that this user is an OWNER or EMPLOYEE of the SAME club.
    if (certifierUserId != null) {
      const uid = Number(certifierUserId);
      if (!Number.isFinite(uid)) {
        return res.status(400).json({ error: "Invalid certifierUserId" });
      }

      // verify the user exists
      const userRecord = await prisma.user.findUnique({ where: { id: uid } });
      if (!userRecord) {
        return res.status(404).json({ error: "Certifier user not found" });
      }

      // verify the certifier is a club member with OWNER or EMPLOYEE role and ACCEPTED status
      const certMember = await prisma.clubMember.findFirst({
        where: { clubId, userId: uid, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
      });
      if (!certMember) {
        return res.status(400).json({ error: "Certifier must be an OWNER or EMPLOYEE of this club" });
      }

      // Create or upsert the CourseCertifierAssignment (composite PK courseId+userId)
      await prisma.courseCertifierAssignment.upsert({
        where: {
          courseId_userId: { courseId: created.id, userId: uid },
        },
        update: { assignedAt: new Date() },
        create: { courseId: created.id, userId: uid, role: null },
      });
    }

    // Fetch certifier assignments for the course to return a consistent response shape
    const assignments = await prisma.courseCertifierAssignment.findMany({
      where: { courseId: created.id },
      include: { user: { select: { id: true, email: true, profile: true } } },
    });

    return res.status(201).json({
      ...created,
      certifiers: assignments.map((a) => ({
        user: a.user,
        assignedAt: a.assignedAt,
        role: a.role,
      })),
    });
  } catch (err) {
    console.error("Create course failed", err);
    return res.status(500).json({ error: "Failed to create course", details: err.message });
  }
});

module.exports = router;