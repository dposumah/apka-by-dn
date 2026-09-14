const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestLaporan = await prisma.laporanKegiatan.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      topic: true,
      biayaTransport: true,
      biayaTransportLaut: true,
      buktiTransportDarat: true,
      buktiTiketTransport: true,
      date: true,
      fasilitator: { select: { namaLengkap: true, besaranTransport: true } }
    }
  });
  console.log(JSON.stringify(latestLaporan, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
