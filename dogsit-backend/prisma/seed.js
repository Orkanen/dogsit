// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ──────────────────────────────────────────────────────────────
// Only helper: upsertUser (reusable, clean)
// ──────────────────────────────────────────────────────────────
async function upsertUser(email, plainPw, roleNames = [], profile = {}) {
  const hash = await bcrypt.hash(plainPw, SALT_ROUNDS);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      roles: { deleteMany: {}, create: roleNames.map(r => ({ role: { connect: { name: r } } })) },
    },
    create: {
      email,
      password: hash,
      roles: { create: roleNames.map(r => ({ role: { connect: { name: r } } })) },
      profile: { create: {} },
    },
    include: { profile: true },
  });
  if (Object.keys(profile).length) {
    await prisma.profile.upsert({ where: { userId: user.id }, update: profile, create: { ...profile, userId: user.id } });
  }
  return user;
}

// ──────────────────────────────────────────────────────────────
// main()
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting seed...');

  // 1. Roles
  await Promise.all(['owner', 'sitter', 'kennel', 'admin', 'certifier'].map(name =>
    prisma.role.upsert({ where: { name }, update: {}, create: { name } })
  ));

  // 2. Users
  await upsertUser('owner1@example.com', 'test123', ['owner'], {
    firstName: 'Anna', lastName: 'Larsson', bio: 'Loves dogs!', location: 'Stockholm', dogBreed: 'Golden Retriever'
  });
  await upsertUser('sitter1@example.com', 'test123', ['sitter'], {
    firstName: 'Erik', lastName: 'Svensson', bio: 'Professional dog sitter.', location: 'Gothenburg', servicesOffered: 'Boarding, Walking, Training'
  });
  await upsertUser('kennel1@example.com', 'test123', ['owner', 'kennel'], {
    firstName: 'Karin', lastName: 'Berg', bio: 'Runs a dog kennel.', location: 'Malmö'
  });

  // 3. Kennel – inline, no function
  const owner = await prisma.user.findUnique({ where: { email: 'kennel1@example.com' } });
  const employee = await prisma.user.findUnique({ where: { email: 'sitter1@example.com' } });
  if (!owner || !employee) throw new Error('Required users not found');

  let kennel = await prisma.kennel.findFirst({ where: { name: 'Sunshine Kennel' } });
  if (!kennel) {
    kennel = await prisma.kennel.create({
      data: {
        name: 'Sunshine Kennel',
        location: 'Austin, TX',
        members: {
          create: [
            { user: { connect: { id: owner.id } }, role: 'owner' },
            { user: { connect: { id: employee.id } }, role: 'employee' },
          ],
        },
      },
      include: { members: true },
    });
    console.log('Created kennel: Sunshine Kennel');
  } else {
    console.log('Kennel already exists');
  }

  // 4. Pets
  await prisma.pet.upsert({ where: { name_kennelId: { name: 'Luna', kennelId: kennel.id } }, update: {}, create: { name: 'Luna', species: 'Dog', breed: 'Golden Retriever', color: 'Golden', sex: 'FEMALE', age: 3, owner: { connect: { email: 'owner1@example.com' } }, kennel: { connect: { id: kennel.id } } } });
  await prisma.pet.upsert({ where: { name_kennelId: { name: 'Max', kennelId: kennel.id } }, update: {}, create: { name: 'Max', species: 'Dog', breed: 'Labrador', color: 'Black', sex: 'MALE', age: 5, owner: { connect: { email: 'owner1@example.com' } }, kennel: { connect: { id: kennel.id } } } });

  // 5. Litter
  const luna = await prisma.pet.findFirst({ where: { name: 'Luna' } });
  const max = await prisma.pet.findFirst({ where: { name: 'Max' } });
  await prisma.litter.upsert({
    where: { kennelId_motherId_fatherId: { kennelId: kennel.id, motherId: luna.id, fatherId: max.id } },
    update: {},
    create: { kennel: { connect: { id: kennel.id } }, mother: { connect: { id: luna.id } }, father: { connect: { id: max.id } }, birthDate: new Date('2025-03-15') },
  });

  // 6. Award
  await prisma.award.upsert({
    where: { name_kennelId: { name: 'Best in Show 2024', kennelId: kennel.id } },
    update: {},
    create: { type: 'CERTIFICATE', name: 'Best in Show 2024', isOfficial: true, issuer: { connect: { email: 'kennel1@example.com' } }, kennel: { connect: { id: kennel.id } } },
  });

  // 7. Club
  await prisma.club.upsert({
    where: { name: 'Golden Retriever Club Sweden' },
    update: {},
    create: { name: 'Golden Retriever Club Sweden', membershipType: 'AUTO_INVITE', verificationStatus: 'APPROVED' },
  });

  console.log('Seed complete!');
}

// ──────────────────────────────────────────────────────────────
// Run
// ──────────────────────────────────────────────────────────────
main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());