const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// Get all courses from my clubs/kennels
router.get("/my", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { issuerType: "CLUB", club: { members: { some: { userId } } } },
          { issuerType: "KENNEL", kennel: { members: { some: { userId } } } },
        ],
      },
      include: { club: true, kennel: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to load courses" });
  }
});

// Create course
router.post("/", authenticateToken, async (req, res) => {
    const { title, description, issuerType = "KENNEL", issuerId } = req.body;
    const userId = req.user.id;
  
    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
  
    const id = Number(issuerId);
    if (!issuerId || isNaN(id)) {
      return res.status(400).json({ error: "Valid issuerId is required" });
    }
  
    try {
      // 1. Verify issuer exists
      let issuer;
      if (issuerType === "KENNEL") {
        issuer = await prisma.kennel.findUnique({ where: { id } });
      } else if (issuerType === "CLUB") {
        issuer = await prisma.club.findUnique({ where: { id } });
      } else {
        return res.status(400).json({ error: "Invalid issuerType. Must be KENNEL or CLUB" });
      }
  
      if (!issuer) {
        return res.status(404).json({ error: `${issuerType} not found` });
      }
  
      // 2. Check membership + ownership
      let membership;
      if (issuerType === "KENNEL") {
        membership = await prisma.kennelMember.findFirst({
          where: { kennelId: id, userId },
        });
      } else {
        membership = await prisma.clubMember.findFirst({
          where: { clubId: id, userId },
        });
      }
  
      if (!membership) {
        return res.status(403).json({ error: "You are not a member of this organization" });
      }
  
      if (membership.role !== "OWNER" && membership.role !== "ADMIN") { // optional: allow ADMIN too
        return res.status(403).json({ error: "Only owners can create courses" });
      }
  
      // 3. Create course
      const course = await prisma.course.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          issuerType,
          kennelId: issuerType === "KENNEL" ? id : null,
          clubId:   issuerType === "CLUB"   ? id : null,
        },
      });
  
      return res.status(201).json(course);
    } catch (err) {
      console.error("Course creation failed:", err);
      return res.status(500).json({ error: "Failed to create course" });
    }
  });

router.get("/my-issuable", authenticateToken, async (req, res) => {
    const userId = req.user.id;
  
    try {
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            {
              issuerType: "KENNEL",
              kennel: { members: { some: { userId } } },
            },
            {
              issuerType: "CLUB",
              club: { members: { some: { userId } } },
            },
          ],
        },
        include: {
          kennel: { select: { name: true } },
          club: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
  
      res.json(courses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load courses" });
    }
});

module.exports = router;