const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// GET /certifications — Public list of approved pet certificates
router.post("/", authenticateToken, async (req, res) => {
  const { courseId, petId, enrollmentId, notes } = req.body;
  const ownerId = req.user.id;

  if (!courseId || !petId || !enrollmentId) return res.status(400).json({ error: "courseId, petId, enrollmentId required" });

  // Verify enrollment exists and belongs to pet/owner
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: Number(enrollmentId) },
    select: { id: true, petId: true, userId: true, status: true },
  });
  if (!enrollment || enrollment.petId !== Number(petId) || enrollment.userId !== ownerId) {
    return res.status(403).json({ error: "Invalid enrollment" });
  }

  if (enrollment.status !== "APPROVED") return res.status(400).json({ error: "Enrollment must be approved to request certificate" });

  // Create certificate, link to enrollment
  const cert = await prisma.certification.create({
    data: {
      courseId: Number(courseId),
      petId: Number(petId),
      issuingClubId: course.clubId,
      status: "PENDING",
      notes: notes?.trim() || null,
      enrollmentId: Number(enrollmentId),
    },
  });

  res.status(201).json(cert);
});

// POST /certifications — Request certificate (pet owner)
router.post("/", authenticateToken, async (req, res) => {
  const { courseId, petId, notes } = req.body;
  const ownerId = req.user.id;

  if (!courseId || !petId) {
    return res.status(400).json({ error: "courseId and petId required" });
  }

  try {
    // Verify pet ownership
    const pet = await prisma.pet.findUnique({
      where: { id: Number(petId) },
      select: { id: true, ownerId: true },
    });
    if (!pet || pet.ownerId !== ownerId) {
      return res.status(403).json({ error: "Not your pet" });
    }

    // Check if already requested
    const existing = await prisma.certification.findFirst({
      where: { courseId: Number(courseId), petId: Number(petId) },
    });
    if (existing) {
      return res.status(409).json({ error: "Certificate already requested", status: existing.status });
    }

    // Get course + club
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { id: true, clubId: true },
    });
    if (!course || !course.clubId) {
      return res.status(400).json({ error: "Invalid course" });
    }

    const cert = await prisma.certification.create({
      data: {
        courseId: Number(courseId),
        petId: Number(petId),
        issuingClubId: course.clubId,
        status: "PENDING",
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(cert);
  } catch (err) {
    console.error("Request cert error:", err);
    res.status(500).json({ error: "Failed to request certificate" });
  }
});

// GET /certifications/pending — For club dashboard
router.get("/pending", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const managedClubs = await prisma.club.findMany({
      where: {
        members: {
          some: {
            userId,
            role: { in: ["OWNER", "EMPLOYEE"] },
            status: "ACCEPTED",
          },
        },
      },
      select: { id: true },
    });

    const clubIds = managedClubs.map(c => c.id);
    if (clubIds.length === 0) return res.json([]);

    const pending = await prisma.certification.findMany({
      where: {
        status: "PENDING",
        issuingClubId: { in: clubIds },
      },
      include: {
        pet: { select: { id: true, name: true, breed: true, images: { take: 1 } } },
        course: { select: { id: true, title: true } },
        issuingClub: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(pending);
  } catch (err) {
    console.error("Pending certs error:", err);
    res.status(500).json({ error: "Failed to load pending certificates" });
  }
});

// PATCH /certifications/:id/verify
router.patch("/:id/verify", authenticateToken, async (req, res) => {
  const certId = Number(req.params.id);
  const userId = req.user.id;

  try {
    const cert = await prisma.certification.findUnique({
      where: { id: certId },
      include: { issuingClub: true },
    });
    if (!cert || cert.status !== "PENDING") {
      return res.status(404).json({ error: "Certificate not found or not pending" });
    }

    const isAuthorized = await prisma.clubMember.findFirst({
      where: {
        clubId: cert.issuingClubId,
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
    });

    if (!isAuthorized) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        status: "APPROVED",
        verifiedByUserId: userId,
        issuedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Verify cert error:", err);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
});

// PATCH /certifications/:id/reject
router.patch("/:id/reject", authenticateToken, async (req, res) => {
  const certId = Number(req.params.id);
  const userId = req.user.id;
  const { notes } = req.body;

  try {
    const cert = await prisma.certification.findUnique({
      where: { id: certId },
      include: { issuingClub: true },
    });
    if (!cert || cert.status !== "PENDING") {
      return res.status(404).json({ error: "Certificate not found or not pending" });
    }

    const isAuthorized = await prisma.clubMember.findFirst({
      where: {
        clubId: cert.issuingClubId,
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
    });

    if (!isAuthorized) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        status: "REJECTED",
        notes: notes || cert.notes,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Reject cert error:", err);
    res.status(500).json({ error: "Failed to reject certificate" });
  }
});

module.exports = router;