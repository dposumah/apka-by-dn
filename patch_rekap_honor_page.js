const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/page.tsx', 'utf8');

code = code.replace(
  "const rekapList = await prisma.rekapHonorarium.findMany({",
  "const fasilitators = await prisma.fasilitator.findMany({ orderBy: { namaLengkap: 'asc' } });\n  const rekapList = await prisma.rekapHonorarium.findMany({"
);
code = code.replace(
  "<RekapHonorClient initialData={rekapList} />",
  "<RekapHonorClient initialData={rekapList} fasilitators={fasilitators} />"
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/page.tsx', code);
console.log('Page updated');
