const fs = require('fs');

// 1. Update action
let rab = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
rab = rab.replace(
  /lokasiSNT: data\.lokasiSNT \|\| null,/,
  "lokasiSNT: data.lokasiSNT || null,\n        jenisTugas: data.jenisTugas || currentFasil?.jenisTugas || 'INTRAKURIKULER',"
);
fs.writeFileSync('src/app/actions/rab.ts', rab);

// 2. Update client-profil.tsx
let cp = fs.readFileSync('src/app/(snt)/portal/profil/client-profil.tsx', 'utf8');

// A. State
cp = cp.replace(
  /lokasiSNT: fasilitator\.lokasiSNT \|\| '',\s*\}/,
  "lokasiSNT: fasilitator.lokasiSNT || '',\n    jenisTugas: fasilitator.jenisTugas || 'INTRAKURIKULER',\n  }"
);

// B. Form Input (adding below Nama Lengkap)
cp = cp.replace(
  /<Input value=\{formData\.namaLengkap\} onChange=\{e => setFormData\(\{\.\.\.formData, namaLengkap: e\.target\.value\}\)\} required \/>\s*<\/div>/,
  `<Input value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Jenis Tugas / Mengajar</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                  value={formData.jenisTugas}
                  onChange={e => setFormData({...formData, jenisTugas: e.target.value})}
                  required
                >
                  <option value="INTRAKURIKULER">Hanya Intrakurikuler</option>
                  <option value="EKSTRAKURIKULER">Hanya Ekstrakurikuler</option>
                  <option value="KEDUANYA">Keduanya (Intra & Ekstra)</option>
                </select>
              </div>`
);

// C. View Mode (adding below Nama Lengkap)
cp = cp.replace(
  /<p className="font-medium text-lg">\{fasilitator\.namaLengkap\}<\/p>\s*<\/div>/,
  `<p className="font-medium text-lg">{fasilitator.namaLengkap}</p>
                </div>
                <div>
                  <p className="text-slate-500">Jenis Tugas / Mengajar</p>
                  <p className="font-medium">
                    {fasilitator.jenisTugas === 'EKSTRAKURIKULER' ? 'Ekstrakurikuler' : fasilitator.jenisTugas === 'KEDUANYA' ? 'Intrakurikuler & Ekstrakurikuler' : 'Intrakurikuler'}
                  </p>
                </div>`
);

fs.writeFileSync('src/app/(snt)/portal/profil/client-profil.tsx', cp);
console.log('Done updating portal profil');
