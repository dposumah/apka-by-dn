const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

// 1. Remove the old static narasi state
page = page.replace(
  /const \[narasi, setNarasi\] = useState\("Laporan ini menyajikan ringkasan pelaksanaan anggaran \(RAB\) dan rincian pengeluaran lapangan\. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah\."\)/,
  ''
);

// 2. Add the generator functions and state after totalAmount calculation
const generatorCode = `
  const totalAmount = initialData.reduce((acc, curr) => acc + curr.amount, 0);

  const generateAutoNarasi = () => {
    if (initialData.length === 0) return "Belum ada pengeluaran pada periode ini.";
    const highestItem = initialData.reduce((acc, curr) => {
      return curr.amount > acc.amount ? curr : acc;
    }, initialData[0]);
    return \`Pada periode laporan ini, terdapat total pengeluaran sebesar \${formatCurrency(totalAmount)} yang berasal dari \${initialData.length} transaksi. Pengeluaran tertinggi dialokasikan untuk item RAB "\${highestItem?.rabItem?.name || '-'}" sebesar \${formatCurrency(highestItem.amount)}. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah.\`;
  };

  const generateAutoUpcoming = () => {
    let estHonor = 0;
    let estTransport = 0;
    
    if (rabData && rabData.categories) {
      rabData.categories.forEach((cat: any) => {
        cat.items.forEach((item: any) => {
          const remaining = item.totalBudget - item.realized;
          if (remaining > 0) {
            const nameLower = item.name.toLowerCase();
            if (nameLower.includes('fasilitator koding') || nameLower.includes('honor')) {
              estHonor += remaining;
            }
            if (nameLower.includes('sewa rumah') || nameLower.includes('transport')) {
              estTransport += remaining;
            }
          }
        });
      });
    }
    
    return \`Perkiraan Pengeluaran Mendatang:
- Honorarium Fasilitator (Estimasi Maksimal Sisa Anggaran): \${formatCurrency(estHonor)}
- Bantuan Transport / Sewa Rumah Fasilitator (Estimasi Maksimal Sisa Anggaran): \${formatCurrency(estTransport)}
- Lain-lain: Rp 0\`;
  };

  const [narasi, setNarasi] = useState(generateAutoNarasi());
  const [upcoming, setUpcoming] = useState(generateAutoUpcoming());
`;

page = page.replace(
  /const totalAmount = initialData\.reduce\(\(acc, curr\) => acc \+ curr\.amount, 0\);/,
  generatorCode
);

// 3. Update the Narasi Card UI
const oldNarasiCard = /<Card className="print:hidden mb-6">\s*<CardHeader className="bg-slate-50 border-b py-3">\s*<CardTitle className="text-sm">Narasi \/ Ringkasan Laporan \(Tampil di Print\)<\/CardTitle>\s*<\/CardHeader>\s*<CardContent className="p-4">\s*<textarea\s*className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-\[100px\]"\s*value=\{narasi\}\s*onChange=\{\(e\) => setNarasi\(e\.target\.value\)\}\s*placeholder="Ketik narasi laporan di sini\.\.\."\s*\/>\s*<\/CardContent>\s*<\/Card>/;

const newNarasiCard = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:hidden">
        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Narasi / Ringkasan Laporan</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setNarasi(generateAutoNarasi())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={narasi} 
              onChange={(e) => setNarasi(e.target.value)}
              placeholder="Ketik narasi laporan di sini..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Perkiraan Pengeluaran Mendatang</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setUpcoming(generateAutoUpcoming())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={upcoming} 
              onChange={(e) => setUpcoming(e.target.value)}
              placeholder="Ketik perkiraan pengeluaran mendatang..."
            />
          </CardContent>
        </Card>
      </div>`;

page = page.replace(oldNarasiCard, newNarasiCard);

// 4. Add Upcoming Expenses to the Print output (after the Transaksi table)
const oldFooter = /<\/Card>\s*<\/div>\s*<\/div>/;
const newFooter = `</Card>
        
        {/* SECTION 3: Perkiraan Pengeluaran Mendatang (Print Only) */}
        <div className="hidden print:block mt-8">
          <div className="border-t-2 border-slate-800 pt-4 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{upcoming}</p>
          </div>
        </div>
      </div>
    </div>`;

page = page.replace(oldFooter, newFooter);

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed auto generate and upcoming expenses');
