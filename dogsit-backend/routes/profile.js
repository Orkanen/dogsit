const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/* --------------------------------------------------------------
   GET /profile – user + profile + ALL roles
   -------------------------------------------------------------- */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        roles: {
          include: { role: true }
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const roles = user.roles.map((ur) => ur.role.name);

    res.json({
      id: user.id,
      email: user.email,
      roles,
      profile: user.profile ?? {},
    });
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ error: "Error retrieving profile" });
  }
});

/* --------------------------------------------------------------
   POST /profile – update profile fields (unchanged)
   -------------------------------------------------------------- */
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    firstName,
    lastName,
    bio,
    location,
    dogBreed,
    servicesOffered,
  } = req.body;

  try {
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing)
      return res.status(404).json({ error: "Profile not found. Use registration flow." });

    const profile = await prisma.profile.update({
      where: { userId },
      data: { firstName, lastName, bio, location, dogBreed, servicesOffered },
    });

    res.json(profile);
  } catch (err) {
    console.error("POST /profile error:", err);
    res.status(500).json({ error: "Error updating profile" });
  }
});

/* --------------------------------------------------------------
   PATCH /profile/roles – replace user roles
   -------------------------------------------------------------- */
router.patch("/roles", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.some((r) => typeof r !== "string")) {
    return res.status(400).json({ error: "roles must be an array of strings" });
  }

  try {
    // 1. Delete old
    await prisma.userRole.deleteMany({ where: { userId } });

    // 2. Resolve role IDs
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles } },
    });

    const missing = roles.filter(
      (r) => !roleRecords.some((rec) => rec.name === r)
    );
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Invalid role(s): ${missing.join(", ")}` });
    }

    // 3. Insert new
    const data = roleRecords.map((r) => ({ userId, roleId: r.id }));
    await prisma.userRole.createMany({ data });

    res.json({ message: "Roles updated", roles });
  } catch (err) {
    console.error("PATCH /profile/roles error:", err);
    res.status(500).json({ error: "Failed to update roles" });
  }
});

module.exports = router;