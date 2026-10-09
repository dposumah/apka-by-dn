const fs = require('fs');

const rabPath = 'src/app/actions/rab.ts';
let rabContent = fs.readFileSync(rabPath, 'utf8');

if (!rabContent.includes('ktpUrl: data.ktpUrl || null,')) {
  rabContent = rabContent.replace(
    /lokasiSNT: data.lokasiSNT \|\| null,/,
    'lokasiSNT: data.lokasiSNT || null,\n        ktpUrl: data.ktpUrl || null,'
  );
  fs.writeFileSync(rabPath, rabContent);
}

const adminFormPath = 'src/app/(snt)/fasilitator/form.tsx';
let adminFormContent = fs.readFileSync(adminFormPath, 'utf8');

if (!adminFormContent.includes('ktpUrl')) {
  adminFormContent = adminFormContent.replace(
    /lokasiSNT: initialData\?.lokasiSNT \|\| '',/,
    "lokasiSNT: initialData?.lokasiSNT || '',\n    ktpUrl: initialData?.ktpUrl || '',"
  );
  
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

  adminFormContent = adminFormContent.replace(
    /const handleSubmit = async \(e: React.FormEvent\) => \{/,
    `${uploadLogic}\n\n  const handleSubmit = async (e: React.FormEvent) => {`
  );

  const KtpField = `
          <div className="space-y-2 md:col-span-2 border p-4 rounded-md bg-slate-50">
            <Label>Dokumen KTP</Label>
            <p className="text-xs text-slate-500 mb-2">Unggah file KTP (Maks 2MB)</p>
            {formData.ktpUrl ? (
              <div className="flex flex-col gap-2">
                <a href={formData.ktpUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                  Lihat KTP Tersimpan
                </a>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-max"
                  onClick={() => setFormData({...formData, ktpUrl: ''})}
                >
                  Ganti File
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*,.pdf" disabled={uploadingKtp} onChange={handleKtpUpload} className="max-w-xs" />
                {uploadingKtp && <span className="text-sm text-slate-500">Mengunggah...</span>}
              </div>
            )}
          </div>
`;

  adminFormContent = adminFormContent.replace(
    /<div className="md:col-span-2 flex justify-end mt-4">/,
    `${KtpField}\n        <div className="md:col-span-2 flex justify-end mt-4">`
  );

  fs.writeFileSync(adminFormPath, adminFormContent);
}

console.log('Done updating admin form');
