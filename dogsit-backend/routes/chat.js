const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// MESSAGES
router.post("/", authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { matchId, message } = req.body;

  if (!matchId || !message?.trim())
    return res.status(400).json({ error: "matchId and non-empty message required" });

  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
    });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const isParticipant = match.ownerId === senderId || match.sitterId === senderId;
    if (!isParticipant) return res.status(403).json({ error: "You are not part of this match" });

    const msg = await prisma.message.create({
      data: {
        matchId: parseInt(matchId),
        senderId,
        message: message.trim(),
      },
      include: {
        sender: { select: { id: true, profile: { select: { firstName: true } } } },
      },
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// RETURNS MATCH MESSAGES
router.get("/:matchId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const matchId = parseInt(req.params.matchId);

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const isParticipant = match.ownerId === userId || match.sitterId === userId;
    if (!isParticipant) return res.status(403).json({ error: "You are not part of this match" });

    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { timestamp: "desc" },
      include: {
        sender: { select: { id: true, profile: { select: { firstName: true } } } },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;