const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

// 1. Update createRekapBulanan - split JP calculation
c = c.replace(
  /const totalJP = laporan\.reduce\(\(sum, lap\) => sum \+ \(lap\.jumlahJPIntra \|\| 0\) \+ \(lap\.jumlahJPEkstra \|\| 0\), 0\);/,
  'const totalJPIntra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0), 0);\n  const totalJPEkstra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPEkstra || 0), 0);\n  const totalJP = totalJPIntra + totalJPEkstra;'
);

// 2. Add totalJPIntra/Ekstra to first create data block
c = c.replace(
  /fasilitatorId,\s*\n\s*bulan,\s*\n\s*totalJP,\s*\n\s*totalHonor,\s*\n\s*status: 'DRAFT',/,
  "fasilitatorId,\n      bulan,\n      totalJP,\n      totalJPIntra,\n      totalJPEkstra,\n      totalHonor,\n      status: 'DRAFT',"
);

// 3. Update createRekapManual signature
c = c.replace(
  /export async function createRekapManual\(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number, jumlahSesi: number\)/,
  'export async function createRekapManual(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number, jumlahSesi: number, totalJPIntra?: number, totalJPEkstra?: number)'
);

// 4. Add totalJPIntra/Ekstra to manual create data
// Find the second occurrence of "totalJP," (the one inside createRekapManual)
let firstIdx = c.indexOf('totalJPEkstra,\n      totalHonor,');
let secondIdx = c.indexOf('totalJP,\n', firstIdx + 20);
if (secondIdx > -1) {
  let afterTotalJP = secondIdx + 'totalJP,\n'.length;
  c = c.substring(0, afterTotalJP) + '      totalJPIntra: totalJPIntra || 0,\n      totalJPEkstra: totalJPEkstra || 0,\n' + c.substring(afterTotalJP);
}

fs.writeFileSync('src/app/actions/rekap.ts', c);
console.log('Done updating rekap.ts');
