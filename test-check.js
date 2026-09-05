const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const fasils = await prisma.fasilitator.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  })
  
  for (const f of fasils) {
    console.log('Fasil:', f.namaLengkap)
    console.log('Email:', f.email)
    console.log('User ID in Fasil:', f.userId)
    console.log('User Linked:', f.user ? 'YES' : 'NO')
    console.log('---')
  }
}

check().then(() => prisma.$disconnect())
