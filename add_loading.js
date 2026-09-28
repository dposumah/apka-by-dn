const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

page = page.replace(
  /disabled=\{!printInvoice && !printKwitansi\}\s*className="w-full mt-4 bg-green-600 hover:bg-green-700"\s*>\s*Cetak Dokumen/,
  `disabled={(!printInvoice && !printKwitansi) || isGeneratingPdf}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingPdf ? 'Memproses Dokumen...' : 'Cetak Dokumen'}`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
console.log('Fixed loading state');
