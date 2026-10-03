const fs = require('fs');
const targetFile = 'src/app/(snt)/fasilitator/form.tsx';
let form = fs.readFileSync(targetFile, 'utf8');

form = form.replace(
  /besaranTransport: fd\.get\('besaranTransport'\) \? parseFloat\(fd\.get\('besaranTransport'\) as string\) : 120000,/,
  `besaranTransport: fd.get('besaranTransport') ? parseFloat(fd.get('besaranTransport') as string) : 120000,\n      jarakPPKm: fd.get('jarakPPKm') ? parseFloat(fd.get('jarakPPKm') as string) : 0,`
);

form = form.replace(
  /<div className="space-y-2 mt-4 pt-4 border-t">\s*<Label>Besaran Transport Darat \(Rp\) \*<\/Label>/,
  `<div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Jarak Kedudukan ke Lokasi (PP) *</Label>
              <Input name="jarakPPKm" type="number" step="0.1" min="0" defaultValue={initialData?.jarakPPKm ?? 0} required />
              <p className="text-xs text-slate-500">Jarak tempuh Pulang-Pergi (km). Dipakai untuk rumus transport.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Besaran Transport Darat (Rp) *</Label>`
);

form = form.replace(
  /<p className="text-xs text-slate-500">Batas maksimal nominal transport darat tanpa wajib upload bukti\.<\/p>\s*<\/div>/,
  `<p className="text-xs text-slate-500">Batas maksimal mingguan / Plafon (tanpa bukti & hasil rumus).</p>
            </div>
          </div>`
);

fs.writeFileSync(targetFile, form);
console.log('Fixed fasilitator form');
