const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fasil = await prisma.fasilitator.findFirst();
  if (!fasil) {
    console.log("No fasilitator found");
    return;
  }
  
  const data = {
    date: new Date().toISOString(),
    topic: 'Test',
    attendance: '10',
    evaluation: 'Test eval',
    tingkatSekolah: 'SMP',
    metodePelaksanaan: 'LURING',
    jumlahJPIntra: '2',
    jumlahJPEkstra: '0',
    biayaTransport: '0',
    biayaTransportLaut: '0'
  };
  
  try {
    const { submitLaporanKegiatan } = require('./.next/server/app/actions/rab.js'); // Cannot easily import TS server action in plain node script
  } catch (e) {
    console.log("Cannot test server action directly this way");
  }
}
main();
