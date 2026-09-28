const fs = require('fs');

let rab = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

rab = rab.replace(
  /lokasiSNT: data\.lokasiSNT \|\| null,\n\s*besaranTransport: data\.besaranTransport !== undefined \? parseFloat\(data\.besaranTransport\) : 120000,/,
  "lokasiSNT: data.lokasiSNT || null,\n        jenisTugas: data.jenisTugas || 'INTRAKURIKULER',\n        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,"
);

fs.writeFileSync('src/app/actions/rab.ts', rab);
console.log('Fixed createFasilitator in rab.ts');
