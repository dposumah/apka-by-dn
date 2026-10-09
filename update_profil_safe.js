const fs = require('fs');

const clientProfilPath = 'src/app/(snt)/portal/profil/client-profil.tsx';
let content = fs.readFileSync(clientProfilPath, 'utf8');

if (!content.includes('ktpUrl')) {
  // Add formData ktpUrl
  content = content.replace(
    /lokasiSNT: fasilitator.lokasiSNT \|\| '',/,
    "lokasiSNT: fasilitator.lokasiSNT || '',\n      ktpUrl: fasilitator.ktpUrl || '',"
  );

  // Add state and upload logic
  const uploadLogic = `
  const [uploadingKtp, setUploadingKtp] = useState(false)

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB')
      return
    }

    setUploadingKtp(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal unggah KTP')
      
      setFormData(prev => ({ ...prev, ktpUrl: data.url }))
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat unggah KTP')
    } finally {
      setUploadingKtp(false)
    }
  }
`;

  content = content.replace(
    /const handleSubmit = async \(e: React.FormEvent\) => \{/,
    `${uploadLogic}\n\n    const handleSubmit = async (e: React.FormEvent) => {`
  );

  // Add field in form
  const KtpField = `
                  <div className="space-y-2 col-span-1 md:col-span-2 mt-4 p-4 border rounded-md bg-slate-50">
                    <Label className="text-base font-semibold">Dokumen KTP</Label>
                    <p className="text-xs text-slate-500 mb-2">Unggah file KTP Anda (PDF/Gambar maksimal 2MB)</p>
                    {formData.ktpUrl ? (
                      <div className="flex flex-col gap-2">
                        <a href={formData.ktpUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                          ✓ KTP Tersimpan (Lihat File)
                        </a>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="w-max"
                          onClick={() => setFormData({...formData, ktpUrl: ''})}
                        >
                          Ubah KTP
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="file" 
                          accept="image/*,.pdf" 
                          disabled={uploadingKtp}
                          onChange={handleKtpUpload} 
                          className="max-w-xs cursor-pointer"
                        />
                        {uploadingKtp && <span className="text-sm text-slate-500 animate-pulse">Mengunggah...</span>}
                      </div>
                    )}
                  </div>
`;

  content = content.replace(
    /<div className="flex justify-end gap-2 pt-6">/,
    `${KtpField}\n                <div className="flex justify-end gap-2 pt-6">`
  );

  // Add field in view
  const ViewKtp = `
                  <div className="col-span-1 md:col-span-2 mt-4 p-4 border rounded-md bg-slate-50">
                    <p className="text-slate-500 font-semibold mb-2">Dokumen KTP</p>
                    {fasilitator.ktpUrl ? (
                      <a href={fasilitator.ktpUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        Lihat KTP
                      </a>
                    ) : (
                      <p className="text-red-500 font-medium">Belum diunggah</p>
                    )}
                  </div>
`;

  // Safely insert ViewKtp after NPWP in view
  content = content.replace(
    /<p className="text-slate-500">NIK \/ NPWP<\/p>\s*<p className="font-medium">\{fasilitator.npwpNik\}<\/p>\s*<\/div>\s*<\/div>/,
    `<p className="text-slate-500">NIK / NPWP</p>\n                    <p className="font-medium">{fasilitator.npwpNik}</p>\n                  </div>\n${ViewKtp}\n                </div>`
  );

  fs.writeFileSync(clientProfilPath, content);
}
console.log('Fixed client-profil');
