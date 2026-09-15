const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      date: new Date('2026-09-10T00:00:00.000Z')
    },
    include: {
      fasilitator: true
    }
  });
  console.log(JSON.stringify(laporan.filter(l => l.fasilitator.namaLengkap.includes('Rando')), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
