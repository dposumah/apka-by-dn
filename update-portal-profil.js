const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/profil/client-profil.tsx', 'utf8')

// Add to formData
code = code.replace(
  "pangkatGolongan: fasilitator.pangkatGolongan || '',",
  "pangkatGolongan: fasilitator.pangkatGolongan || '',\n    alamat: fasilitator.alamat || '',\n    kabKota: fasilitator.kabKota || '',\n    propinsi: fasilitator.propinsi || '',\n    lokasiSNT: fasilitator.lokasiSNT || '',"
)

// Add to read-only display
const targetDisplay = `<div>
                  <p className="text-slate-500">Email & Kontak</p>
                  <p className="font-medium">{fasilitator.email} <br/> {fasilitator.kontak}</p>
                </div>
              </div>`
              
const replaceDisplay = `<div>
                  <p className="text-slate-500">Email & Kontak</p>
                  <p className="font-medium">{fasilitator.email} <br/> {fasilitator.kontak}</p>
                </div>
                <div>
                  <p className="text-slate-500">Lokasi SNT</p>
                  <p className="font-medium">{fasilitator.lokasiSNT || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Alamat / Domisili</p>
                  <p className="font-medium">{fasilitator.alamat || '-'}</p>
                  <p className="text-slate-600 text-xs">
                    {fasilitator.kabKota || ''} {fasilitator.propinsi ? \`- \${fasilitator.propinsi}\` : ''}
                  </p>
                </div>
              </div>`
              
code = code.replace(targetDisplay, replaceDisplay)

// Add to Edit Form (after NIDN/Instansi block)
const targetEdit = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>`

const replaceEdit = `<div className="space-y-2">
                <Label>Lokasi SNT</Label>
                <select 
                  value={formData.lokasiSNT}
                  onChange={e => setFormData({...formData, lokasiSNT: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  <option value="Jambi - Kab. Tanjung Jabung Timur">Jambi - Kab. Tanjung Jabung Timur</option>
                  <option value="Jambi - Kab. Tebo">Jambi - Kab. Tebo</option>
                  <option value="Sulawesi Tenggara - Kab. Buton Tengah">Sulawesi Tenggara - Kab. Buton Tengah</option>
                  <option value="Nusa Tenggara Timur - Kab. Kupang">Nusa Tenggara Timur - Kab. Kupang</option>
                  <option value="Sulawesi Utara - Kab. Minahasa Utara">Sulawesi Utara - Kab. Minahasa Utara</option>
                  <option value="Maluku Utara - Kota Tidore Kepulauan">Maluku Utara - Kota Tidore Kepulauan</option>
                </select>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <Label>Alamat / Domisili Lengkap</Label>
                <Input value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kabupaten / Kota</Label>
                  <Input value={formData.kabKota} onChange={e => setFormData({...formData, kabKota: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Provinsi</Label>
                  <Input value={formData.propinsi} onChange={e => setFormData({...formData, propinsi: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Email</Label>`
                  
code = code.replace(targetEdit, replaceEdit)

fs.writeFileSync('src/app/(snt)/portal/profil/client-profil.tsx', code)
