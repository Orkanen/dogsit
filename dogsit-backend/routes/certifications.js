const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// List all approved PET certifications (public)
router.get("/", async (req, res) => {
  try {
    const certs = await prisma.certification.findMany({
      where: { status: "APPROVED", petId: { not: null } }, // only pets
      include: {
        course: true,
        pet: { select: { id: true, name: true } },
        issuingClub: { select: { id: true, name: true } },
        issuingKennel: { select: { id: true, name: true } },
        verifiedByUser: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { issuedAt: "desc" }
    });
    res.json(certs);
  } catch (err) {
    console.error("List certifications error:", err);
    res.status(500).json({ error: "Failed to load certifications", details: err.message });
  }
});

// Request a certification (PET only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { courseId, targetType, targetId, notes } = req.body;
    const actorId = req.user.id;

    // Validate request shape
    if (!courseId || !targetType || !targetId) {
      return res.status(400).json({ error: "Missing required fields: courseId, targetType, targetId" });
    }

    // Enforce PET-only certification for platform-issued certifications
    if (targetType !== "PET") {
      return res.status(400).json({
        error: "Platform-issued certifications are available for PETS only. If you have official user credentials, submit them via the admin paperwork endpoint."
      });
    }

    // Ensure pet exists and is owned by actor
    const pet = await prisma.pet.findUnique({ where: { id: Number(targetId) } });
    if (!pet) return res.status(404).json({ error: "Pet not found" });
    if (pet.ownerId !== actorId) return res.status(403).json({ error: "Only pet owner can request certification for this pet" });

    // duplicate guard (pet certifications only)
    const existing = await prisma.certification.findFirst({
      where: {
        courseId: Number(courseId),
        petId: Number(targetId),
      },
    });
    if (existing) {
      return res.status(409).json({
        error: "Certification already requested for this course and pet",
        existingId: existing.id,
        status: existing.status,
      });
    }

    // Find course and attach issuing ids
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { id: true, kennelId: true, clubId: true, certifierId: true }
    });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const data = {
      courseId: Number(courseId),
      notes: notes?.trim() || null,
      status: "PENDING",
      petId: Number(targetId),
      issuingKennelId: course.kennelId ?? null,
      issuingClubId: course.clubId ?? null,
      verifiedByCertifierId: null,
      verifiedByUserId: null,
    };

    const certification = await prisma.certification.create({ data });

    res.status(201).json(certification);
  } catch (err) {
    console.error("Certification request error:", err);
    res.status(500).json({ error: "Failed to request certification", details: err.message });
  }
});

// GET pending pet certs for clubs/kennels the actor can manage (OWNER/EMPLOYEE)
router.get("/pending", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Kennels where user is OWNER
    const ownedKennels = await prisma.kennel.findMany({
      where: { members: { some: { userId, role: "OWNER" } } },
      select: { id: true },
    });

    // Clubs where user is OWNER or EMPLOYEE
    const ownedClubs = await prisma.club.findMany({
      where: { members: { some: { userId, role: { in: ["OWNER", "EMPLOYEE"] } } } },
      select: { id: true },
    });

    const kennelIds = ownedKennels.map(k => k.id);
    const clubIds = ownedClubs.map(c => c.id);

    const pending = await prisma.certification.findMany({
      where: {
        status: "PENDING",
        petId: { not: null }, // only pet certificates
        OR: [
          kennelIds.length ? { issuingKennelId: { in: kennelIds } } : undefined,
          clubIds.length ? { issuingClubId: { in: clubIds } } : undefined,
        ].filter(Boolean),
      },
      include: {
        course: { select: { title: true, issuerType: true } },
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

// Verify a pending certification (OWNER or EMPLOYEE) — PET only
router.patch("/:id/verify", authenticateToken, async (req, res) => {
  try {
    const certId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const cert = await prisma.certification.findUnique({ where: { id: certId } });
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    // Enforce pet-only verification in platform flow
    if (!cert.petId) {
      return res.status(400).json({ error: "Only pet certifications can be verified via this endpoint. User-issued certificates must be submitted to platform admin for paperwork." });
    }

    let authorized = false;
    if (cert.issuingClubId) {
      const clubCertifier = await prisma.clubMember.findFirst({
        where: { clubId: cert.issuingClubId, userId, role: { in: ["OWNER", "EMPLOYEE"] } },
      });
      if (clubCertifier) authorized = true;
    }
    if (cert.issuingKennelId) {
      const kennelCertifier = await prisma.kennelMember.findFirst({
        where: { kennelId: cert.issuingKennelId, userId, role: "OWNER" },
      });
      if (kennelCertifier) authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: "Not authorized to verify this certification" });

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        verifiedByUserId: userId,
        status: "APPROVED",
        issuedAt: new Date(),
      },
    });

    res.json({ success: true, certification: updated });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Failed to verify certification", details: err.message });
  }
});

// Reject certification (owner/employee/kennel-owner or platform admin) — PET only
router.patch("/:id/reject", authenticateToken, async (req, res) => {
  try {
    const certId = parseInt(req.params.id, 10);
    const actorId = req.user.id;
    const { reason } = req.body;

    const cert = await prisma.certification.findUnique({ where: { id: certId } });
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    if (!cert.petId) {
      return res.status(400).json({ error: "Only pet certifications can be rejected via this endpoint." });
    }

    let authorized = false;

    if (cert.issuingClubId) {
      const member = await prisma.clubMember.findFirst({
        where: { clubId: cert.issuingClubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] } },
      });
      if (member) authorized = true;
    }

    if (cert.issuingKennelId) {
      const member = await prisma.kennelMember.findFirst({
        where: { kennelId: cert.issuingKennelId, userId: actorId, role: "OWNER" },
      });
      if (member) authorized = true;
    }

    // platform admin can also reject
    const isAdmin = await prisma.userRole.findFirst({
      where: {
        userId: actorId,
        role: { is: { name: "admin" } },
      },
    });
    if (isAdmin) authorized = true;

    if (!authorized) return res.status(403).json({ error: "Not authorized to reject this certification" });

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        status: "REJECTED",
        notes: reason?.trim() || cert.notes,
      },
    });

    res.json({ success: true, certification: updated });
  } catch (err) {
    console.error("Reject certification error:", err);
    res.status(500).json({ error: "Failed to reject certification", details: err.message });
  }
});

module.exports = router;