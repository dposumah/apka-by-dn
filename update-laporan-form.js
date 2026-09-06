const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8')

// Add state for tiket File
code = code.replace(
  'const [foto2, setFoto2] = useState<File | null>(null)',
  'const [foto2, setFoto2] = useState<File | null>(null)\n  const [tiket, setTiket] = useState<File | null>(null)'
)

// Add upload logic
code = code.replace(
  'const foto2Url = foto2 ? await uploadFile(foto2) : null',
  'const foto2Url = foto2 ? await uploadFile(foto2) : null\n      const tiketUrl = tiket ? await uploadFile(tiket) : null'
)

code = code.replace(
  'foto2: foto2Url,',
  'foto2: foto2Url,\n        buktiTiketTransport: tiketUrl,'
)

// Add UI Field
const targetUI = `<div className="space-y-4 border-t pt-4 mt-2">`
const replacementUI = `{parseFloat(formData.biayaTransport) > 0 && (
                <div className="space-y-2 col-span-2 border border-blue-100 bg-blue-50 p-4 rounded-md mt-2">
                  <Label>Bukti Tiket Transport (Wajib jika Transport Antar Pulau)</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && setTiket(e.target.files[0])} />
                  <p className="text-xs text-blue-600">Unggah foto/scan tiket atau bukti pembayaran transport.</p>
                </div>
              )}
  
              <div className="space-y-4 border-t pt-4 mt-2">`

code = code.replace(targetUI, replacementUI)

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code)
