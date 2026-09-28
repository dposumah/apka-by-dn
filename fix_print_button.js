const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

content = content.replace(
  /<Button\s*onClick=\{handlePrint\}\s*disabled=\{!printInvoice && !printKwitansi\}\s*className="w-full mt-4 bg-green-600 hover:bg-green-700"\s*>/,
  `<Button 
                type="button"
                onClick={handlePrint}
                disabled={!printInvoice && !printKwitansi}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', content);
console.log('Fixed button type');
