const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient().$extends({
  name: 'kennelRequests',
  model: {
    kennelPetRequest: true,
    kennelMembershipRequest: true,
  },
});

const router = express.Router();


// PUBLIC: List all kennels
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

    const formatted = kennels.map(k => ({
      id: k.id,
      name: k.name,
      location: k.location,
      memberCount: k.members.length,
      dogCount: k.pets.length,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch kennels" });
  }
});

// AUTH: My kennels (kennels where I am a member, especially owner)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const memberships = await prisma.kennelMember.findMany({
      where: { userId: req.user.id },
      include: {
        kennel: {
          include: {
            pets: true,
            members: { select: { userId: true } },
          }
        }
      }
    });

    const kennels = memberships.map(m => ({
      ...m.kennel,
      myRole: m.role,
      memberCount: m.kennel.members.length,
      dogCount: m.kennel.pets.length,
    }));

    res.json(kennels);
  } catch (err) {
    console.error("GET /my error:", err);
    res.status(500).json({ error: "Failed to load your kennels" });
  }
});

// AUTH: Pending requests (only for kennels where I am OWNER)
router.get("/requests", authenticateToken, async (req, res) => {
  try {
    // Find all kennels where user is OWNER
    const ownerMemberships = await prisma.kennelMember.findMany({
      where: { userId: req.user.id, role: "OWNER" },
      select: { kennelId: true },
    });

    const kennelIds = ownerMemberships.map(m => m.kennelId);
    if (kennelIds.length === 0) return res.json([]);

    // Fetch BOTH types of pending requests
    const [petRequests, membershipRequests] = await Promise.all([
      prisma.kennelPetRequest.findMany({
        where: { kennelId: { in: kennelIds }, status: "PENDING" },
        include: {
          pet: {
            include: {
              owner: { include: { profile: true } }
            }
          },
          kennel: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.kennelMembershipRequest.findMany({
        where: { kennelId: { in: kennelIds }, status: "PENDING" },
        include: {
          user: { include: { profile: true } },
          kennel: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Combine and add type
    const requests = [
      ...petRequests.map(r => ({ ...r, type: "PET_LINK" })),
      ...membershipRequests.map(r => ({ ...r, type: "MEMBERSHIP" }))
    ];

    res.json(requests);
  } catch (err) {
    console.error("GET /requests error:", err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

// POST /kennel/member — auto-add creator as OWNER
router.post("/member", authenticateToken, async (req, res) => {
  const { kennelId, role = "MEMBER" } = req.body;
  try {
    const member = await prisma.kennelMember.create({
      data: {
        kennelId,
        userId: req.user.id,
        role,
      },
    });
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: "Already a member" });
  }
});

// POST /kennel — create kennel
router.post("/", authenticateToken, async (req, res) => {
  const { name, location } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Kennel name is required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the kennel
      const kennel = await tx.kennel.create({
        data: {
          name: name.trim(),
          location: location?.trim() || null,
        },
      });

      // 2. Auto-add creator as OWNER
      await tx.kennelMember.create({
        data: {
          kennelId: kennel.id,
          userId: req.user.id,
          role: "OWNER",
        },
      });

      // Return kennel with ownership confirmed
      return kennel;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Kennel creation failed:", err);
    if (err.code === "P2002") {
      return res.status(400).json({ error: "A kennel with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create kennel" });
  }
});

// POST /kennel/:id/invite — Invite user by email (only OWNER)
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

// POST /kennel/:id/request-membership — User requests to join kennel
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

// POST /kennel/:id/request-pet — Owner requests to link their pet as "bred here"
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

// ACCEPT / REJECT — FIXED TO HANDLE BOTH REQUEST TYPES
router.patch("/requests/:reqId/accept", authenticateToken, async (req, res) => {
  await handleRequest(req, res, "ACCEPTED", async (request) => {
    if (request.type === "PET_LINK") {
      await prisma.pet.update({
        where: { id: request.petId },
        data: { kennelId: request.kennelId }
      });
    } else if (request.type === "MEMBERSHIP") {
      await prisma.kennelMember.create({
        data: {
          kennelId: request.kennelId,
          userId: request.userId,
          role: "MEMBER"
        }
      });
    }
  });
});

router.patch("/requests/:reqId/reject", authenticateToken, async (req, res) => {
  await handleRequest(req, res, "REJECTED", () => {});
});

// FIXED: Handle both request types correctly
async function handleRequest(req, res, status, onAccept) {
  const userId = req.user.id;
  const reqId = parseInt(req.params.reqId);

  try {
    // 1. Try PET request first
    let request = await prisma.kennelPetRequest.findUnique({
      where: { id: reqId },
      include: {
        kennel: {
          include: {
            members: { where: { userId }, select: { role: true } }
          }
        },
        pet: { 
          include: { 
            owner: { include: { profile: true } } 
          } 
        }
        // NO `user` here — KennelPetRequest doesn't have it!
      }
    });

    let type = "PET_LINK";

    // 2. If not found → try MEMBERSHIP request
    if (!request) {
      request = await prisma.kennelMembershipRequest.findUnique({
        where: { id: reqId },
        include: {
          kennel: {
            include: {
              members: { where: { userId }, select: { role: true } }
            }
          },
          user: { include: { profile: true } }
        }
      });
      type = "MEMBERSHIP";
    }

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check ownership
    const isOwner = request.kennel.members.some(m => m.role === "OWNER");
    if (!isOwner) {
      return res.status(403).json({ error: "Only the kennel owner can process requests" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request already processed" });
    }

    // Accept logic
    if (status === "ACCEPTED") {
      await onAccept({ ...request, type });
    }

    // Update correct table
    let updated;
    if (type === "PET_LINK") {
      updated = await prisma.kennelPetRequest.update({
        where: { id: reqId },
        data: { status },
        include: {
          pet: { include: { owner: { include: { profile: true } } } },
          kennel: true
        }
      });
    } else {
      updated = await prisma.kennelMembershipRequest.update({
        where: { id: reqId },
        data: { status },
        include: {
          user: { include: { profile: true } },
          kennel: true
        }
      });
    }

    res.json({ ...updated, type });
  } catch (err) {
    console.error("handleRequest error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
}

module.exports = router;