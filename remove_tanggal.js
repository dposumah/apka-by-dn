const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

// Remove Tanggal Cetak
page = page.replace(
  /<p className="text-right text-xs mt-2 text-slate-500">Tanggal Cetak:.*?<\/p>/,
  ''
);

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Removed Tanggal Cetak');
