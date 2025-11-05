const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// REQUEST SITTER
router.post("/", authenticateToken, async (req, res) => {
  const ownerId = req.user.id;
  const { sitterId } = req.body;

  if (!sitterId) return res.status(400).json({ error: "sitterId is required" });

  try {
    const sitter = await prisma.user.findUnique({
      where: { id: parseInt(sitterId) },
      include: { roles: { include: { role: true } } }
    });

    if (!sitter) return res.status(404).json({ error: "Sitter not found" });

    const hasSitterRole = sitter.roles.some(r =>
      ["sitter", "kennel"].includes(r.role.name.toLowerCase())
    );
    if (!hasSitterRole) return res.status(400).json({ error: "User is not a sitter or kennel" });

    if (ownerId === parseInt(sitterId))
      return res.status(400).json({ error: "Cannot match with yourself" });

    const existing = await prisma.match.findUnique({
      where: { ownerId_sitterId: { ownerId, sitterId: parseInt(sitterId) } }
    });

    if (existing)
      return res.status(409).json({ error: "Match request already exists", match: existing });

    const match = await prisma.match.create({
      data: { ownerId, sitterId: parseInt(sitterId) },
      include: {
        owner: { include: { profile: true } },
        sitter: { include: { profile: true } }
      }
    });

    res.status(201).json(match);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: "Match request already exists" });
    res.status(500).json({ error: "Failed to create match request" });
  }
});

// ACCEPT/REJECT
router.put("/:id", authenticateToken, async (req, res) => {
  const sitterId = req.user.id;
  const matchId = parseInt(req.params.id);
  const { status } = req.body;

  if (!["ACCEPTED", "REJECTED"].includes(status))
    return res.status(400).json({ error: "Status must be ACCEPTED or REJECTED" });

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.sitterId !== sitterId) return res.status(403).json({ error: "Unauthorized" });
    if (match.status !== "PENDING") return res.status(400).json({ error: "Already responded" });

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status },
      include: {
        owner: { include: { profile: true } },
        sitter: { include: { profile: true } }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update match" });
  }
});

// GET SENT/RECEIVED
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const [sent, received] = await Promise.all([
    prisma.match.findMany({
      where: { ownerId: userId },
      include: { sitter: { include: { profile: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.match.findMany({
      where: { sitterId: userId },
      include: { owner: { include: { profile: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  res.json({ sent, received });
});

module.exports = router;