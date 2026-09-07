const fs = require('fs')

const sntOptionsOld = `<option value="">-- Belum Ditentukan --</option>
                  <option value="Jambi - Kab. Tanjung Jabung Timur">Jambi - Kab. Tanjung Jabung Timur</option>
                  <option value="Jambi - Kab. Tebo">Jambi - Kab. Tebo</option>
                  <option value="Sulawesi Tenggara - Kab. Buton Tengah">Sulawesi Tenggara - Kab. Buton Tengah</option>
                  <option value="Nusa Tenggara Timur - Kab. Kupang">Nusa Tenggara Timur - Kab. Kupang</option>
                  <option value="Sulawesi Utara - Kab. Minahasa Utara">Sulawesi Utara - Kab. Minahasa Utara</option>
                  <option value="Maluku Utara - Kota Tidore Kepulauan">Maluku Utara - Kota Tidore Kepulauan</option>`

const sntOptionsNew = `<option value="">-- Belum Ditentukan --</option>
                  <option value="Kabupaten Tanjung Jabung Timur, Jambi - Desa Suka Majuk, Kecamatan Geragai">1. Kabupaten Tanjung Jabung Timur, Jambi - Desa Suka Majuk, Kecamatan Geragai</option>
                  <option value="Kabupaten Tebo, Jambi - Komplek Perkantoran Seentak Galah Serengkuh Dayung, Jl. Lintas Tebo-Bungo Km. 12, Muara Tebo (37571)">2. Kabupaten Tebo, Jambi - Komplek Perkantoran</option>
                  <option value="Kabupaten Buton Tengah, Sulawesi Tenggara - Kampus B USN Kolaka, Jl. Poros Mawasangka-Wakambangura II, Desa Wakambangura, Kecamatan Mawasangka">3. Kabupaten Buton Tengah, Sulawesi Tenggara - Kampus B USN Kolaka</option>
                  <option value="Kabupaten Minahasa, Sulawesi Utara - BPMP Sulawesi Utara, Jl. Raya Manado-Tomohon, Pineleng II, Kecamatan Pineleng">4. Kabupaten Minahasa, Sulawesi Utara - BPMP Sulawesi Utara</option>
                  <option value="Kabupaten Kupang, Nusa Tenggara Timur - Jl. Nasional Trans-Timor No. KM 36, Naibonat, Kecamatan Kupang Timur (85362)">5. Kabupaten Kupang, Nusa Tenggara Timur - Naibonat</option>
                  <option value="Kota Tidore Kepulauan, Maluku Utara - Gedung BPMP Maluku Utara, Kecamatan Tidore Utara">6. Kota Tidore Kepulauan, Maluku Utara - Gedung BPMP</option>`

let formPath = 'src/app/(snt)/fasilitator/form.tsx'
let formCode = fs.readFileSync(formPath, 'utf8')
formCode = formCode.replace(sntOptionsOld, sntOptionsNew)
fs.writeFileSync(formPath, formCode)

let profilPath = 'src/app/(snt)/portal/profil/client-profil.tsx'
let profilCode = fs.readFileSync(profilPath, 'utf8')
profilCode = profilCode.replace(sntOptionsOld, sntOptionsNew)
fs.writeFileSync(profilPath, profilCode)
