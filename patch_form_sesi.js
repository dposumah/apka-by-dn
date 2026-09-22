const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// I will insert it before <label className="block text-sm font-medium mb-1">Jumlah JP</label>
code = code.replace(
  /<label className="block text-sm font-medium mb-1">Jumlah JP<\/label>/,
  '<label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>\n                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualSesi} onChange={e => setManualSesi(e.target.value)} />\n                </div>\n                <div>\n                  <label className="block text-sm font-medium mb-1">Jumlah JP</label>'
);

// I will change the grid to grid-cols-4 so they all fit on one line beautifully!
code = code.replace(
  /<div className="grid grid-cols-2 gap-4">\s*<div>\s*<label className="block text-sm font-medium mb-1">Jumlah Sesi \(Pertemuan\)/,
  '<div className="grid grid-cols-4 gap-4">\n                  <div>\n                    <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)'
);


fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('UI updated');
