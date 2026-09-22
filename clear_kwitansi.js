const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.kwitansiRecord.deleteMany({});
  console.log('Kwitansi records cleared');
}
main();
