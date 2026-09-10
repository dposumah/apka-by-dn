const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.rabItem.findMany({
    select: { id: true, name: true }
  });
  console.log(items);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
