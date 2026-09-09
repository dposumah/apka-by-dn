const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const lap = await prisma.laporanKegiatan.findMany();
  console.log("Total LaporanKegiatan:", lap.length);
  lap.forEach(l => console.log(l.id, l.topic, l.date));
}
check().finally(() => prisma.$disconnect());
