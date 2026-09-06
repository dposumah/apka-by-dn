const fs = require('fs')

let content = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

// Add lokasiSNT to formData extraction
content = content.replace(
  "pangkatGolongan: fd.get('pangkatGolongan'),",
  "pangkatGolongan: fd.get('pangkatGolongan'),\n      lokasiSNT: fd.get('lokasiSNT'),"
)

// Add Lokasi SNT UI after Pangkat Golongan
const uiTarget = </select>
            </div>
          {statusKepegawaian === 'ASN' && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-100">
              <Label className="text-blue-900">Pangkat / Golongan ASN *</Label>
              <select 
                name="pangkatGolongan" 
                defaultValue={initialData?.pangkatGolongan || ''}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                required
              >
                <option value="" disabled>Pilih Golongan...</option>
                <option value="I/a (Juru Muda)">I/a (Juru Muda)</option>
                <option value="I/b (Juru Muda Tingkat I)">I/b (Juru Muda Tingkat I)</option>
                <option value="I/c (Juru)">I/c (Juru)</option>
                <option value="I/d (Juru Tingkat I)">I/d (Juru Tingkat I)</option>
                
                <option value="II/a (Pengatur Muda)">II/a (Pengatur Muda)</option>
                <option value="II/b (Pengatur Muda Tingkat I)">II/b (Pengatur Muda Tingkat I)</option>
                <option value="II/c (Pengatur)">II/c (Pengatur)</option>
                <option value="II/d (Pengatur Tingkat I)">II/d (Pengatur Tingkat I)</option>
                
                <option value="III/a (Penata Muda)">III/a (Penata Muda)</option>
                <option value="III/b (Penata Muda Tingkat I)">III/b (Penata Muda Tingkat I)</option>
                <option value="III/c (Penata)">III/c (Penata)</option>
                <option value="III/d (Penata Tingkat I)">III/d (Penata Tingkat I)</option>
                
                <option value="IV/a (Pembina)">IV/a (Pembina)</option>
                <option value="IV/b (Pembina Tingkat I)">IV/b (Pembina Tingkat I)</option>
                <option value="IV/c (Pembina Utama Muda)">IV/c (Pembina Utama Muda)</option>
                <option value="IV/d (Pembina Utama Madya)">IV/d (Pembina Utama Madya)</option>
                <option value="IV/e (Pembina Utama)">IV/e (Pembina Utama)</option>
              </select>
            </div>
          )}

const uiReplacement = uiTarget + 
          
          <div className="space-y-2">
            <Label>Lokasi SNT</Label>
            <select 
              name="lokasiSNT" 
              defaultValue={initialData?.lokasiSNT || ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih Lokasi SNT...</option>
              <option value="Jambi - Kab. Tanjung Jabung Timur">Jambi - Kab. Tanjung Jabung Timur</option>
              <option value="Jambi - Kab. Tebo">Jambi - Kab. Tebo</option>
              <option value="Sulawesi Tenggara - Kab. Buton Tengah">Sulawesi Tenggara - Kab. Buton Tengah</option>
              <option value="Nusa Tenggara Timur - Kab. Kupang">Nusa Tenggara Timur - Kab. Kupang</option>
              <option value="Sulawesi Utara - Kab. Minahasa Utara">Sulawesi Utara - Kab. Minahasa Utara</option>
              <option value="Maluku Utara - Kota Tidore Kepulauan">Maluku Utara - Kota Tidore Kepulauan</option>
            </select>
          </div>

content = content.replace(uiTarget, uiReplacement)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', content)
