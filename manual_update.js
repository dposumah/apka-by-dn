const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      topic: 'Pengenalan Robotika',
      date: new Date('2026-09-10T00:00:00.000Z')
    },
    include: {
      fasilitator: true
    }
  });
  
  if (laporan.length > 0) {
    for (const lap of laporan) {
      if (lap.fasilitator.namaLengkap.includes('Rando')) {
        await prisma.laporanKegiatan.update({
          where: { id: lap.id },
          data: { 
            biayaTransport: 145000,
            reqBiayaTransport: 145000 // Update both to ensure it survives any future limit changes!
          }
        });
        console.log(`Updated Laporan ID ${lap.id} for ${lap.fasilitator.namaLengkap} to 145000!`);
      }
    }
  } else {
    console.log("No laporan found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
