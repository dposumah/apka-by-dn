import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'donny@apka.com' } })
  const passwords = ['admin123', 'password123', 'password', 'SNT2026', 'donny123']
  for (const p of passwords) {
    if (await bcrypt.compare(p, user!.password)) {
      console.log('Donny password:', p)
      return
    }
  }
  console.log('Not found')
}
test()
