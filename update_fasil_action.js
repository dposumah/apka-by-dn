const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// Update createFasilitator
code = code.replace(
  /besaranTransport: data\.besaranTransport \|\| 120000,/,
  'besaranTransport: data.besaranTransport || 120000,\n      jarakPPKm: data.jarakPPKm || 0,'
);

// Update updateFasilitatorProfile
code = code.replace(
  /besaranTransport: data\.besaranTransport \|\| 120000,/,
  'besaranTransport: data.besaranTransport || 120000,\n        jarakPPKm: data.jarakPPKm || 0,'
);

fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Fixed actions/rab.ts fasilitator creation');
