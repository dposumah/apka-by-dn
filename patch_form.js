const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add to formData
code = code.replace(/tingkatSekolah:\s*'SMP',/, "tingkatSekolah: 'SMP',\n    metodePelaksanaan: 'LURING',");

// Add UI component
const uiCode = `
            <div className="space-y-3 p-4 bg-slate-50 rounded-md border border-slate-200">
              <Label>Metode Pelaksanaan</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="metodePelaksanaan" value="LURING" checked={formData.metodePelaksanaan === 'LURING'} onChange={e => setFormData({...formData, metodePelaksanaan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                  Luring (Tatap Muka)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="metodePelaksanaan" value="DARING" checked={formData.metodePelaksanaan === 'DARING'} onChange={e => setFormData({...formData, metodePelaksanaan: e.target.value})} className="w-4 h-4 text-emerald-600" />
                  Daring (Online)
                </label>
              </div>
              <p className="text-xs text-slate-500">Jika Daring, tidak ada penggantian biaya transport.</p>
            </div>
`;

code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-4">/, uiCode + '\n            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">');

fs.writeFileSync(filePath, code);
