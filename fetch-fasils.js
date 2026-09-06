const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const fasils = await prisma.fasilitator.findMany({
    select: { id: true, namaLengkap: true, pangkatGolongan: true, alamat: true }
  })
  console.log(JSON.stringify(fasils, null, 2))
}
main()
