const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// SITTERS
router.get("/", async (req, res) => {
  const {
    period,
    service,
    location,
    maxPrice,
  } = req.query;

  try {
    const sitters = await prisma.profile.findMany({
      where: {
        // ONLY users who have the "sitter" role
        user: {
          roles: {
            some: {
              role: {
                name: "sitter"
              }
            }
          }
        },
        ...(period && {
          availability: { some: { period } },
        }),
        ...(service && {
          services: { some: { service: { name: service } } },
        }),
        ...(location && {
          location: { contains: location, mode: "insensitive" },
        }),
        ...(maxPrice && {
          pricePerDay: { lte: Number(maxPrice) },
        }),
      },
      include: {
        availability: true,
        services: { include: { service: true } },
        breedExperience: true,
      },
      orderBy: { firstName: "asc" },
    });

    const formatted = sitters.map((p) => ({
      id: p.userId,
      firstName: p.firstName || "Sitter",
      lastName: p.lastName || "",
      location: p.location || "",
      bio: p.bio || "",
      pricePerDay: p.pricePerDay,
      publicEmail: p.publicEmail,
      publicPhone: p.publicPhone,
      sitterDescription: p.sitterDescription || "",
      services: p.services.map(s => s.service.name),
      availability: p.availability.map(a => a.period),
      breedExperience: p.breedExperience.map(b => b.breed),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /sitters error:", err);
    res.status(500).json({ error: "Failed to fetch sitters" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

  try {
    // INCLUDE THE USER + ROLES
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true }
            }
          }
        },
        availability: true,
        services: { include: { service: true } },
        breedExperience: true,
      },
    });

    // NOW THIS IS SAFE
    if (!profile) {
      return res.status(404).json({ message: "Sitter not found" });
    }

    const hasSitterRole = profile.user?.roles?.some(r => r.role.name === "sitter");

    if (!hasSitterRole) {
      return res.status(404).json({ message: "Sitter not found" });
    }

    // Return flat structure (same as /sitters list)
    res.json({
      id: profile.userId,
      firstName: profile.firstName || "Sitter",
      lastName: profile.lastName || "",
      location: profile.location || "",
      bio: profile.bio || "",
      pricePerDay: profile.pricePerDay,
      publicEmail: profile.publicEmail,
      publicPhone: profile.publicPhone,
      sitterDescription: profile.sitterDescription || "",
      services: profile.services.map(s => s.service.name),
      availability: profile.availability.map(a => a.period),
      breedExperience: profile.breedExperience.map(b => b.breed),
    });
  } catch (err) {
    console.error("GET /sitters/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;