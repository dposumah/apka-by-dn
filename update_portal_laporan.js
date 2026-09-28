const fs = require('fs');

// 1. Update page.tsx to pass jenisTugas
let p = fs.readFileSync('src/app/(snt)/portal/laporan/page.tsx', 'utf8');
p = p.replace(
  /defaultJPEkstra=\{fasilitator\.defaultJPEkstra\}/,
  'defaultJPEkstra={fasilitator.defaultJPEkstra}\n      jenisTugas={fasilitator.jenisTugas}'
);
fs.writeFileSync('src/app/(snt)/portal/laporan/page.tsx', p);

// 2. Update client-form.tsx to accept jenisTugas and use it
let c = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

c = c.replace(
  /export function LaporanClientForm\(\{ fasilitatorId, besaranTransport, defaultJPIntra, defaultJPEkstra \}: \{ fasilitatorId: string, besaranTransport: number, defaultJPIntra: number, defaultJPEkstra: number \}\) \{/,
  'export function LaporanClientForm({ fasilitatorId, besaranTransport, defaultJPIntra, defaultJPEkstra, jenisTugas = "INTRAKURIKULER" }: { fasilitatorId: string, besaranTransport: number, defaultJPIntra: number, defaultJPEkstra: number, jenisTugas?: string }) {'
);

c = c.replace(
  /jenisPembelajaran: 'INTRAKURIKULER'/,
  "jenisPembelajaran: jenisTugas === 'EKSTRAKURIKULER' ? 'EKSTRAKURIKULER' : 'INTRAKURIKULER'"
);

c = c.replace(
  /<select\s+className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"\s+value=\{formData\.jenisPembelajaran\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, jenisPembelajaran: e\.target\.value\}\)\}\s+>\s*<option value="INTRAKURIKULER">Intrakurikuler<\/option>\s*<option value="EKSTRAKURIKULER">Ekstrakurikuler<\/option>\s*<\/select>/,
  `<select 
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.jenisPembelajaran}
                      onChange={e => setFormData({...formData, jenisPembelajaran: e.target.value})}
                    >
                      {jenisTugas !== 'EKSTRAKURIKULER' && <option value="INTRAKURIKULER">Intrakurikuler</option>}
                      {jenisTugas !== 'INTRAKURIKULER' && <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>}
                    </select>`
);

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', c);
console.log('Done updating laporan logic');
