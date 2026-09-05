import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testCreate() {
  const email = 'dummy_fasil_test@apka.com'
  let userId = null;
  
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('SNT2026', 10)
      const newUser = await prisma.user.create({
        data: {
          email,
          name: 'Dummy Fasil Test',
          password: hashedPassword,
          role: 'FASILITATOR',
        }
      })
      userId = newUser.id
    } else {
      userId = existingUser.id
    }
  }

  const newFasilitator = await prisma.fasilitator.create({
    data: {
      namaLengkap: 'Dummy Fasil Test',
      email: email,
      userId: userId,
    }
  })
  console.log('Created fasil:', newFasilitator.id, 'with userId:', newFasilitator.userId)
  
  // Cleanup
  await prisma.fasilitator.delete({ where: { id: newFasilitator.id } })
  await prisma.user.delete({ where: { id: userId! } })
}

testCreate().then(()=>prisma.$disconnect())
