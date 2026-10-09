const fs = require('fs');
let file = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

file = file.replace(
  /let noInvoiceSheet = result\.noSeri \|\| result\.noKwitansi \|\| '';/g,
  "let noInvoiceSheet = result.noInvoice || result.noSeri || result.noKwitansi || '';"
);

fs.writeFileSync('src/app/actions/rekap.ts', file);
console.log("rekap.ts updated");
