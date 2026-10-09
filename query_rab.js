const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.rabItem.findMany({
    where: { name: { contains: 'Honorarium Fasilitator', mode: 'insensitive' } }
  });
  console.log(items);
  
  const honorItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Fasilitator Koding & KA', mode: 'insensitive' } }
  });
  console.log('Or maybe:', honorItem);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
