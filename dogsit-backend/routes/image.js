const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();

// POST /api/images – upload one image (returns Image record)
router.post("/", authenticateToken, async (req, res) => {
  const { alt } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "File required" });

  // TODO: upload to Cloudinary / S3 → get public URL
  // For demo, we fake a URL:
  const url = `https://example.com/uploads/${file.filename}`;

  try {
    const image = await prisma.image.create({
      data: {
        url,
        alt: alt || null,
      },
    });
    res.status(201).json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save image" });
  }
});

module.exports = router;