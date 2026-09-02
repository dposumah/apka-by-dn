import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { hash } from 'bcryptjs' // Asumsi pakai bcryptjs untuk next-auth

async function main() {
  const fasils = await prisma.fasilitator.findMany()
  console.log('Ditemukan', fasils.length, 'fasilitator')
  
  const defaultPassword = await hash('SNT2026', 10)

  for (const f of fasils) {
    if (!f.email) continue
    
    // Upsert User
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {
        role: 'FASILITATOR',
      },
      create: {
        email: f.email,
        name: f.namaLengkap,
        password: defaultPassword,
        role: 'FASILITATOR',
      }
    })
    
    // Tautkan user ke fasilitator
    await prisma.fasilitator.update({
      where: { id: f.id },
      data: { userId: user.id }
    })
    
    console.log('Berhasil membuat akun untuk:', f.email)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.()
  })
