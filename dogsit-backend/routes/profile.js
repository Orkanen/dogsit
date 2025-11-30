const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/* --------------------------------------------------------------
   GET /profile
   -------------------------------------------------------------- */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            location: true,
            pricePerDay: true,
            publicEmail: true,
            publicPhone: true,
            sitterDescription: true,
            availability: { select: { period: true } },
            services: { select: { service: { select: { name: true } } } },
            breedExperience: { select: { breed: true } },
            user: { 
              select: { 
                certifications: { 
                  where: { status: "APPROVED" },
                  include: { course: true }
                } 
              } 
            },
          },
        },
        roles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const roles = user.roles.map((r) => r.role.name);
    const profile = user.profile || {};

    res.json({
      id: user.id,
      email: user.email,
      roles,
      profile: {
        ...profile,
        availability: profile.availability?.map((a) => a.period) || [],
        services: profile.services?.map((s) => s.service.name) || [],
        breedExperience: profile.breedExperience?.map((b) => b.breed) || [],
        certifications: user.profile?.user?.certifications || [],
      },
    });
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ error: "Error retrieving profile" });
  }
});
/* --------------------------------------------------------------
   POST /profile – upsert with all sitter fields
   -------------------------------------------------------------- */
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const {
    firstName,
    lastName,
    bio,
    location,
    pricePerDay,
    publicEmail,
    publicPhone,
    sitterDescription,
    availability = [],        // array of strings: ["MORNING", "DAY"]
    services = [],            // array of service names
    breedExperience = [],     // array of breed strings
  } = req.body;

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        bio: bio ?? null,
        location: location ?? null,
        pricePerDay: pricePerDay ? Number(pricePerDay) : null,
        publicEmail: publicEmail ?? null,
        publicPhone: publicPhone ?? null,
        sitterDescription: sitterDescription ?? null,
        availability: {
          deleteMany: {},
          create: availability.map((period) => ({ period })),
        },
        services: {
          deleteMany: {},
          create: services.map((name) => ({
            service: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        breedExperience: {
          deleteMany: {},
          create: breedExperience.map((breed) => ({ breed })),
        },
      },
      create: {
        userId,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        bio: bio ?? null,
        location: location ?? null,
        pricePerDay: pricePerDay ? Number(pricePerDay) : null,
        publicEmail: publicEmail ?? null,
        publicPhone: publicPhone ?? null,
        sitterDescription: sitterDescription ?? null,
        availability: {
          create: availability.map((period) => ({ period })),
        },
        services: {
          create: services.map((name) => ({
            service: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        breedExperience: {
          create: breedExperience.map((breed) => ({ breed })),
        },
      },
      include: {
        availability: true,
        services: { include: { service: true } },
        breedExperience: true,
      },
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