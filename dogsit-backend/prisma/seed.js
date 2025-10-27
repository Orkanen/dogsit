import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const roles = await prisma.role.createMany({
    data: [
      { name: 'owner' },
      { name: 'sitter' },
      { name: 'kennel' },
    ],
    skipDuplicates: true,
  })

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      password: 'test123',
      role: { connect: { name: 'owner' } },
      profile: {
        create: {
          firstName: 'Anna',
          lastName: 'Larsson',
          bio: 'Loves dogs!',
          location: 'Stockholm'
        }
      }
    }
  })

  const sitter1 = await prisma.user.create({
    data: {
      email: 'sitter1@example.com',
      password: 'test123',
      role: { connect: { name: 'sitter' } },
      profile: {
        create: {
          firstName: 'Erik',
          lastName: 'Svensson',
          bio: 'Professional dog sitter.',
          location: 'Gothenburg'
        }
      }
    }
  })

  console.log('Seed complete ✅')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
