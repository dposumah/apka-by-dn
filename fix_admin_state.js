const fs = require('fs');

const adminFormPath = 'src/app/(snt)/fasilitator/form.tsx';
let content = fs.readFileSync(adminFormPath, 'utf8');

if (!content.includes('const [ktpUrl, setKtpUrl]')) {
  // Add state
  content = content.replace(
    /const \[nip, setNip\] = useState\(initialData\?\.nipNuptk \|\| ''\)/,
    "const [nip, setNip] = useState(initialData?.nipNuptk || '')\n  const [ktpUrl, setKtpUrl] = useState(initialData?.ktpUrl || '')\n  const [uploadingKtp, setUploadingKtp] = useState(false)\n"
  );

  // Add upload handler
  const uploadLogic = `
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
      setKtpUrl(data.url)
    } catch (err: any) {
      await alert(err.message || 'Terjadi kesalahan saat unggah KTP')
    } finally {
      setUploadingKtp(false)
    }
  }
`;

  content = content.replace(
    /async function handleSubmit/,
    `${uploadLogic}\n  async function handleSubmit`
  );

  // Add ktpUrl to payload
  content = content.replace(
    /jenisTugas: fd\.get\('jenisTugas'\) as string \|\| 'INTRAKURIKULER',/,
    "jenisTugas: fd.get('jenisTugas') as string || 'INTRAKURIKULER',\n      ktpUrl: ktpUrl,"
  );

  // Fix references in the JSX (replace formData.ktpUrl with ktpUrl)
  content = content.replace(/formData\.ktpUrl/g, 'ktpUrl');
  content = content.replace(/setFormData\(\{\.\.\.formData, ktpUrl: ''\}\)/g, "setKtpUrl('')");

  fs.writeFileSync(adminFormPath, content);
}
console.log('Fixed admin form');
