const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.laporanKegiatan.update({
    where: { id: 'cmu19qtnc0001cd6147icbg30' },
    data: { biayaTransport: 0 }
  });
  console.log("Fixed second report to 0.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
