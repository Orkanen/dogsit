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

/* ========================================
   2. AUTHENTICATED ROUTES — SPECIFIC FIRST
   ======================================== */

// AUTH: My kennels — clean & quiet
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

    res.json(kennels); // [] if none → perfect
  } catch (err) {
    console.error("[Kennel /my] error:", err); // keep only real errors
    res.status(500).json({ error: "Failed to load your kennels" });
  }
});

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
          pet: { include: { owner: { include: { profile: true } } } },
          kennel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.kennelMembershipRequest.findMany({
        where: { kennelId: { in: kennelIds }, status: "PENDING" },
        include: {
          user: { include: { profile: true } },
          kennel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const requests = [
      ...petRequests.map((r) => ({ ...r, type: "PET_LINK" })),
      ...membershipRequests.map((r) => ({ ...r, type: "MEMBERSHIP" })),
    ];

    res.json(requests);
  } catch (err) {
    console.error("GET /kennel/requests error:", err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

/* ========================================
   3. PUBLIC — Get kennel by numeric ID only
   ======================================== */

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid kennel ID" });
  }

  try {
    const kennel = await prisma.kennel.findUnique({
      where: { id },
      include: {
        members: { select: { userId: true } },
        pets: { select: { id: true } },
      },
    });

    if (!kennel) {
      return res.status(404).json({ error: "Kennel not found" });
    }

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
   4. WRITE ROUTES
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

router.post("/:id/invite", authenticateToken, async (req, res) => {
  const { id: kennelId } = req.params;
  const { email, role = "MEMBER" } = req.body;

  if (!email || !["ADMIN", "MEMBER"].includes(role)) {
    return res.status(400).json({ error: "Valid email and role required" });
  }

  try {
    // Check caller is OWNER
    const membership = await prisma.kennelMember.findUnique({
      where: {
        kennelId_userId: {
          kennelId: parseInt(kennelId),
          userId: req.user.id,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      return res.status(403).json({ error: "Only the kennel owner can invite members" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent duplicate membership
    const existing = await prisma.kennelMember.findUnique({
      where: {
        kennelId_userId: {
          kennelId: parseInt(kennelId),
          userId: user.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add member
    const member = await prisma.kennelMember.create({
      data: {
        kennelId: parseInt(kennelId),
        userId: user.id,
        role,
      },
    });

    res.status(201).json({ message: "Member invited successfully", member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to invite member" });
  }
});

router.post("/:id/request-membership", authenticateToken, async (req, res) => {
  const kennelId = parseInt(req.params.id);
  const { message } = req.body;

  try {
    // Prevent duplicate pending requests
    const existing = await prisma.kennelMembershipRequest.findUnique({
      where: { kennelId_userId: { kennelId, userId: req.user.id } }
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return res.status(400).json({ error: "You already have a pending request" });
      }
      if (existing.status === "ACCEPTED") {
        return res.status(400).json({ error: "You are already a member" });
      }
    }

    const request = await prisma.kennelMembershipRequest.create({
      data: {
        kennelId,
        userId: req.user.id,
        message: message?.trim() || null,
      },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("Membership request error:", err);
    res.status(500).json({ error: "Failed to send request" });
  }
});

router.post("/:id/request-pet", authenticateToken, async (req, res) => {
  const kennelId = parseInt(req.params.id);
  const { petId, message } = req.body;

  // Verify user owns the pet
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: req.user.id }
  });

  if (!pet) {
    return res.status(403).json({ error: "You do not own this pet" });
  }

  try {
    const request = await prisma.kennelPetRequest.create({
      data: {
        kennelId,
        petId,
        message: message?.trim() || null,
      },
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Request already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to send pet link request" });
  }
});

/* ========================================
   5. ACCEPT / REJECT REQUESTS
   ======================================== */

   const handleRequest = (status) => async (req, res) => {
    const reqId = parseInt(req.params.reqId);
    const userId = req.user.id;
  
    try {
      let request = await prisma.kennelPetRequest.findUnique({
        where: { id: reqId },
        include: { kennel: { include: { members: { where: { userId }, select: { role: true } } } } },
      });
  
      let type = "PET_LINK";
      if (!request) {
        request = await prisma.kennelMembershipRequest.findUnique({
          where: { id: reqId },
          include: { kennel: { include: { members: { where: { userId }, select: { role: true } } } } },
        });
        type = "MEMBERSHIP";
      }
  
      if (!request) return res.status(404).json({ error: "Request not found" });
  
      const isOwner = request.kennel.members.some((m) => m.role === "OWNER");
      if (!isOwner) return res.status(403).json({ error: "Only owner can process requests" });
  
      if (request.status !== "PENDING") {
        return res.status(400).json({ error: "Request already processed" });
      }
  
      if (status === "ACCEPTED") {
        if (type === "PET_LINK") {
          await prisma.pet.update({
            where: { id: request.petId },
            data: { kennelId: request.kennelId },
          });
        } else {
          await prisma.kennelMember.create({
            data: { kennelId: request.kennelId, userId: request.userId, role: "MEMBER" },
          });
        }
      }
  
      const table = type === "PET_LINK" ? prisma.kennelPetRequest : prisma.kennelMembershipRequest;
      const updated = await table.update({
        where: { id: reqId },
        data: { status },
      });
  
      res.json({ ...updated, type });
    } catch (err) {
      console.error("handleRequest error:", err);
      res.status(500).json({ error: "Failed to process request" });
    }
  };
  
  router.patch("/requests/:reqId/accept", authenticateToken, handleRequest("ACCEPTED"));
  router.patch("/requests/:reqId/reject", authenticateToken, handleRequest("REJECTED"));
  
  module.exports = router;