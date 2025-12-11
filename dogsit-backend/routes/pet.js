const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { canManagePet } = require("../middleware/petAuth");

const router = express.Router();
const prisma = new PrismaClient();

/* --------------------------------------------------------------
   CREATE PET – owner only
   -------------------------------------------------------------- */
   router.post("/", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    let { kennelId: rawKennelId, name, species, breed, color, sex, age } = req.body;
  
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  
    // Convert safely without reassigning const
    const kennelId = rawKennelId ? Number(rawKennelId) : null;
    const parsedAge = age ? Number(age) : null;
  
    if (parsedAge !== null && !Number.isFinite(parsedAge)) {
      return res.status(400).json({ error: "Age must be a valid number" });
    }
    if (sex && !["MALE", "FEMALE"].includes(sex)) {
      return res.status(400).json({ error: "Sex must be MALE or FEMALE" });
    }
  
    try {
      let finalKennelId = null;
  
      // If user claims a kennel → verify they own it
      if (kennelId) {
        const membership = await prisma.kennelMember.findUnique({
          where: { kennelId_userId: { kennelId, userId } },
        });
  
        if (membership?.role === "OWNER") {
          finalKennelId = kennelId;
        }
        // else: leave null → user will request verification later
      }
  
      const pet = await prisma.pet.create({
        data: {
          name: name.trim(),
          species: species?.trim() || null,
          breed: breed?.trim() || null,
          color: color?.trim() || null,
          sex,
          age: parsedAge,
          ownerId: userId,
          kennelId: finalKennelId,
        },
      });
  
      res.status(201).json(pet);
    } catch (err) {
      console.error("Create pet error:", err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "A pet with this name already exists in this kennel" });
      }
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

  if (isNaN(petId)) return res.status(400).json({ error: "Invalid pet ID" });

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        certifications: {
          where: { status: "APPROVED" },
          include: { course: true },
        },
        owner: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } }, // Limit to name only for public
        kennel: { select: { id: true, name: true } },
        images: true,
        awards: { include: { image: true } },
        parentMother: { select: { id: true, name: true } },
        parentFather: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
      },
    });

    if (!pet) return res.status(404).json({ error: "Pet not found" });

    res.json(pet);
  } catch (err) {
    console.error("GET /pets/:id error:", err);
    res.status(500).json({ error: "Failed to fetch pet" });
  }
});

/* --------------------------------------------------------------
   UPDATE PET – owner only
   -------------------------------------------------------------- */
   router.patch("/:id", authenticateToken, canManagePet, async (req, res) => {
    const petId = Number(req.params.id);
    const { name, species, breed, color, sex, age } = req.body;
  
    const parsedAge = age !== undefined ? Number(age) : undefined;
  
    try {
      const updated = await prisma.pet.update({
        where: { id: petId },
        data: {
          name: name?.trim(),
          species: species?.trim() || undefined,
          breed: breed?.trim() || undefined,
          color: color?.trim() || undefined,
          sex,
          age: parsedAge,
        },
        include: { images: true, kennel: { select: { id: true, name: true } } },
      });
  
      res.json(updated);
    } catch (err) {
      console.error("Update pet error:", err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Pet name already taken in kennel" });
      }
      res.status(500).json({ error: "Failed to update pet" });
    }
  });

/* --------------------------------------------------------------
   DELETE – uses canManagePet
   -------------------------------------------------------------- */
router.delete("/:id", authenticateToken, canManagePet, async (req, res) => {
  const petId = parseInt(req.params.id, 10);

  try {
    await prisma.$transaction(async (tx) => {
      // Clean up related records
      await tx.certification.deleteMany({ where: { petId } });
      await tx.courseEnrollment.deleteMany({ where: { petId } });
      await tx.competitionEntry.deleteMany({ where: { petId } });
      await tx.award.deleteMany({ where: { petId } });
      await tx.kennelPetRequest.deleteMany({ where: { petId } });
      await tx.image.deleteMany({ where: { petId } });

      // Delete pet
      await tx.pet.delete({ where: { id: petId } });
    });

    res.json({ message: "Pet deleted" });
  } catch (err) {
    console.error("Delete pet error:", err);
    res.status(500).json({ error: "Failed to delete pet" });
  }
});

/* --------------------------------------------------------------
   ATTACH IMAGE
   -------------------------------------------------------------- */
router.post("/:id/image", authenticateToken, canManagePet, async (req, res) => {
  const petId = parseInt(req.params.id, 10);
  const { imageId } = req.body;

  try {
    const image = await prisma.image.update({
      where: { id: imageId },
      data: { petId },
    });
    res.json(image);
  } catch (err) {
    console.error("Attach image error:", err);
    res.status(500).json({ error: "Failed to attach image" });
  }
});

/* --------------------------------------------------------------
   REQUEST KENNEL LINK
   -------------------------------------------------------------- */
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