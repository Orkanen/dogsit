// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function log(msg) {
  console.log(`[Seed] ${msg}`);
}

async function main() {
  log("Starting seed...");

  // 1. Roles (now uses PascalCase table "Role")
  const roleNames = ["owner", "sitter", "kennel", "admin", "certifier"];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  log("Roles seeded");

  // 2. Services (if you still have them)
  const services = ["Overnight", "Walking", "Grooming", "Training", "Daycare"];
  for (const name of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  log("Services seeded");

  // 3. Create a test admin user (optional but useful)
  const admin = await prisma.user.upsert({
    where: { email: "admin@dogsit.com" },
    update: {},
    create: {
      email: "admin@dogsit.com",
      password: "$2b$10$ThisIsAHashedPassword123", // use your real hash or change later
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: (await prisma.role.findUnique({ where: { name: "admin" } })).id } },
    update: {},
    create: {
      userId: admin.id,
      roleId: (await prisma.role.findUnique({ where: { name: "admin" } })).id,
    },
  });
  log("Admin user ready");

  // 4. Example club + owner + approved certifier + course
  const club = await prisma.club.upsert({
    where: { name: "Downtown Dog Club" },
    update: {},
    create: { name: "Downtown Dog Club", membershipType: "OPEN" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@dogsit.com" },
    update: {},
    create: { email: "owner@dogsit.com", password: "hashed" },
  });

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: owner.id } },
    update: { role: "OWNER" },
    create: { clubId: club.id, userId: owner.id, role: "OWNER", status: "ACCEPTED" },
  });

  // Create an approved certifier
  const certifierUser = await prisma.user.upsert({
    where: { email: "certifier@dogsit.com" },
    update: {},
    create: { email: "certifier@dogsit.com", password: "hashed" },
  });

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: certifierUser.id } },
    update: {},
    create: { clubId: club.id, userId: certifierUser.id, role: "EMPLOYEE", status: "ACCEPTED" },
  });

  const clubCertifier = await prisma.clubCertifier.upsert({
    where: { clubId_userId: { clubId: club.id, userId: certifierUser.id } },
    update: { status: "APPROVED", processedByAdminId: admin.id },
    create: {
      clubId: club.id,
      userId: certifierUser.id,
      grantedById: owner.id,
      status: "APPROVED",
      processedByAdminId: admin.id,
    },
  });

  // Create a course with the approved certifier
  await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Basic Obedience Level 1",
      description: "8-week beginner obedience course",
      issuerType: "CLUB",
      clubId: club.id,
      certifierId: clubCertifier.id,
    },
  });

  log("Sample club, certifier, and course created");
  log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });