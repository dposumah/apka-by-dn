const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

code = code.replace(
  "export async function createRekapManual(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number) {",
  "export async function createRekapManual(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number, jumlahSesi: number) {"
);

code = code.replace(
  "totalJP,\n      totalHonor,\n      status: 'SUBMITTED',",
  "totalJP,\n      jumlahSesi,\n      totalHonor,\n      status: 'SUBMITTED',"
);

fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Action updated');
