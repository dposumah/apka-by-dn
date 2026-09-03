import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testFlow() {
  const email = 'testflow@example.com'
  
  // 1. Create User
  const hashedPassword = await bcrypt.hash('SNT2026', 10)
  const newUser = await prisma.user.create({
    data: {
      email,
      name: 'Test Flow',
      password: hashedPassword,
      role: 'FASILITATOR',
    }
  })
  console.log('User created:', newUser.id)

  // 2. Change Password
  const user = await prisma.user.findUnique({ where: { id: newUser.id } })
  const isMatch = await bcrypt.compare('SNT2026', user!.password)
  console.log('Password match?', isMatch)
  
  // cleanup
  await prisma.user.delete({ where: { id: newUser.id } })
}
testFlow()
