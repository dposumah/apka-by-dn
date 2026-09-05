import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const fasils = await prisma.fasilitator.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  })
  
  for (const f of fasils) {
    console.log(Fasil: )
    console.log(Email: )
    console.log(User ID in Fasil: )
    console.log(User Linked: )
    console.log('---')
  }
}

check().then(() => prisma.$disconnect())
