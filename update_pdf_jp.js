const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// Build JP display logic for both invoice and kwitansi
const jpDisplayLogic = '${(rekap.totalJPIntra > 0 && rekap.totalJPEkstra > 0) ? `${rekap.totalJP} JP (Intra: ${rekap.totalJPIntra} JP + Ekstra: ${rekap.totalJPEkstra} JP)` : `${rekap.totalJP} JP`}';

// Update Invoice template - Jumlah sesi / JP line  
c = c.replace(
  /\$\{rekap\.totalJP\} JP<\/td><\/tr>\s*<tr><td style="padding: 6px 0;">Honor per JP/,
  jpDisplayLogic + '</td></tr>\n          <tr><td style="padding: 6px 0;">Honor per JP'
);

// Update Kwitansi Honor template - Jumlah sesi / JP line
c = c.replace(
  /\$\{rekap\.totalJP\} JP<\/td><\/tr>\s*<tr><td style="padding: 6px 0;">Honor per sesi \/ JP/,
  jpDisplayLogic + '</td></tr>\n              <tr><td style="padding: 6px 0;">Honor per sesi / JP'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', c);
console.log('Done updating pdf-generator.ts');
