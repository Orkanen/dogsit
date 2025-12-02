const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Roles
  const roleNames = ['owner', 'sitter', 'kennel', 'admin', 'certifier'];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Roles seeded');

  // 2. Services (common ones)
  const services = [
    'Overnight',
    'Daycare',
    'Walking',
    'Grooming',
    'Training',
    'House sitting',
  ];
  for (const name of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Services seeded');

  // 3. Test users
  const sitterPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'sitter1@example.com' },
    update: {},
    create: {
      email: 'sitter1@example.com',
      password: sitterPassword,
      profile: {
        create: {
          firstName: 'Erik',
          lastName: 'Svensson',
          location: 'Gothenburg',
          pricePerDay: 450,
          publicEmail: 'erik@doglover.se',
          sitterDescription: 'Experienced sitter with big garden, loves all breeds!',
          availability: {
            create: [
              { period: 'MORNING' },
              { period: 'DAY' },
              { period: 'NIGHT' },
            ],
          },
          services: {
            create: [
              { service: { connect: { name: 'Overnight' } } },
              { service: { connect: { name: 'Walking' } } },
              { service: { connect: { name: 'Daycare' } } },
            ],
          },
          breedExperience: {
            create: [
              { breed: 'Golden Retriever' },
              { breed: 'Labrador' },
              { breed: 'French Bulldog' },
            ],
          },
        },
      },
      roles: {
        create: [{ role: { connect: { name: 'sitter' } } }],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'owner1@example.com' },
    update: {},
    create: {
      email: 'owner1@example.com',
      password: sitterPassword,
      profile: {
        create: {
          firstName: 'Anna',
          lastName: 'Larsson',
          location: 'Stockholm',
        },
      },
      roles: {
        create: [{ role: { connect: { name: 'owner' } } }],
      },
    },
  });

  console.log('Test users seeded');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed successfully!');
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });