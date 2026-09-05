const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  const user = await prisma.user.findUnique({ where: { email: 'donny@gmail.com' } })
  console.log('User found:', user)
}

checkUser().then(() => prisma.$disconnect())
