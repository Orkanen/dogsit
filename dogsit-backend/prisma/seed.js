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

async function upsertUser(email, plainPassword, roleName, profileData) {
  const hashed = await hashPassword(plainPassword);

  await prisma.user.upsert({
    where: { email },
    update: {
      // Always set the password to a bcrypt hash on updates as well
      password: hashed,
      role: { connect: { name: roleName } },
      // Optionally update profile fields if profile exists
      profile: {
        upsert: {
          update: profileData,
          create: profileData,
        },
      },
    },
    create: {
      email,
      password: hashed,
      role: { connect: { name: roleName } },
      profile: { create: profileData },
    },
  });
}

async function main() {
  // roles
  await upsertRole('owner');
  await upsertRole('sitter');
  await upsertRole('kennel');

  // users (examples)
  await upsertUser('owner1@example.com', 'test123', 'owner', {
    firstName: 'Anna',
    lastName: 'Larsson',
    bio: 'Loves dogs!',
    location: 'Stockholm',
  });

  await upsertUser('sitter1@example.com', 'test123', 'sitter', {
    firstName: 'Erik',
    lastName: 'Svensson',
    bio: 'Professional dog sitter.',
    location: 'Gothenburg',
  });

  console.log('Seed complete (upsert)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });