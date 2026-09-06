const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

// Add input
const targetLokasi = `<div className="space-y-2">
              <Label>Lokasi SNT *</Label>
              <Input name="lokasiSNT" defaultValue={initialData?.lokasiSNT || ''} required placeholder="Contoh: Kab. Tanjung Jabung Timur" />
            </div>`
            
const replacementLokasi = `<div className="space-y-2">
              <Label>Lokasi SNT *</Label>
              <Input name="lokasiSNT" defaultValue={initialData?.lokasiSNT || ''} required placeholder="Contoh: Kab. Tanjung Jabung Timur" />
            </div>
            <div className="space-y-2">
              <Label>Besaran Transport Darat (Rp) *</Label>
              <Input name="besaranTransport" type="number" defaultValue={initialData?.besaranTransport ?? 120000} required />
            </div>`

code = code.replace(targetLokasi, replacementLokasi)

// Add to payload
const targetPayload = `lokasiSNT: fd.get('lokasiSNT'),`
const replacementPayload = `lokasiSNT: fd.get('lokasiSNT'),
        besaranTransport: fd.get('besaranTransport'),`

code = code.replace(targetPayload, replacementPayload)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
