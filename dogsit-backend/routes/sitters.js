const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// SITTERS
router.get("/", async (req, res) => {
  try {
    const users= await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: { in: ["sitter", "kennel"] },
            },
          },
        },
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
          },
        },
      },
      orderBy: { profile: { firstName: "asc" } },
    });

    const sitters = users.map(u => ({
        id: u.id,
        email: u.email,
        profile: u.profile || {}
    }));

    res.json(sitters);
  } catch (err) {
    console.error("GET /sitters error:", err);
    res.status(500).json({ error: "Failed to fetch sitters" });
  }
});

module.exports = router;