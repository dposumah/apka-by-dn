const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

// 1. Remove line-clamp-2
page = page.replace(
  /<td className="py-2 px-4 text-slate-600 line-clamp-2" title=\{exp\.description\}>/,
  '<td className="py-2 px-4 text-slate-600" title={exp.description}>'
);

// 2. Add Narasi state
if (!page.includes('const [narasi, setNarasi]')) {
  page = page.replace(
    /const \[endDate, setEndDate\] = useState\(searchParams\.get\('endDate'\) \|\| ''\)/,
    `const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [narasi, setNarasi] = useState("Laporan ini menyajikan ringkasan pelaksanaan anggaran (RAB) dan rincian pengeluaran lapangan. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah.")`
  );
}

// 3. Add Kop & Narasi to Print Header
const oldHeaderRegex = /<div className="hidden print:block p-2 mb-4 border-b-2 border-slate-800">\s*<h2 className="text-2xl font-bold text-center uppercase">Laporan Pelaksanaan Anggaran \(RAB\) & Pengeluaran<\/h2>\s*<p className="text-center text-sm mt-1">\{rabData\?\.project\?\.name \|\| 'Proyek SNT'\}<\/p>\s*\{\(startDate \|\| endDate\) \? <p className="text-center text-sm mt-1">Filter Periode Transaksi: \{startDate \|\| 'Awal'\} s\/d \{endDate \|\| 'Akhir'\}<\/p> : <p className="text-center text-sm mt-1">Seluruh Periode<\/p>\}\s*<\/div>/;

const newHeader = `<div className="hidden print:block mb-6">
          <img src="/kop-maleo.png" alt="Kop Yayasan Maleo" className="w-full object-contain mb-4 border-b-4 border-slate-800 pb-2" />
          <h2 className="text-xl font-bold text-center uppercase mt-4">Laporan Pelaksanaan Anggaran (RAB) & Pengeluaran</h2>
          <p className="text-center text-sm mt-1">{rabData?.project?.name || 'Proyek SNT'}</p>
          {(startDate || endDate) ? <p className="text-center text-sm mt-1">Periode: {startDate || 'Awal'} s/d {endDate || 'Akhir'}</p> : <p className="text-center text-sm mt-1">Periode: Keseluruhan</p>}
          
          <div className="mt-6 mb-4 text-justify text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{narasi}</p>
          </div>
        </div>`;

page = page.replace(oldHeaderRegex, newHeader);

// 4. Add Narasi Editor to UI (above the report container)
const oldContainer = /<div id="report-container" className="space-y-8 bg-white print:p-4">/;
const newContainer = `<Card className="print:hidden mb-6">
        <CardHeader className="bg-slate-50 border-b py-3">
          <CardTitle className="text-sm">Narasi / Ringkasan Laporan (Tampil di Print)</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <textarea 
            className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[100px]" 
            value={narasi} 
            onChange={(e) => setNarasi(e.target.value)}
            placeholder="Ketik narasi laporan di sini..."
          />
        </CardContent>
      </Card>

      <div id="report-container" className="space-y-8 bg-white print:p-4">`;

if (!page.includes('Narasi / Ringkasan Laporan')) {
  page = page.replace(oldContainer, newContainer);
}

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed truncation, added Kop and Narasi');
