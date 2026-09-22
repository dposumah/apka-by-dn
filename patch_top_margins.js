const fs = require('fs');

function patchMargins(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  // Replace the old @page margin
  code = code.replace(/@page \{ margin: 1cm; \}/g, "@page { margin: 0.5cm 1cm; }");
  code = code.replace(/padding: 20px 40px;/g, "padding: 10px 40px;");
  fs.writeFileSync(filename, code);
  console.log('Patched top margins for ' + filename);
}

patchMargins('src/app/(snt)/fasilitator/akomodasi/client-page.tsx');
patchMargins('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx');
