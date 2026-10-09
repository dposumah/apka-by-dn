const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitator: {
        namaLengkap: { contains: "Nico Indra" }
      }
    },
    orderBy: { date: 'desc' }
  });
  
  console.log('Found Laporan:', laporan.map(l => ({
    id: l.id,
    date: l.date,
    biayaTransport: l.biayaTransport,
    reqBiayaTransport: l.reqBiayaTransport,
    statusTransport: l.statusTransport
  })));
}

fixData().finally(() => prisma.$disconnect());
