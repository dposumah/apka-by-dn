const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

code = code.replace(
  /besaranTransport: data\.besaranTransport !== undefined \? parseFloat\(data\.besaranTransport\) : 120000,/,
  "besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,\n      jarakPPKm: data.jarakPPKm !== undefined ? parseFloat(data.jarakPPKm) : 0,"
);

code = code.replace(
  /besaranTransport: data\.besaranTransport !== undefined \? parseFloat\(data\.besaranTransport\) : currentFasil\?\.besaranTransport \?\? 120000,/,
  "besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : currentFasil?.besaranTransport ?? 120000,\n        jarakPPKm: data.jarakPPKm !== undefined ? parseFloat(data.jarakPPKm) : currentFasil?.jarakPPKm ?? 0,"
);

fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Fixed actions/rab.ts fasilitator creation');
