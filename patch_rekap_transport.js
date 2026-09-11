const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const replacement = `
  const laporanList = await prisma.laporanKegiatan.findMany({
    where: {
      OR: [
        { biayaTransport: { gt: 0 } },
        { biayaTransportLaut: { gt: 0 } }
      ],
      statusTransport: 'PENDING'
    },
`;

code = code.replace(
  /const laporanList = await prisma\.laporanKegiatan\.findMany\(\{\s*where: \{\s*biayaTransport: \{ gt: 0 \},\s*statusTransport: 'PENDING'\s*\}/,
  replacement.trim()
);

fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Patched getAdminTransportRecap in rekap.ts');
