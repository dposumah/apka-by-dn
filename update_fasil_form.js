const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8');

// Update data collection in form submit
c = c.replace(
  /defaultJPEkstra: fd\.get\('defaultJPEkstra'\) \? parseInt\(fd\.get\('defaultJPEkstra'\) as string\) : 4,/,
  "defaultJPEkstra: fd.get('defaultJPEkstra') ? parseInt(fd.get('defaultJPEkstra') as string) : 4,\n      jenisTugas: fd.get('jenisTugas') as string || 'INTRAKURIKULER',"
);

// Add the Jenis Tugas select field in the UI
c = c.replace(
  /<Input name="defaultJPEkstra" type="number" defaultValue=\{initialData\?\.defaultJPEkstra \?\? 4\} required \/>\s*<\/div>\s*<\/div>/,
  `<Input name="defaultJPEkstra" type="number" defaultValue={initialData?.defaultJPEkstra ?? 4} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Jenis Tugas / Mengajar</Label>
            <select name="jenisTugas" defaultValue={initialData?.jenisTugas || 'INTRAKURIKULER'} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="INTRAKURIKULER">Hanya Intrakurikuler</option>
              <option value="EKSTRAKURIKULER">Hanya Ekstrakurikuler</option>
              <option value="KEDUANYA">Keduanya (Intra & Ekstra)</option>
            </select>
          </div>`
);

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', c);
console.log('Done updating form.tsx');
