const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

/* ========================================
   1. PUBLIC ROUTES
   ======================================== */

router.get("/", async (req, res) => {
  try {
    const kennels = await prisma.kennel.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        members: { select: { userId: true } },
        pets: { select: { id: true } },
      },
    });

    const formatted = kennels.map((k) => ({
      id: k.id,
      name: k.name,
      location: k.location,
      memberCount: k.members.length,
      dogCount: k.pets.length,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /kennel error:", err);
    res.status(500).json({ error: "Failed to fetch kennels" });
  }
});

// IMPORTANT: Specific routes MUST come before parameterized ones
/* ========================================
   2. AUTH — MY KENNELS (quiet & safe)
   ======================================== */

   router.get("/my", authenticateToken, async (req, res) => {
    try {
      const memberships = await prisma.kennelMember.findMany({
        where: { userId: req.user.id },
        include: {
          kennel: {
            include: {
              pets: true,
              members: { select: { userId: true } },
            },
          },
        },
      });
  
      const kennels = memberships.map((m) => ({
        ...m.kennel,
        myRole: m.role,
        memberCount: m.kennel.members.length,
        dogCount: m.kennel.pets.length,
      }));
  
      res.json(kennels);
    } catch (err) {
      console.error("[Kennel /my] error:", err);
      res.status(500).json({ error: "Failed to load your kennels" });
    }
});

/* ========================================
   3. UNIFIED REQUESTS INBOX (MEMBERSHIP + PET LINK)
   ======================================== */

router.get("/requests", authenticateToken, async (req, res) => {
  try {
    const ownerMemberships = await prisma.kennelMember.findMany({
      where: { userId: req.user.id, role: "OWNER" },
      select: { kennelId: true },
    });

    const kennelIds = ownerMemberships.map((m) => m.kennelId);
    if (kennelIds.length === 0) return res.json([]);

    const [petRequests, membershipRequests] = await Promise.all([
      prisma.kennelPetRequest.findMany({
        where: { kennelId: { in: kennelIds }, status: "PENDING" },
        include: {
          pet: {
            include: {
              images: { take: 1 },
              owner: { include: { profile: true } },
            },
          },
          kennel: { select: { name: true } },
        },
      }),
      prisma.kennelMembershipRequest.findMany({
        where: { kennelId: { in: kennelIds }, status: "PENDING" },
        include: {
          user: { include: { profile: true } },
          kennel: { select: { name: true } },
        },
      }),
    ]);

    const requests = [
      ...petRequests.map((r) => ({ ...r, type: "PET_LINK" })),
      ...membershipRequests.map((r) => ({ ...r, type: "MEMBERSHIP" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(requests);
  } catch (err) {
    console.error("GET /kennel/requests error:", err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

// Parameterized routes go last
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid kennel ID" });

  try {
    const kennel = await prisma.kennel.findUnique({
      where: { id },
      include: {
        members: { select: { userId: true } },
        pets: { select: { id: true } },
      },
    });

    if (!kennel) return res.status(404).json({ error: "Kennel not found" });

    res.json({
      id: kennel.id,
      name: kennel.name,
      location: kennel.location || null,
      memberCount: kennel.members.length,
      dogCount: kennel.pets.length,
    });
  } catch (err) {
    console.error("GET /kennel/:id error:", err);
    res.status(500).json({ error: "Failed to fetch kennel" });
  }
});


/* ========================================
   4. CREATE KENNEL
   ======================================== */

router.post("/", authenticateToken, async (req, res) => {
  const { name, location } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });

  try {
    const kennel = await prisma.$transaction(async (tx) => {
      const created = await tx.kennel.create({
        data: { name: name.trim(), location: location?.trim() || null },
      });
      await tx.kennelMember.create({
        data: { kennelId: created.id, userId: req.user.id, role: "OWNER" },
      });
      return created;
    });

    res.status(201).json(kennel);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Kennel name already exists" });
    }
    console.error("Create kennel error:", err);
    res.status(500).json({ error: "Failed to create kennel" });
  }
});

/* ========================================
   5. MEMBERSHIP REQUESTS
   ======================================== */

router.post("/:id/request-membership", authenticateToken, async (req, res) => {
  const kennelId = parseInt(req.params.id);
  const { message } = req.body;

  try {
    const existing = await prisma.kennelMembershipRequest.findUnique({
      where: { kennelId_userId: { kennelId, userId: req.user.id } },
    });

    if (existing?.status === "PENDING") {
      return res.status(400).json({ error: "You already have a pending request" });
    }
    if (existing?.status === "ACCEPTED") {
      return res.status(400).json({ error: "You are already a member" });
    }

    const request = await prisma.kennelMembershipRequest.create({
      data: {
        kennelId,
        userId: req.user.id,
        message: message?.trim() || null,
        type: "MEMBERSHIP",
      },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("Membership request error:", err);
    res.status(500).json({ error: "Failed to send request" });
  }
});

/* ========================================
   6. PET VERIFICATION REQUEST (NEW!)
   ======================================== */
  router.post("/:id/request-pet", authenticateToken, async (req, res) => {
    const kennelId = parseInt(req.params.id);
    const { petId, message } = req.body;
  
    if (!petId) return res.status(400).json({ error: "petId is required" });
  
    try {
      // 1. Verify pet ownership
      const pet = await prisma.pet.findFirst({
        where: { id: parseInt(petId), ownerId: req.user.id },
        select: { id: true, kennelId: true }
      });
  
      if (!pet) return res.status(403).json({ error: "You do not own this pet" });
  
      // 2. BLOCK if already linked to ANY kennel
      if (pet.kennelId) {
        return res.status(400).json({ error: "This pet is already officially registered with a kennel" });
      }
  
      // 3. BLOCK if there's already a PENDING request (any kennel)
      const existingPending = await prisma.kennelPetRequest.findFirst({
        where: {
          petId: parseInt(petId),
          status: "PENDING"
        }
      });
  
      if (existingPending) {
        return res.status(400).json({ 
          error: "You already have a pending verification request",
          existingRequest: existingPending
        });
      }
  
      // 4. Create the request
      const request = await prisma.kennelPetRequest.create({
        data: {
          kennelId,
          petId: parseInt(petId),
          message: message?.trim() || null,
          type: "PET_LINK"
        },
        include: {
          pet: { 
            include: { 
              images: { take: 1 }, 
              owner: { include: { profile: true } } 
            } 
          },
          kennel: true,
        },
      });
  
      res.status(201).json(request);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Request conflict" });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to create request" });
    }
});

/* ========================================
   7. ACCEPT / REJECT ANY REQUEST (UNIFIED)
   ======================================== */

   const handleRequestResponse = (status) => async (req, res) => {
    const requestId = parseInt(req.params.reqId);
  
    try {
      // 1. Try PET verification request
      let request = await prisma.kennelPetRequest.findUnique({
        where: { id: requestId },
        include: { kennel: true, pet: true }, // ← include pet for PET_LINK
      });
  
      let type = "PET_LINK";
      let table = prisma.kennelPetRequest;
  
      // 2. If not found → try MEMBERSHIP request
      if (!request) {
        request = await prisma.kennelMembershipRequest.findUnique({
          where: { id: requestId },
          include: { kennel: true },
        });
        type = "MEMBERSHIP";
        table = prisma.kennelMembershipRequest;
      }
  
      if (!request) return res.status(404).json({ error: "Request not found" });
  
      // Authorization
      const isOwner = await prisma.kennelMember.count({
        where: {
          kennelId: request.kennelId,
          userId: req.user.id,
          role: "OWNER",
        },
      }) > 0;
  
      if (!isOwner) return res.status(403).json({ error: "Only kennel owner can process requests" });
      if (request.status !== "PENDING") {
        return res.status(400).json({ error: "Request already processed" });
      }
  
      // 3. ACCEPT logic — only do relevant action
      if (status === "ACCEPTED") {
        if (type === "PET_LINK" && request.petId) {
          await prisma.pet.update({
            where: { id: request.petId },
            data: { kennelId: request.kennelId },
          });
        } else if (type === "MEMBERSHIP" && request.userId) {
          await prisma.kennelMember.create({
            data: {
              kennelId: request.kennelId,
              userId: request.userId,
              role: "MEMBER",
            },
          });
        }
      }
  
      // 4. Update status
      const updated = await table.update({
        where: { id: requestId },
        data: { status },
      });
  
      res.json({ ...updated, type });
    } catch (err) {
      console.error(`Handle ${status} error:`, err);
      res.status(500).json({ error: "Failed to process request" });
    }
  };

router.post("/requests/:reqId/revoke", authenticateToken, async (req, res) => {
  const requestId = parseInt(req.params.reqId);
  const { reason } = req.body; // optional: "Sold", "Error", "Fraud", etc.

  try {
    const request = await prisma.kennelPetRequest.findUnique({
      where: { id: requestId },
      include: { kennel: true, pet: true },
    });

    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "ACCEPTED") {
      return res.status(400).json({ error: "Only accepted verifications can be revoked" });
    }

    // Must be OWNER of the kennel
    const isOwner = await prisma.kennelMember.count({
      where: { kennelId: request.kennelId, userId: req.user.id, role: "OWNER" },
    }) > 0;

    if (!isOwner) return res.status(403).json({ error: "Only kennel owner can revoke" });

    // Revoke: remove kennelId from pet + mark request as REVOKED
    await prisma.$transaction([
      prisma.pet.update({
        where: { id: request.petId },
        data: { kennelId: null },
      }),
      prisma.kennelPetRequest.update({
        where: { id: requestId },
        data: { 
          status: "REVOKED",
          revokedAt: new Date(),
          revokeReason: reason?.trim() || null,
        },
      }),
    ]);

    res.json({ message: "Verification revoked", revoked: true });
  } catch (err) {
    console.error("Revoke error:", err);
    res.status(500).json({ error: "Failed to revoke verification" });
  }
});

router.post("/pet/:petId/remove-verification", authenticateToken, async (req, res) => {
  const petId = parseInt(req.params.petId);

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { id: true, ownerId: true, kennelId: true }
    });

    if (!pet) return res.status(404).json({ error: "Pet not found" });
    if (pet.ownerId !== req.user.id) return res.status(403).json({ error: "Not your pet" });
    if (!pet.kennelId) return res.status(400).json({ error: "Pet has no kennel verification" });

    // CRITICAL: Clean up both the link AND the old request
    await prisma.$transaction([
      prisma.pet.update({
        where: { id: petId },
        data: { kennelId: null }
      }),
      // Delete ALL requests between this pet and the old kennel
      prisma.kennelPetRequest.deleteMany({
        where: {
          petId,
          kennelId: pet.kennelId
        }
      })
    ]);

    res.json({ message: "Kennel verification removed and history cleared" });
  } catch (err) {
    console.error("Remove verification error:", err);
    res.status(500).json({ error: "Failed to remove verification" });
  }
});

router.get("/my/managed", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all kennels where user is OWNER or EMPLOYEE
    const memberships = await prisma.kennelMember.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
      },
      include: {
        kennel: {
          include: {
            pets: { select: { id: true } },
            members: true,
          },
        },
      },
    });

    const kennels = memberships.map(m => ({
      ...m.kennel,
      myRole: m.role,
      memberCount: m.kennel.members.length,
      dogCount: m.kennel.pets.length,
    }));

    const kennelIds = kennels.map(k => k.id);

    let requests = [];
    if (kennelIds.length > 0) {
      const [petRequests, membershipRequests] = await Promise.all([
        prisma.kennelPetRequest.findMany({
          where: { kennelId: { in: kennelIds }, status: "PENDING" },
          include: {
            pet: {
              include: {
                images: { take: 1 },
                owner: { include: { profile: true } },
              },
            },
            kennel: true,
          },
        }),
        prisma.kennelMembershipRequest.findMany({
          where: { kennelId: { in: kennelIds }, status: "PENDING" },
          include: {
            user: { include: { profile: true } },
            kennel: true,
          },
        }),
      ]);

      requests = [
        ...petRequests.map(r => ({ ...r, type: "PET_LINK" })),
        ...membershipRequests.map(r => ({ ...r, type: "MEMBERSHIP" })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ kennels, requests });
  } catch (err) {
    console.error("getManagedData error:", err);
    res.status(500).json({ error: "Failed to load managed data" });
  }
});

router.patch("/requests/:reqId/accept", authenticateToken, handleRequestResponse("ACCEPTED"));
router.patch("/requests/:reqId/reject", authenticateToken, handleRequestResponse("REJECTED"));

/* ======================================== */

module.exports = router;