const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET PROFILE
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        roles: { include: { role: true } }
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const roleName = user.roles[0]?.role.name || "unknown";

    res.json({
      id: user.id,
      email: user.email,
      role: roleName,
      profile: user.profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error retrieving profile" });
  }
});

// UPDATE PROFILE
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, bio, location, dogBreed, servicesOffered } = req.body;

  try {
    const existingProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!existingProfile)
      return res.status(404).json({ error: "Profile not found. Use registration flow." });

    const profile = await prisma.profile.update({
      where: { userId },
      data: { firstName, lastName, bio, location, dogBreed, servicesOffered }
    });

    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Error updating profile" });
  }
});

module.exports = router;