const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// The template string causes ReferenceError because kopType is not defined
code = code.replace(
  /\$\{kopType === 'maleo' \? '\/kop-maleo\.png' : '\/kop-surat\.png'\}/g,
  '/kop-maleo.png'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Fixed ReferenceError');
