const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// SITTERS
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: "sitter" }
          }
        }
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            location: true,
            bio: true,
            servicesOffered: true,
            pricePerDay: true,
            availability: true,
            publicEmail: true,
            publicPhone: true,
            sitterDescription: true,
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { profile: { firstName: "asc" } }
    });

    const sitters = users
      .filter(u => u.roles.some(r => r.role.name === "sitter"))
      .map(u => ({
        id: u.id,
        profile: u.profile || {}
      }));

    res.json(sitters);
  } catch (err) {
    console.error("GET /sitters error:", err);
    res.status(500).json({ error: "Failed to fetch sitters" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            location: true,
            bio: true,
            servicesOffered: true,
            pricePerDay: true,
            availability: true,
            publicEmail: true,
            publicPhone: true,
            sitterDescription: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const p = user.profile || {};

    res.json({
      id: user.id,
      profile: {
        firstName: p.firstName || "Sitter",
        lastName: p.lastName || "",
        location: p.location || "",
        bio: p.bio || "",
        servicesOffered: p.servicesOffered || "",
        pricePerDay: p.pricePerDay ?? null,
        availability: Array.isArray(p.availability) ? p.availability : [],
        publicEmail: p.publicEmail ?? null,
        publicPhone: p.publicPhone ?? null,
        sitterDescription: p.sitterDescription || "",
      }
    });
  } catch (err) {
    console.error("GET /sitters/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;