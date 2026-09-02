const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'donny@apka.com' },
    data: { password: hashedPassword }
  });
  console.log('Password reset to admin123');
  await prisma.$disconnect();
}
resetPassword();
