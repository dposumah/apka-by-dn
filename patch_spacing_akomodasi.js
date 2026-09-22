const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', 'utf8');

// Reduce spacing in both cetakInvoiceSewa and cetakInvoiceToT
code = code.replace(/padding: 40px;/g, 'padding: 20px 40px;'); // Less vertical padding
code = code.replace(/margin-bottom: 30px;/g, 'margin-bottom: 15px;');
code = code.replace(/margin-bottom: 20px;/g, 'margin-bottom: 10px;');
code = code.replace(/margin-top: 20px;/g, 'margin-top: 10px;');
code = code.replace(/margin-top: 50px;/g, 'margin-top: 30px;');
code = code.replace(/margin-top: 70px;/g, 'margin-top: 50px;');
code = code.replace(/margin-top: 40px;/g, 'margin-top: 20px;');

// Keep form-group compact
code = code.replace(/margin-bottom: 12px;/g, 'margin-bottom: 8px;');
code = code.replace(/padding: 10px;/g, 'padding: 6px 10px;');

fs.writeFileSync('src/app/(snt)/fasilitator/akomodasi/client-page.tsx', code);
console.log('Akomodasi spacing reduced');
