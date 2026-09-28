const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const res = await prisma.kwitansiRecord.findFirst({ where: { tipeKwitansi: 'HONOR' } });
    console.log('SUCCESS:', res);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    prisma.$disconnect();
  }
}
run();
