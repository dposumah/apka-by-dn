const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

if (!code.includes('const [buktiDarat, setBuktiDarat]')) {
  code = code.replace(
    "const [fileLaporanFisik, setFileLaporanFisik] = useState('')",
    "const [fileLaporanFisik, setFileLaporanFisik] = useState('')\n  const [buktiDarat, setBuktiDarat] = useState<File | null>(null)\n  const [tiket, setTiket] = useState<File | null>(null)"
  );
}

const regex = /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setSaving\(false\)\r?\n\s*\}\r?\n\s*\}/;

const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foto1 && !foto2) {
      setFileError('Harap lampirkan minimal 1 foto kegiatan')
      return
    }

    if (parseFloat(formData.biayaTransport) > 0 && !buktiDarat) {
      setFileError('Bukti Transport Darat wajib diunggah.');
      return;
    }
    if (parseFloat(formData.biayaTransportLaut) > 0 && !tiket) {
      setFileError('Bukti Tiket Transport Antar Pulau wajib diunggah.');
      return;
    }
    
    setSaving(true)
    try {
      let daratUrl = null;
      if (buktiDarat) {
        daratUrl = await uploadFile(buktiDarat);
      }
      let tiketUrl = null;
      if (tiket) {
        tiketUrl = await uploadFile(tiket);
      }

      await submitLaporanKegiatan(fasilitatorId, {
        ...formData,
        foto1,
        foto2,
        fileLaporanFisik,
        buktiTransportDarat: daratUrl,
        buktiTiketTransport: tiketUrl
      })
      router.push('/portal')
      router.refresh()
    } catch (error) {
      toast({ title: 'Gagal', description: 'Gagal mengirim laporan', type: 'error' })
      setSaving(false)
    }
  }`;

if (regex.test(code)) {
    code = code.replace(regex, newSubmit);
    fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code);
    console.log('Fixed client-form.tsx safely');
} else {
    console.log('Regex did not match!');
}
