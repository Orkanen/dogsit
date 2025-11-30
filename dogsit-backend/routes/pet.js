const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { canManagePet } = require("../middleware/petAuth");

const router = express.Router();
const prisma = new PrismaClient();

/* --------------------------------------------------------------
   CREATE PET – owner only (no kennelId allowed)
   -------------------------------------------------------------- */
   router.post("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    let { kennelId, ...petData } = req.body;
  
    // Convert to number safely
    kennelId = kennelId ? Number(kennelId) : null;
  
    try {
      // CASE 1: User claims a kennel → check if they own it
      if (kennelId) {
        const membership = await prisma.kennelMember.findUnique({
          where: {
            kennelId_userId: { kennelId, userId },
          },
        });
  
        if (membership && membership.role === "OWNER") {
          // USER OWNS THE KENNEL → auto-link, no request
          petData.kennelId = kennelId;
        } else {
          // User does NOT own kennel → force kennelId = null, will send request later
          petData.kennelId = null;
        }
      }
  
      // Always set owner
      const pet = await prisma.pet.create({
        data: {
          ...petData,
          ownerId: userId,
          age: petData.age ? Number(petData.age) : null,
        },
      });
  
      res.status(201).json(pet);
    } catch (err) {
      console.error("Create pet error:", err);
      res.status(500).json({ error: "Failed to create pet" });
    }
  });

/* --------------------------------------------------------------
   READ – my pets (owner only)
   -------------------------------------------------------------- */
    router.get("/my", authenticateToken, async (req, res) => {
        const userId = req.user.id;
    
        try {
        const pets = await prisma.pet.findMany({
            where: { ownerId: userId },
            include: {
            images: true,
            kennel: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    
        res.json(pets);
        } catch (err) {
        console.error("GET /pets/my error:", err);
        res.status(500).json({ error: "Failed to fetch your pets" });
        }
    });


/* --------------------------------------------------------------
   READ – single pet (PUBLIC)
   -------------------------------------------------------------- */
   router.get("/:id", async (req, res) => {
    const petId = parseInt(req.params.id, 10);
  
    // ---- validate ID ----
    if (!petId || isNaN(petId)) {
      return res.status(400).json({ error: "Invalid pet ID" });
    }
  
    try {
      const pet = await prisma.pet.findUnique({
        where: { id: petId },               // correct Prisma syntax
        include: {
          certifications: {
            where: { status: "APPROVED" },
            include: { course: true }
          },
          owner: { select: { id: true, email: true } },
          kennel: { select: { id: true, name: true } },
          images: true,
          awards: { include: { image: true } },
          parentMother: { select: { id: true, name: true } },
          parentFather: { select: { id: true, name: true } },
          children: { select: { id: true, name: true } },
        },
      });
  
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
  
      res.json(pet);
    } catch (err) {
      console.error("GET /pets/:id error:", err);
      res.status(500).json({ error: "Failed to fetch pet" });
    }
  });
/* --------------------------------------------------------------
   UPDATE – uses canManagePet
   -------------------------------------------------------------- */
router.put("/:id", authenticateToken, canManagePet, async (req, res) => {
  const petId = parseInt(req.params.id);
  const { name, species, breed, color, sex, age } = req.body;

  try {
    const pet = await prisma.pet.update({
      where: { id: petId },
      data: { name, species, breed, color, sex, age: age ? +age : null },
      include: { images: true },
    });
    res.json(pet);
  } catch (err) {
    console.error(err);
    if (err.code === "P2002")
      return res.status(409).json({ error: "Pet name already taken" });
    res.status(500).json({ error: "Failed to update pet" });
  }
});

/* --------------------------------------------------------------
   DELETE – uses canManagePet
   -------------------------------------------------------------- */
router.delete("/:id", authenticateToken, canManagePet, async (req, res) => {
  const petId = parseInt(req.params.id);
  try {
    await prisma.pet.delete({ where: { id: petId } });
    res.json({ message: "Pet deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete pet" });
  }
});

/* --------------------------------------------------------------
   ATTACH IMAGE
   -------------------------------------------------------------- */
router.post("/:id/image", authenticateToken, canManagePet, async (req, res) => {
  const petId = parseInt(req.params.id);
  const { imageId } = req.body;

  try {
    const image = await prisma.image.update({
      where: { id: imageId },
      data: { petId },
    });
    res.json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to attach image" });
  }
});

router.post("/:petId/request-link", authenticateToken, async (req, res) => {
  const { kennelId, message } = req.body;
  const petId = Number(req.params.petId);
  const userId = req.user.id;

  try {
    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.ownerId !== userId) {
      return res.status(403).json({ error: "Not your pet" });
    }

    await prisma.kennelPetRequest.create({
      data: {
        kennelId,
        petId,
        message: message || "Please verify this pet belongs to your kennel",
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send request" });
  }
});

module.exports = router;