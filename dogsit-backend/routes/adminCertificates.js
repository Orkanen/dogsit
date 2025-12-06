const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /admin/certificate-paperwork
 * Body: { certificateUrl, courseId?, petId?, notes? }
 * Authenticated users only. Creates a paperwork submission that admins review.
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { certificateUrl, courseId, petId, notes } = req.body;

    if (!certificateUrl || !certificateUrl.trim()) {
      return res.status(400).json({ error: "certificateUrl is required (upload file and provide URL)" });
    }

    // If petId provided, ensure pet exists and belongs to the user
    if (petId) {
      const pet = await prisma.pet.findUnique({ where: { id: Number(petId) } });
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      if (pet.ownerId !== userId) return res.status(403).json({ error: "You are not the owner of the specified pet" });
    }

    const created = await prisma.userCertificateSubmission.create({
      data: {
        userId,
        courseId: courseId ? Number(courseId) : null,
        petId: petId ? Number(petId) : null,
        certificateUrl: certificateUrl.trim(),
        notes: notes?.trim() || null,
        status: "PENDING",
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Create paperwork failed", err);
    res.status(500).json({ error: "Failed to submit certificate paperwork", details: err.message });
  }
});

/**
 * GET /admin/certificate-paperwork/pending
 * Admin-only: list pending submissions for review
 */
router.get("/pending", authenticateToken, async (req, res) => {
  try {
    const actorId = req.user.id;
    // check admin role
    const isAdmin = await prisma.userRole.findFirst({
      where: { userId: actorId, role: { is: { name: "admin" } } },
    });
    if (!isAdmin) return res.status(403).json({ error: "Only admins can view submitted paperwork" });

    const list = await prisma.userCertificateSubmission.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
      orderBy: { submittedAt: "desc" },
    });

    res.json(list);
  } catch (err) {
    console.error("List paperwork failed", err);
    res.status(500).json({ error: "Failed to list paperwork", details: err.message });
  }
});

/**
 * PATCH /admin/certificate-paperwork/:id/:action
 * Admin approves or rejects a submission. Body { notes? }
 *
 * NOTE: Avoid inline regex in the route path (path-to-regexp issues).
 * Accept :action as a plain param and validate its value in the handler.
 */
router.patch("/:id/:action", authenticateToken, async (req, res) => {
  try {
    const actorId = req.user.id;
    const id = Number(req.params.id);
    const action = req.params.action;
    const notes = req.body.notes;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'." });
    }

    // check admin role
    const isAdmin = await prisma.userRole.findFirst({
      where: { userId: actorId, role: { is: { name: "admin" } } },
    });
    if (!isAdmin) return res.status(403).json({ error: "Only admins can approve/reject paperwork" });

    const record = await prisma.userCertificateSubmission.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: "Submission not found" });

    const newStatus = action === "approve" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.userCertificateSubmission.update({
      where: { id },
      data: {
        status: newStatus,
        processedAt: new Date(),
        processedById: actorId,
        notes: notes?.trim() || record.notes,
      },
    });

    res.json({ success: true, submission: updated });
  } catch (err) {
    console.error("Process paperwork failed", err);
    res.status(500).json({ error: "Failed to process paperwork", details: err.message });
  }
});

module.exports = router;