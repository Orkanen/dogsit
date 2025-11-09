const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const kennels = await prisma.kennel.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        members: {
          select: { userId: true },
        },
        pets: {
          select: { id: true },
        },
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
    res.status(500).json({ error: 'Failed to fetch kennels' });
  }
});

module.exports = router;