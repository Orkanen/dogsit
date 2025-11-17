// prisma/seed.js — FINAL VERSION (works after reset, no table errors)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('Starting seed...');

  // 1. ROLES — must be first!
  const roleNames = ['owner', 'sitter', 'kennel', 'admin', 'certifier'];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles seeded');

  // 2. USERS
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'owner1@example.com' },
      update: {},
      create: {
        email: 'owner1@example.com',
        password: await bcrypt.hash('test123', SALT_ROUNDS),
        profile: { create: { firstName: 'Anna', lastName: 'Larsson', location: 'Stockholm', dogBreed: 'Golden Retriever' } },
        roles: { create: [{ role: { connect: { name: 'owner' } } }] },
      },
      include: { profile: true },
    }),

    prisma.user.upsert({
      where: { email: 'sitter1@example.com' },
      update: {},
      create: {
        email: 'sitter1@example.com',
        password: await bcrypt.hash('test123', SALT_ROUNDS),
        profile: { create: { firstName: 'Erik', lastName: 'Svensson', location: 'Gothenburg', servicesOffered: 'Boarding, Walking' } },
        roles: { create: [{ role: { connect: { name: 'sitter' } } }] },
      },
    }),

    prisma.user.upsert({
      where: { email: 'kennel1@example.com' },
      update: {},
      create: {
        email: 'kennel1@example.com',
        password: await bcrypt.hash('test123', SALT_ROUNDS),
        profile: { create: { firstName: 'Karin', lastName: 'Berg', location: 'Malmö' } },
        roles: { create: [
          { role: { connect: { name: 'owner' } } },
          { role: { connect: { name: 'kennel' } } },
        ]},
      },
    }),
  ]);

  const kennelOwner = users[2]; // kennel1@example.com

  // 3. KENNEL + MEMBERS
  const kennel = await prisma.kennel.upsert({
    where: { name: 'Sunshine Kennel' },
    update: {},
    create: {
      name: 'Sunshine Kennel',
      location: 'Austin, TX',
      members: {
        create: [
          { userId: kennelOwner.id, role: 'OWNER' },
          { userId: users[1].id, role: 'EMPLOYEE' }, // sitter as employee
        ],
      },
    },
    include: { members: true },
  });
  console.log(`Kennel: ${kennel.name} (${kennel.members.length} members)`);

  // 4. PETS
  await Promise.all([
    prisma.pet.upsert({
      where: { name_kennelId: { name: 'Luna', kennelId: kennel.id } },
      update: {},
      create: {
        name: 'Luna',
        species: 'Dog',
        breed: 'Golden Retriever',
        color: 'Golden',
        sex: 'FEMALE',
        age: 3,
        owner: { connect: { id: users[0].id } },
        kennel: { connect: { id: kennel.id } },
      },
    }),
    prisma.pet.upsert({
      where: { name_kennelId: { name: 'Max', kennelId: kennel.id } },
      update: {},
      create: {
        name: 'Max',
        species: 'Dog',
        breed: 'Labrador',
        color: 'Black',
        sex: 'MALE',
        age: 5,
        owner: { connect: { id: users[0].id } },
        kennel: { connect: { id: kennel.id } },
      },
    }),
  ]);

  // 5. LITTER
  const [luna, max] = await Promise.all([
    prisma.pet.findFirst({ where: { name: 'Luna' } }),
    prisma.pet.findFirst({ where: { name: 'Max' } }),
  ]);

  await prisma.litter.upsert({
    where: { kennelId_motherId_fatherId: { kennelId: kennel.id, motherId: luna.id, fatherId: max.id } },
    update: {},
    create: {
      kennelId: kennel.id,
      motherId: luna.id,
      fatherId: max.id,
      birthDate: new Date('2025-03-15'),
    },
  });

  // 6. AWARD + CLUB
  await prisma.award.upsert({
    where: { name_kennelId: { name: 'Best in Show 2024', kennelId: kennel.id } },
    update: {},
    create: {
      type: 'CERTIFICATE',
      name: 'Best in Show 2024',
      isOfficial: true,
      issuerId: kennelOwner.id,
      kennelId: kennel.id,
    },
  });

  await prisma.club.upsert({
    where: { name: 'Golden Retriever Club Sweden' },
    update: {},
    create: { name: 'Golden Retriever Club Sweden', membershipType: 'AUTO_INVITE', verificationStatus: 'APPROVED' },
  });

  console.log('Seed complete!');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });