const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /enrollments
 * Body: { courseId, targetType: "PET" | "USER", targetId }
 * Creates a CourseEnrollment with status APPLIED
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { courseId, targetType, targetId } = req.body;
    const actorId = req.user.id;

    if (!courseId || !targetType || !targetId) return res.status(400).json({ error: "courseId, targetType and targetId required" });

    // Basic duplicate guard
    const existing = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: Number(courseId),
        ...(targetType === "PET" ? { petId: Number(targetId) } : { userId: Number(targetId) }),
      },
    });
    if (existing) return res.status(409).json({ error: "Enrollment already exists", existing });

    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Owner of pet or the user themselves can apply
    if (targetType === "PET") {
      const pet = await prisma.pet.findUnique({ where: { id: Number(targetId) } });
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      if (pet.ownerId !== actorId) return res.status(403).json({ error: "Only pet owner can enroll pet" });
    } else {
      if (Number(targetId) !== actorId) return res.status(403).json({ error: "You can only enroll yourself" });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: Number(courseId),
        userId: targetType === "USER" ? Number(targetId) : null,
        petId: targetType === "PET" ? Number(targetId) : null,
        status: "APPLIED",
      },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    console.error("Create enrollment error:", err);
    res.status(500).json({ error: "Failed to create enrollment" });
  }
});

/**
 * PATCH /enrollments/:id/process
 * Body: { action: "APPROVE" | "REJECT", notes? }
 * Club OWNER/EMPLOYEE (or kennel OWNER) processes enrollments.
 */
router.patch("/:id/process", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, notes } = req.body;
    const actorId = req.user.id;

    const enrollment = await prisma.courseEnrollment.findUnique({ where: { id } });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const course = await prisma.course.findUnique({ where: { id: enrollment.courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    let authorized = false;
    if (course.issuerType === "CLUB" && course.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: { clubId: course.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } },
      });
      if (member) authorized = true;
    }
    if (course.issuerType === "KENNEL" && course.kennelId) {
      const member = await prisma.kennelMember.findFirst({
        where: { kennelId: course.kennelId, userId: actorId, role: "OWNER" },
      });
      if (member) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Not authorized to process enrollments for this course" });

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const updated = await prisma.courseEnrollment.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        processedAt: new Date(),
        processedBy: actorId,
        notes: notes?.trim() || null,
      },
    });

    // Note: We do NOT create a Certification here, because final certificate issuance must be approved by platform admin.
    // If you'd rather auto-create a Certification record (and let admin approve it later), we can add that logic here.

    res.json(updated);
  } catch (err) {
    console.error("Process enrollment error:", err);
    res.status(500).json({ error: "Failed to process enrollment" });
  }
});

module.exports = router;