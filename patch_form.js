const fs = require('fs');
let content = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf-8');

const regex = /<div className="grid grid-cols-2 gap-4">([\s\S]*?)<\/select>\s*<\/div>\s*<div>\s*<label className="block text-sm font-medium mb-1">Bulan \(YYYY-MM\)<\/label>\s*<input type="month" required className="w-full border rounded p-2" value=\{manualBulan\} onChange=\{e => setManualBulan\(e.target.value\)\} \/>\s*<\/div>\s*<\/div>/;

const newBlock = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  $1</select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Jenis Pembelajaran</label>
                    <select className="w-full border rounded p-2" value={manualJenis} onChange={e => setManualJenis(e.target.value)}>
                      <option value="INTRAKURIKULER">Intrakurikuler</option>
                      <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bulan (YYYY-MM)</label>
                    <input type="month" required className="w-full border rounded p-2" value={manualBulan} onChange={e => setManualBulan(e.target.value)} />
                  </div>
                </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', content);
