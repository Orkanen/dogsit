const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /courses
 * Create a new course (CLUB only)
 */
router.post("/", authenticateToken, async (req, res) => {
  const { title, description, clubId, certifierUserId } = req.body;
  const actorId = req.user.id;

  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!clubId) return res.status(400).json({ error: "clubId is required" });

  const clubIdNum = Number(clubId);
  if (!Number.isFinite(clubIdNum)) return res.status(400).json({ error: "Invalid clubId" });

  try {
    // Verify club exists
    const club = await prisma.club.findUnique({ where: { id: clubIdNum } });
    if (!club) return res.status(404).json({ error: "Club not found" });

    // Verify actor is OWNER or EMPLOYEE of the club
    const membership = await prisma.clubMember.findFirst({
      where: {
        clubId: clubIdNum,
        userId: actorId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
    });
    if (!membership) {
      return res.status(403).json({ error: "Only club owners/employees can create courses" });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        clubId: clubIdNum,
        issuerType: "CLUB",
      },
    });

    // Optional: Assign initial certifier (trainer)
    if (certifierUserId) {
      const uid = Number(certifierUserId);
      if (Number.isFinite(uid)) {
        const certMember = await prisma.clubMember.findFirst({
          where: {
            clubId: clubIdNum,
            userId: uid,
            role: { in: ["OWNER", "EMPLOYEE"] },
            status: "ACCEPTED",
          },
        });

        if (certMember) {
          await prisma.courseCertifierAssignment.upsert({
            where: { courseId_userId: { courseId: course.id, userId: uid } },
            update: {},
            create: { courseId: course.id, userId: uid },
          });
        }
      }
    }

    // Return course with certifiers
    const fullCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: { certifiers: { include: { user: { select: { id: true, email: true, profile: true } } } } },
    });

    res.status(201).json(fullCourse);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

/**
 * GET /courses/requests
 * Get all pending course enrollments for clubs the user manages
 */
router.get("/requests", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Find clubs where user is OWNER or EMPLOYEE
    const managedClubs = await prisma.clubMember.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
      select: { clubId: true },
    });

    const clubIds = managedClubs.map(m => m.clubId);
    if (clubIds.length === 0) return res.json([]);

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        status: "APPLIED",
        course: { clubId: { in: clubIds } },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            breed: true,
            images: { take: 1 },
          },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    res.json(enrollments);
  } catch (err) {
    console.error("Get enrollment requests failed:", err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

/**
 * PATCH /courses/requests/:enrollmentId/process
 * Approve or reject enrollment
 */
router.patch("/requests/:enrollmentId/process", authenticateToken, async (req, res) => {
  const enrollmentId = Number(req.params.enrollmentId);
  const { action } = req.body;
  const userId = req.user.id;

  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ error: "action must be APPROVE or REJECT" });
  }

  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    if (!enrollment.course?.clubId) return res.status(400).json({ error: "Invalid course" });

    // Must be OWNER or EMPLOYEE of the club
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: enrollment.course.clubId,
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
    });

    if (!member) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        processedAt: new Date(),
        processedBy: userId,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Process enrollment failed:", err);
    res.status(500).json({ error: "Failed to process" });
  }
});

/**
 * PATCH /courses/:id
 * Update course details
 */
router.patch("/:id", authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const actorId = req.user.id;
  const updates = req.body;

  try {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: course.clubId,
        userId: actorId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED"
      },
    });
    if (!member) return res.status(403).json({ error: "Not authorized" });

    const updated = await prisma.course.update({
      where: { id },
      data: updates,
      include: {
        certifiers: { include: { user: true } },
        enrollments: {
          where: { status: "APPROVED" },
          // No need to include pet/user here unless you want more data
        },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * DELETE /courses/:id
 * Safely delete course + all related data
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const actorId = req.user.id;

  try {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const member = await prisma.clubMember.findFirst({
      where: { clubId: course.clubId, userId: actorId, role: "OWNER", status: "ACCEPTED" },
    });
    if (!member) return res.status(403).json({ error: "Only club owner can delete courses" });

    await prisma.$transaction(async (tx) => {
      await tx.courseEnrollment.deleteMany({ where: { courseId: id } });
      await tx.certification.deleteMany({ where: { courseId: id } });
      await tx.courseCertifierAssignment.deleteMany({ where: { courseId: id } });
      await tx.course.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/**
 * PATCH /courses/:id/hidden
 * Toggle hidden status
 */
router.patch("/:id/hidden", authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const actorId = req.user.id;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const member = await prisma.clubMember.findFirst({
    where: { clubId: course.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
  });
  if (!member) return res.status(403).json({ error: "Not authorized" });

  const updated = await prisma.course.update({
    where: { id },
    data: { isHidden: !course.isHidden },
  });

  res.json(updated);
});

/**
 * PATCH /courses/:id/available
 * Set availability + optional reason
 */
router.patch("/:id/available", authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const { available, reason } = req.body;
  const actorId = req.user.id;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ error: "Not found" });

  const member = await prisma.clubMember.findFirst({
    where: { clubId: course.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
  });
  if (!member) return res.status(403).json({ error: "Not authorized" });

  const updated = await prisma.course.update({
    where: { id },
    data: {
      isAvailable: available,
      unavailableReason: available ? null : (reason || null),
    },
  });

  res.json(updated);
});

/**
 * POST /courses/:id/trainer
 * Assign a trainer (certifier)
 */
router.post("/:id/trainer", authenticateToken, async (req, res) => {
  const courseId = Number(req.params.id);
  const { userId } = req.body;
  const actorId = req.user.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const member = await prisma.clubMember.findFirst({
    where: { clubId: course.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
  });
  if (!member) return res.status(403).json({ error: "Not authorized" });

  const targetMember = await prisma.clubMember.findFirst({
    where: { clubId: course.clubId, userId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
  });
  if (!targetMember) return res.status(400).json({ error: "User must be club owner/employee" });

  await prisma.courseCertifierAssignment.upsert({
    where: { courseId_userId: { courseId, userId } },
    update: {},
    create: { courseId, userId },
  });

  const updated = await prisma.course.findUnique({
    where: { id: courseId },
    include: { certifiers: { include: { user: true } } },
  });

  res.json(updated);
});

/**
 * DELETE /courses/:id/trainer/:userId
 * Remove a trainer
 */
router.delete("/:id/trainer/:userId", authenticateToken, async (req, res) => {
  const courseId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const actorId = req.user.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const member = await prisma.clubMember.findFirst({
    where: { clubId: course.clubId, userId: actorId, role: { in: ["OWNER", "EMPLOYEE"] }, status: "ACCEPTED" },
  });
  if (!member) return res.status(403).json({ error: "Not authorized" });

  await prisma.courseCertifierAssignment.delete({
    where: { courseId_userId: { courseId, userId } },
  });

  const updated = await prisma.course.findUnique({
    where: { id: courseId },
    include: { certifiers: { include: { user: true } } },
  });

  res.json(updated);
});

router.get("/my/enrollments", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        pet: {
          include: {
            images: { take: 1 },
          },
        },
        course: {
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
          },
        },
        processedByUser: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        // FULL CERTIFICATION WITH COURSE TITLE, CLUB & TRAINER
        certification: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            issuingClub: {
              select: { id: true, name: true } },
            verifiedByUser: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    res.json(enrollments);
  } catch (err) {
    console.error("GET /courses/my/enrollments error:", err);
    res.status(500).json({ error: "Failed to load enrollments" });
  }
});

router.get("/my/issuable", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find clubs where user is OWNER or EMPLOYEE
    const clubMemberships = await prisma.clubMember.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "EMPLOYEE"] },
        status: "ACCEPTED",
      },
      select: { clubId: true },
    });

    const clubIds = clubMemberships.map(m => m.clubId);
    if (clubIds.length === 0) return res.json([]);

    const courses = await prisma.course.findMany({
      where: { clubId: { in: clubIds } },
      include: {
        club: { select: { id: true, name: true } },
        certifiers: {
          include: { user: { select: { id: true, profile: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(courses);
  } catch (err) {
    console.error("getMyIssuableCourses error:", err);
    res.status(500).json({ error: "Failed to load issuable courses" });
  }
});

/**
 * POST /courses/:id/enroll
 * Enroll current user's pet in a course
 */
router.post("/:id/enroll", authenticateToken, async (req, res) => {
  const courseId = Number(req.params.id);
  const { petId } = req.body;
  const userId = req.user.id;

  if (!petId) return res.status(400).json({ error: "petId is required" });

  try {
    // 1. Course exists + belongs to a club
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { club: true },
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!course.clubId) return res.status(400).json({ error: "Invalid course" });

    // 2. User is an ACCEPTED member of the club
    const membership = await prisma.clubMember.findFirst({
      where: {
        clubId: course.clubId,
        userId,
        status: "ACCEPTED",
      },
    });
    if (!membership) {
      return res.status(403).json({ error: "You must be a club member to enroll" });
    }

    // 3. Pet belongs to user
    const pet = await prisma.pet.findUnique({
      where: { id: Number(petId), ownerId: userId },
    });
    if (!pet) return res.status(403).json({ error: "This is not your pet" });

    // 4. Prevent duplicate
    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_petId: { courseId, petId: Number(petId) } },
    });
    if (existing) {
      return res.status(400).json({ error: "Pet is already enrolled" });
    }

    // 5. Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        userId,
        petId: Number(petId),
        status: "APPLIED",
      },
      include: {
        pet: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
      },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    console.error("Enroll pet failed:", err);
    res.status(500).json({ error: "Failed to enroll pet" });
  }
});

module.exports = router;