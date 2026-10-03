const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

// Replace the exportPDF function
const oldFuncRegex = /const exportPDF = async \(\) => \{[\s\S]*?\}\s*const totalAmount/m;
const newFunc = `const exportPDF = () => {
    window.print();
  }

  const totalAmount`;

page = page.replace(oldFuncRegex, newFunc);

// Change button text and remove isExporting
page = page.replace(
  /<Button onClick=\{exportPDF\} disabled=\{isExporting\} className="bg-slate-900 hover:bg-slate-800 text-white">[\s\S]*?<\/Button>/,
  `<Button onClick={exportPDF} className="bg-slate-900 hover:bg-slate-800 text-white">
            Print Laporan Lengkap (PDF)
          </Button>`
);

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed exportPDF to use window.print()');
