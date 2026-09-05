const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function sync() {
  const orphans = await prisma.fasilitator.findMany({
    where: { userId: null, email: { not: null } }
  })
  
  for (const f of orphans) {
    if (!f.email) continue
    console.log('Fixing orphan fasil:', f.namaLengkap, f.email)
    const existing = await prisma.user.findUnique({ where: { email: f.email } })
    let uid = existing?.id
    if (!existing) {
      const hp = await bcrypt.hash('SNT2026', 10)
      const nu = await prisma.user.create({
        data: {
          email: f.email,
          name: f.namaLengkap,
          password: hp,
          role: 'FASILITATOR'
        }
      })
      uid = nu.id
    }
    await prisma.fasilitator.update({
      where: { id: f.id },
      data: { userId: uid }
    })
    console.log('Fixed', f.namaLengkap)
  }
}

sync().then(()=>prisma.$disconnect())
