const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const f = await prisma.fasilitator.findFirst({ where: { namaLengkap: 'Donny' } })
  console.log('Donny createdAt:', f.createdAt)
}
check().then(()=>prisma.$disconnect())
