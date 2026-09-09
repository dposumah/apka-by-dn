const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inactives = await prisma.fasilitator.findMany({ where: { isActive: false } });
  console.log(`Found ${inactives.length} inactive fasilitators.`);
  
  if (inactives.length > 0) {
    for (const f of inactives) {
      console.log(`Deleting ${f.namaLengkap}...`);
      await prisma.fasilitator.delete({ where: { id: f.id } });
    }
    console.log("Deleted.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
