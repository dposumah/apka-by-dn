const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const orphans = await prisma.fasilitator.findMany({
    where: { email: null }
  })
  console.log('No email count:', orphans.length)
}
check().then(()=>prisma.$disconnect())
