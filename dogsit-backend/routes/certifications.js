const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// 1. List all approved certifications (public)
router.get("/", async (req, res) => {
  const certs = await prisma.certification.findMany({
    where: { status: "APPROVED" },
    include: {
      course: true,
      user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
      pet: { select: { id: true, name: true } }
    },
    orderBy: { issuedAt: "desc" }
  });
  res.json(certs);
});

// 2. Request a certification (user or pet owner)
router.post("/", authenticateToken, async (req, res) => {
    try {
      const { courseId, targetType, targetId, notes } = req.body;
      const userId = req.user.id;
      const existing = await prisma.certification.findFirst({
        where: {
          courseId: Number(courseId),
          ...(targetType === "PET" ? { petId: Number(targetId) } : { userId: Number(targetId) }),
        },
      });
      
      if (existing) {
        return res.status(409).json({
          error: "Certification already requested for this course",
          existingId: existing.id,
          status: existing.status,
        });
      }
  
      if (!courseId || !targetType || !targetId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Find which kennel/club issued the course
      const course = await prisma.course.findUnique({
        where: { id: Number(courseId) },
        include: {
          kennel: { select: { id: true } },
          club: { select: { id: true } },
        },
      });
  
      if (!course) return res.status(404).json({ error: "Course not found" });
  
      const data = {
        courseId: Number(courseId),
        notes: notes?.trim() || null,
        status: "PENDING",
        [targetType === "PET" ? "petId" : "userId"]: Number(targetId),
        issuingKennelId: course.kennelId || null,
        issuingClubId: course.clubId || null,
      };
  
      const certification = await prisma.certification.create({ data });
  
      res.status(201).json(certification);
    } catch (err) {
      console.error("Certification request error:", err);
      res.status(500).json({ error: "Failed to request certification", details: err.message });
    }
  });

// 3. Admin: List pending for my club/kennel
router.get("/pending", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Find kennels & clubs the user owns (for issuing)
      const ownedKennels = await prisma.kennel.findMany({
        where: { members: { some: { userId, role: "OWNER" } } },
        select: { id: true },
      });
  
      const ownedClubs = await prisma.club.findMany({
        where: { members: { some: { userId } } }, // adjust if club has ownership
        select: { id: true },
      });
  
      const kennelIds = ownedKennels.map(k => k.id);
      const clubIds = ownedClubs.map(c => c.id);
  
      const pending = await prisma.certification.findMany({
        where: {
          status: "PENDING",
          OR: [
            { issuingKennelId: { in: kennelIds } },
            { issuingClubId: { in: clubIds } },
          ],
        },
        include: {
          course: { select: { title: true, issuerType: true } },
          user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
          pet: { select: { id: true, name: true, breed: true } },
          issuingKennel: { select: { id: true, name: true } },
          issuingClub: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
  
      res.json(pending);
    } catch (err) {
      console.error("Pending certifications error:", err);
      res.status(500).json({ error: "Failed to load pending certifications", details: err.message });
    }
  });
// 4. Approve / Reject
router.patch("/:id/approve", authenticateToken, async (req, res) => {
  await prisma.certification.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "APPROVED", issuedAt: new Date() }
  });
  res.json({ success: true });
});

router.patch("/:id/reject", authenticateToken, async (req, res) => {
  await prisma.certification.update({
    where: { id: parseInt(req.params.id) },
    data: { status: "REJECTED" }
  });
  res.json({ success: true });
});

module.exports = router;