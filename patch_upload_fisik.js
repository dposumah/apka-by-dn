const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Fix duplicate type in signature and add size check
const oldHandleFileChange = /const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>, field: 'foto1' \| 'foto2' \| 'fileLaporanFisik' \| 'fileLaporanFisik'\) => \{\s*const file = e\.target\.files\?\.\[0\]\s*setFileError\(''\)\s*if \(!file\) return\s*if \(file\.size > 5 \* 1024 \* 1024\) \{\s*setFileError\('Ukuran file maksimal 5MB'\)\s*e\.target\.value = ''\s*return\s*\}/;

const newHandleFileChange = `const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto1' | 'foto2' | 'fileLaporanFisik') => {
      const file = e.target.files?.[0]
      setFileError('')
      
      if (!file) return
      
      if (field === 'fileLaporanFisik' && file.size > 2 * 1024 * 1024) {
        setFileError('Ukuran file laporan fisik maksimal 2MB')
        e.target.value = ''
        return
      }
      
      if (field !== 'fileLaporanFisik' && file.size > 5 * 1024 * 1024) {
        setFileError('Ukuran foto maksimal 5MB')
        e.target.value = ''
        return
      }`;

code = code.replace(oldHandleFileChange, newHandleFileChange);

// Update HTML accept attribute and text
code = code.replace(/accept="\.pdf,\.doc,\.docx"/, 'accept=".pdf"');
code = code.replace(/Silakan unduh template, isi, tanda tangani, lalu unggah kembali di sini \(Bisa PDF\/Word\)\./, 'Silakan unduh template, isi, tanda tangani, simpan sebagai PDF, lalu unggah kembali di sini (Maksimal 2 MB).');

fs.writeFileSync(filePath, code);
