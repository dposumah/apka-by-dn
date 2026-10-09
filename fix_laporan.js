const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  const updated = await prisma.laporanKegiatan.update({
    where: { id: 'cmuz2gs580001xv5pmo03dluc' },
    data: {
      biayaTransport: 200000
    }
  });
  console.log('Updated:', updated.biayaTransport);
}

fixData().finally(() => prisma.$disconnect());
