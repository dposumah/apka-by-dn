const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8');

// 1. Add state
code = code.replace(
  "biayaTransportLaut: '',",
  "biayaTransport: '',\n    biayaTransportLaut: '',"
);

code = code.replace(
  "const [tiket, setTiket] = useState<File | null>(null)",
  "const [tiket, setTiket] = useState<File | null>(null)\n  const [buktiDarat, setBuktiDarat] = useState<File | null>(null)"
);

// 2. Add validation for buktiDarat
code = code.replace(
  "if (parseFloat(formData.biayaTransportLaut) > 0 && !tiket) {\n      setFileError('Bukti Tiket Transport Antar Pulau wajib diunggah.');\n      return;\n    }",
  "if (parseFloat(formData.biayaTransportLaut) > 0 && !tiket) {\n      setFileError('Bukti Tiket Transport Antar Pulau wajib diunggah.');\n      return;\n    }\n    if (parseFloat(formData.biayaTransport) > 0 && !buktiDarat) {\n      setFileError('Bukti Transport Darat wajib diunggah.');\n      return;\n    }"
);

// 3. Upload buktiDarat
code = code.replace(
  "if (tiket) {\n        const fd = new FormData();\n        fd.append('file', tiket);\n        const res = await fetch('/api/upload', { method: 'POST', body: fd });\n        if (res.ok) {\n          const data = await res.json();\n          tiketUrl = data.url;\n        }\n      }",
  "if (tiket) {\n        const fd = new FormData();\n        fd.append('file', tiket);\n        const res = await fetch('/api/upload', { method: 'POST', body: fd });\n        if (res.ok) {\n          const data = await res.json();\n          tiketUrl = data.url;\n        }\n      }\n\n      let daratUrl = null;\n      if (buktiDarat) {\n        const fd = new FormData();\n        fd.append('file', buktiDarat);\n        const res = await fetch('/api/upload', { method: 'POST', body: fd });\n        if (res.ok) {\n          const data = await res.json();\n          daratUrl = data.url;\n        }\n      }"
);

// 4. Send to action
code = code.replace(
  "buktiTiketTransport: tiketUrl,",
  "biayaTransport: formData.biayaTransport,\n        buktiTransportDarat: daratUrl,\n        buktiTiketTransport: tiketUrl,"
);

// 5. UI Elements
const formInputs = `
              <div className="space-y-2">
                <Label>Biaya Transport Darat (Rp)</Label>
                <Input type="number" min="0" value={formData.biayaTransport} onChange={e => setFormData({...formData, biayaTransport: e.target.value})} placeholder="Kosongkan jika tidak ada" />
                <p className="text-xs text-slate-500">Maksimal klaim sesuai sisa budget mingguan Anda</p>
              </div>
              <div className="space-y-2">
                <Label>Biaya Transport Antar Pulau (Rp)</Label>
`;
code = code.replace(
  /<div className="space-y-2">\s*<Label>Biaya Transport Antar Pulau \(Rp\)<\/Label>/,
  formInputs
);

const buktiDaratHtml = `
            {parseFloat(formData.biayaTransport) > 0 && (
                <div className="space-y-2 col-span-2 border border-emerald-100 bg-emerald-50 p-4 rounded-md mt-2">
                  <Label>Bukti Transport Darat (Wajib)</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && setBuktiDarat(e.target.files[0])} />
                  <p className="text-xs text-emerald-600">Unggah foto/scan nota BBM, tiket bus, gojek, dll.</p>
                </div>
            )}
            
            {parseFloat(formData.biayaTransportLaut) > 0 && (
`;
code = code.replace(
  /\{parseFloat\(formData\.biayaTransportLaut\) > 0 && \(/,
  buktiDaratHtml
);

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code);
console.log('client-form.tsx patched');
