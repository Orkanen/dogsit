// routes/me.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// === GET /me/managed ===
// The ONE endpoint that powers the entire ClubDashboard
router.get("/managed", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Find all clubs where user is OWNER or EMPLOYEE
    const managedClubs = await prisma.club.findMany({
      where: {
        members: {
          some: {
            userId,
            role: { in: ["OWNER", "EMPLOYEE"] },
            status: "ACCEPTED"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
            }
          }
        }
      }
    });

    const clubIds = managedClubs.map(c => c.id);

    if (clubIds.length === 0) {
      return res.json({
        clubs: [],
        courses: [],
        competitions: [],
        requests: { membership: [], enrollments: [], entries: [] }
      });
    }

    // 2. Parallel fetch everything
    const [courses, competitions, membershipRequests, enrollments, entries] = await Promise.all([
      prisma.course.findMany({
        where: { clubId: { in: clubIds } },
        include: {
          club: { select: { id: true, name: true } },
          certifiers: { include: { user: { select: { id: true, profile: true } } } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.competition.findMany({
        where: { clubId: { in: clubIds } },
        include: {
          club: { select: { id: true, name: true } },
          entries: { include: { pet: true, user: { select: { profile: true } } } }
        },
        orderBy: { startAt: "desc" }
      }),
      prisma.clubMember.findMany({
        where: { clubId: { in: clubIds }, status: "PENDING" },
        include: { user: { select: { id: true, profile: true } }, club: { select: { name: true } } }
      }),
      prisma.courseEnrollment.findMany({
        where: { course: { clubId: { in: clubIds } }, status: "APPLIED" },
        include: { course: { select: { title: true } }, pet: true, user: { select: { profile: true } } }
      }),
      prisma.competitionEntry.findMany({
        where: { competition: { clubId: { in: clubIds } }, status: "PENDING" },
        include: { competition: { select: { title: true } }, pet: true, user: { select: { profile: true } } }
      })
    ]);

    res.json({
      clubs: managedClubs,
      courses,
      competitions,
      requests: {
        membership: membershipRequests,
        enrollments,
        entries
      }
    });

  } catch (err) {
    console.error("GET /me/managed failed", err);
    res.status(500).json({ error: "Failed to load managed data" });
  }
});

// Optional: lightweight versions
router.get("/clubs", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const clubs = await prisma.club.findMany({
    where: {
      members: { some: { userId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" } }
    },
    select: { id: true, name: true }
  });
  res.json(clubs);
});

module.exports = router;