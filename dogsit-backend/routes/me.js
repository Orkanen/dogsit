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
    // 1. Get managed clubs with members
    const managedClubs = await prisma.club.findMany({
      where: {
        members: {
          some: {
            userId,
            role: { in: ["OWNER", "EMPLOYEE"] },
            status: "ACCEPTED",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const clubIds = managedClubs.map(c => c.id);

    if (clubIds.length === 0) {
      return res.json({
        clubs: [],
        courses: [],
        competitions: [],
        requests: { membership: [], enrollments: [], entries: [] },
      });
    }

    // 2. Parallel fetch — now with correct status values
    const [
      courses,
      competitions,
      membershipRequests,
      courseEnrollments,
      competitionEntries,
    ] = await Promise.all([
      // COURSES — with approved enrollments
      prisma.course.findMany({
        where: { clubId: { in: clubIds } },
        include: {
          club: { select: { id: true, name: true } },
          certifiers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          enrollments: {
            where: { status: "APPROVED" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // COMPETITIONS — with accepted entries
      prisma.competition.findMany({
        where: { clubId: { in: clubIds } },
        include: {
          club: { select: { id: true, name: true } },
          entries: {
            where: { status: "ACCEPTED" },  // EntryStatus uses "ACCEPTED"
            include: {
              pet: { select: { id: true, name: true } },
              user: { select: { profile: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
        orderBy: { startAt: "desc" },
      }),

      // Pending membership requests
      prisma.clubMember.findMany({
        where: { clubId: { in: clubIds }, status: "PENDING" },
        include: {
          user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
          club: { select: { name: true } },
        },
      }),

      // Pending course enrollments
      prisma.courseEnrollment.findMany({
        where: { course: { clubId: { in: clubIds } }, status: "APPLIED" },
        include: {
          course: { select: { id: true, title: true } },
          pet: { select: { id: true, name: true, breed: true, images: { take: 1 } } },
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { appliedAt: "desc" },
      }),

      // Pending competition entries
      prisma.competitionEntry.findMany({
        where: { competition: { clubId: { in: clubIds } }, status: "PENDING" },
        include: {
          competition: { select: { id: true, title: true } },
          pet: { select: { id: true, name: true, breed: true, images: { take: 1 } } },
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      clubs: managedClubs,
      courses,
      competitions,
      requests: {
        membership: membershipRequests,
        enrollments: courseEnrollments,
        entries: competitionEntries,
      },
    });
  } catch (err) {
    console.error("GET /me/managed failed:", err);
    res.status(500).json({ error: "Failed to load managed data" });
  }
});

module.exports = router;