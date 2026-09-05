const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const fasils = await prisma.fasilitator.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  })
  console.log(fasils.map(f => ({ name: f.namaLengkap, email: f.email, userId: f.userId, createdAt: f.createdAt })))
}
check().then(()=>prisma.$disconnect())
