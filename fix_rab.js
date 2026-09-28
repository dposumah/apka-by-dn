const fs = require('fs');

let rab = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// I want to add jenisTugas to updateFasilitatorProfile
// Let's find updateFasilitatorProfile function specifically

let funcStart = rab.indexOf('export async function updateFasilitatorProfile');
if (funcStart > -1) {
  let innerStart = rab.indexOf('lokasiSNT: data.lokasiSNT || null,', funcStart);
  if (innerStart > -1) {
    let before = rab.substring(0, innerStart);
    let after = rab.substring(innerStart + 'lokasiSNT: data.lokasiSNT || null,'.length);
    rab = before + "lokasiSNT: data.lokasiSNT || null,\n      jenisTugas: data.jenisTugas || currentFasil?.jenisTugas || 'INTRAKURIKULER'," + after;
  }
}

fs.writeFileSync('src/app/actions/rab.ts', rab);
console.log('Fixed rab.ts correctly');
