const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

file = file.replace(
  /namaBank/g,
  'bankName'
);

file = file.replace(
  /noRekening/g,
  'bankAccount'
);

file = file.replace(
  /namaPemilikRekening/g,
  'namaLengkap'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
