const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/snt-akun/page.tsx', 'utf8');

if (!page.includes('const facilitators = await prisma.fasilitator')) {
  page = page.replace(
    /const hargaPertamax = await getAppSetting\('harga_pertamax', '13900'\);/,
    `const hargaPertamax = await getAppSetting('harga_pertamax', '13900');
  const facilitators = await prisma.fasilitator.findMany({
    where: { isActive: true },
    orderBy: { namaLengkap: 'asc' },
    select: { id: true, namaLengkap: true, jarakPPKm: true, besaranTransport: true, lokasiSNT: true }
  });`
  );
  
  page = page.replace(
    /<SntAkunClient user=\{user\} hargaPertamax=\{hargaPertamax\} \/>/,
    `<SntAkunClient user={user} hargaPertamax={hargaPertamax} facilitators={facilitators} />`
  );
  
  fs.writeFileSync('src/app/(snt)/snt-akun/page.tsx', page);
}
