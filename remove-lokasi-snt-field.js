const fs = require('fs')
let path = 'src/app/(snt)/portal/profil/client-profil.tsx'
let code = fs.readFileSync(path, 'utf8')

const lokasiSNTField = `<div className="space-y-2">
                <Label>Lokasi SNT</Label>
                <select 
                  value={formData.lokasiSNT}
                  onChange={e => setFormData({...formData, lokasiSNT: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  <option value="Kabupaten Tanjung Jabung Timur, Jambi - Desa Suka Majuk, Kecamatan Geragai">1. Kabupaten Tanjung Jabung Timur, Jambi - Desa Suka Majuk, Kecamatan Geragai</option>
                  <option value="Kabupaten Tebo, Jambi - Komplek Perkantoran Seentak Galah Serengkuh Dayung, Jl. Lintas Tebo-Bungo Km. 12, Muara Tebo (37571)">2. Kabupaten Tebo, Jambi - Komplek Perkantoran</option>
                  <option value="Kabupaten Buton Tengah, Sulawesi Tenggara - Kampus B USN Kolaka, Jl. Poros Mawasangka-Wakambangura II, Desa Wakambangura, Kecamatan Mawasangka">3. Kabupaten Buton Tengah, Sulawesi Tenggara - Kampus B USN Kolaka</option>
                  <option value="Kabupaten Minahasa, Sulawesi Utara - BPMP Sulawesi Utara, Jl. Raya Manado-Tomohon, Pineleng II, Kecamatan Pineleng">4. Kabupaten Minahasa, Sulawesi Utara - BPMP Sulawesi Utara</option>
                  <option value="Kabupaten Kupang, Nusa Tenggara Timur - Jl. Nasional Trans-Timor No. KM 36, Naibonat, Kecamatan Kupang Timur (85362)">5. Kabupaten Kupang, Nusa Tenggara Timur - Naibonat</option>
                  <option value="Kota Tidore Kepulauan, Maluku Utara - Gedung BPMP Maluku Utara, Kecamatan Tidore Utara">6. Kota Tidore Kepulauan, Maluku Utara - Gedung BPMP</option>
                </select>
              </div>`

code = code.replace(lokasiSNTField, "")
fs.writeFileSync(path, code)
