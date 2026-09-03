import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAll() {
  const hashedPassword = await bcrypt.hash('SNT2026', 10)
  await prisma.user.updateMany({
    where: { role: 'FASILITATOR' },
    data: { password: hashedPassword }
  })
  console.log('All fasilitator passwords reset to SNT2026')
}
resetAll()
