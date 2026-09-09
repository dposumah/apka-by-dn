const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Rename Laporan Fisik
code = code.replace(/Laporan Fisik \(Berita Acara \/ Laporan\)/, 'Laporan Fisik');

// 2. Remove text "Jika Daring, tidak ada penggantian biaya transport."
code = code.replace(/<p className="text-xs text-slate-500">Jika Daring, tidak ada penggantian biaya transport\.<\/p>/, '');

// 3. Add jenisPembelajaran to formData
code = code.replace(/metodePelaksanaan: 'LURING',/, "metodePelaksanaan: 'LURING',\n      jenisPembelajaran: 'INTRAKURIKULER',");

// 4. Update the JP inputs section
const oldJpSectionRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">\s*<div className="space-y-2">\s*<Label>JP Intrakurikuler<\/Label>\s*<Input type="number" min="0" value=\{formData\.jumlahJPIntra\} onChange=\{e => setFormData\(\{\.\.\.formData, \s*jumlahJPIntra: e\.target\.value\}\)\} placeholder="0" \/>\s*<p className="text-xs text-slate-500">Maksimal 8 JP \/ minggu \/ Lokasi<\/p>\s*<\/div>\s*<div className="space-y-2">\s*<Label>JP Ekstrakurikuler<\/Label>\s*<Input type="number" min="0" value=\{formData\.jumlahJPEkstra\} onChange=\{e => setFormData\(\{\.\.\.formData,\s*jumlahJPEkstra: e\.target\.value\}\)\} placeholder="0" \/>\s*<p className="text-xs text-slate-500">Maksimal 4 JP \/ minggu \/ Lokasi<\/p>\s*<\/div>/;

const newJpSection = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                  <Label>Jenis Pembelajaran</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.jenisPembelajaran}
                    onChange={e => setFormData({...formData, jenisPembelajaran: e.target.value, jumlahJPIntra: '', jumlahJPEkstra: ''})}
                  >
                    <option value="INTRAKURIKULER">Intrakurikuler</option>
                    <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                  </select>
                </div>
                
                {formData.jenisPembelajaran === 'INTRAKURIKULER' ? (
                  <div className="space-y-2">
                    <Label>Jumlah JP (Intrakurikuler)</Label>
                    <Input type="number" min="0" value={formData.jumlahJPIntra} onChange={e => setFormData({...formData, jumlahJPIntra: e.target.value})} placeholder="0" />
                    <p className="text-xs text-slate-500">Maksimal 8 JP / minggu / Lokasi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Jumlah JP (Ekstrakurikuler)</Label>
                    <Input type="number" min="0" value={formData.jumlahJPEkstra} onChange={e => setFormData({...formData, jumlahJPEkstra: e.target.value})} placeholder="0" />
                    <p className="text-xs text-slate-500">Maksimal 4 JP / minggu / Lokasi</p>
                  </div>
                )}`;

code = code.replace(oldJpSectionRegex, newJpSection);

fs.writeFileSync(filePath, code);
