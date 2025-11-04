const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function upsertRole(name) {
  await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertUser(email, plainPassword, roleNames = [], profileData = {}) {
  const hashed = await hashPassword(plainPassword);

  // First, get or create user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      // Replace all roles
      roles: {
        deleteMany: {},
        create: roleNames.map(name => ({
          role: { connect: { name } }
        }))
      },
    },
    create: {
      email,
      password: hashed,
      roles: {
        create: roleNames.map(name => ({
          role: { connect: { name } }
        }))
      },
      profile: { create: {} }, // create empty profile first
    },
    include: { profile: true }
  });

  // Now upsert profile using userId (which exists after create)
  if (Object.keys(profileData).length > 0) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        ...profileData,
        userId: user.id
      }
    });
  }

  return user;
}

async function main() {
  console.log('Seeding roles...');
  await upsertRole('owner');
  await upsertRole('sitter');
  await upsertRole('kennel');

  console.log('Seeding users...');
  await upsertUser(
    'owner1@example.com',
    'test123',
    ['owner'],
    {
      firstName: 'Anna',
      lastName: 'Larsson',
      bio: 'Loves dogs!',
      location: 'Stockholm',
      dogBreed: 'Golden Retriever',
    }
  );

  await upsertUser(
    'sitter1@example.com',
    'test123',
    ['sitter'],
    {
      firstName: 'Erik',
      lastName: 'Svensson',
      bio: 'Professional dog sitter.',
      location: 'Gothenburg',
      servicesOffered: 'Boarding, Walking, Training',
    }
  );

  // Optional: kennel admin
  await upsertUser(
    'kennel1@example.com',
    'test123',
    ['owner', 'kennel'],
    {
      firstName: 'Karin',
      lastName: 'Berg',
      bio: 'Runs a dog kennel.',
      location: 'Malmö',
    }
  );

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });