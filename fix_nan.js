const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

// Fix NaN issues
page = page.replace(/item\.budget/g, 'item.totalBudget');

// Add "Tanggal Cetak"
const headerPDF = `<div className="hidden print:block p-2 mb-4 border-b-2 border-slate-800">
          <h2 className="text-2xl font-bold text-center uppercase">Laporan Pelaksanaan Anggaran (RAB) & Pengeluaran</h2>
          <p className="text-center text-sm mt-1">{rabData?.project?.name || 'Proyek SNT'}</p>
          {(startDate || endDate) ? <p className="text-center text-sm mt-1">Filter Periode Transaksi: {startDate || 'Awal'} s/d {endDate || 'Akhir'}</p> : <p className="text-center text-sm mt-1">Seluruh Periode</p>}
          <p className="text-right text-xs mt-2 text-slate-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>`;

page = page.replace(
  /<div className="hidden print:block p-2 mb-4 border-b-2 border-slate-800">[\s\S]*?<\/div>/,
  headerPDF
);

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed NaN and added print date');
