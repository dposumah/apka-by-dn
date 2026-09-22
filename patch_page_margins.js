const fs = require('fs');

function patchCss(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  if (!code.includes('@page { margin:')) {
    code = code.replace(/<style>/g, "<style>\n            @page { margin: 1cm; }\n            @media print { body { padding: 0; } }");
    fs.writeFileSync(filename, code);
    console.log('Patched media print for ' + filename);
  }
}

patchCss('src/app/(snt)/fasilitator/akomodasi/client-page.tsx');
patchCss('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx');
