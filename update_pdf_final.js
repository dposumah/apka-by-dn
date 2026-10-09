const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// Inject the invoice number under the <h2> title
const headerReplacement = `<h2>INVOICE HONORARIUM FASILITATOR</h2>
          \${noInvoiceStr ? \`<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>No Invoice:</strong> \${noInvoiceStr}</div>\` : ''}
          \${tanggalInvoice ? \`<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>Tanggal:</strong> \${tanggalInvoice}</div>\` : ''}`;

file = file.replace(/<h2>INVOICE HONORARIUM FASILITATOR<\/h2>/, headerReplacement);

// Remove the Keterangan
file = file.replace(/<p><strong>Keterangan:<\/strong> \${rekap\.isLocked \? 'Terkunci' : 'Draft'}<\/p>/, '');

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
console.log('PDF template updated to remove draft and show invoice number!');
