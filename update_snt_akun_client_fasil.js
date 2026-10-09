const fs = require('fs');

let client = fs.readFileSync('src/app/(snt)/snt-akun/client.tsx', 'utf8');

// Update signature
if (!client.includes('facilitators?: any[]')) {
  client = client.replace(
    /export function SntAkunClient\(\{ user, hargaPertamax \}: \{ user: any, hargaPertamax\?: string \}\) \{/,
    'export function SntAkunClient({ user, hargaPertamax, facilitators = [] }: { user: any, hargaPertamax?: string, facilitators?: any[] }) {'
  );
}

// Add import
if (!client.includes('updateBulkFasilitatorTransportSettings')) {
  client = client.replace(
    /import \{ updateAppSetting \} from '@\/app\/actions\/rab'/,
    "import { updateAppSetting, updateBulkFasilitatorTransportSettings } from '@/app/actions/rab'"
  );
}

// Add state for facilitators list
const fasilState = `
  const [fasilList, setFasilList] = useState(facilitators.map(f => ({ ...f })))
  const [fasilLoading, setFasilLoading] = useState(false)
  const [fasilSuccess, setFasilSuccess] = useState(false)

  const handleFasilChange = (id: string, field: string, value: string) => {
    setFasilList(prev => prev.map(f => f.id === id ? { ...f, [field]: parseFloat(value) || 0 } : f))
  }

  const handleBulkFasilSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFasilLoading(true)
    setFasilSuccess(false)
    try {
      await updateBulkFasilitatorTransportSettings(fasilList.map(f => ({
        id: f.id,
        jarakPPKm: f.jarakPPKm,
        besaranTransport: f.besaranTransport
      })))
      setFasilSuccess(true)
      setTimeout(() => setFasilSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setFasilLoading(false)
    }
  }
`;

if (!client.includes('handleBulkFasilSubmit')) {
  client = client.replace(
    /const \[pertamaxLoading, setPertamaxLoading\] = useState\(false\)/,
    fasilState + '\n  const [pertamaxLoading, setPertamaxLoading] = useState(false)'
  );
}

// Ensure the first condition checks for both ADMIN and SUPER_ADMIN instead of just SUPER_ADMIN
client = client.replace(
  /\{user\.role === 'SUPER_ADMIN' && \(/,
  "{['ADMIN', 'SUPER_ADMIN'].includes(user.role) && ("
);

// We need to add the table card inside the ['ADMIN', 'SUPER_ADMIN'] block.
// Let's replace the closing div of the pertamax card and append the fasil card.
const fasilCard = `
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Daftar Pengaturan Jarak & Plafon Fasilitator</CardTitle>
                <CardDescription>Sesuaikan nilai Jarak PP (KM) dan Batas Transport Darat (Rp) per fasilitator secara massal.</CardDescription>
              </CardHeader>
              <CardContent>
                {fasilSuccess && (
                  <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Berhasil!</AlertTitle>
                    <AlertDescription>Pengaturan jarak dan plafon fasilitator telah disimpan.</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleBulkFasilSubmit}>
                  <div className="overflow-x-auto max-h-[400px] border rounded-md">
                    <table className="w-full text-sm text-left text-slate-600 relative">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Fasilitator</th>
                          <th className="px-4 py-3 font-semibold">Lokasi SNT</th>
                          <th className="px-4 py-3 font-semibold w-32">Jarak PP (KM)</th>
                          <th className="px-4 py-3 font-semibold w-40">Batas Transport (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {fasilList.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{f.namaLengkap}</td>
                            <td className="px-4 py-3">{f.lokasiSNT || '-'}</td>
                            <td className="px-4 py-2">
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                value={f.jarakPPKm || ''} 
                                onChange={(e) => handleFasilChange(f.id, 'jarakPPKm', e.target.value)} 
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input 
                                type="number" 
                                min="0" 
                                value={f.besaranTransport || ''} 
                                onChange={(e) => handleFasilChange(f.id, 'besaranTransport', e.target.value)} 
                                className="h-8"
                              />
                            </td>
                          </tr>
                        ))}
                        {fasilList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-500">Belum ada data fasilitator aktif.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={fasilLoading}>
                      {fasilLoading ? 'Menyimpan...' : 'Simpan Perubahan Massal'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
`;

if (!client.includes('handleBulkFasilSubmit')) {
  // If we already added the state, we still need to add the UI
}

// But wait, my script replaces it in the file. Let's just do a regex replace.
client = client.replace(
  /<\/form>\s*<\/CardContent>\s*<\/Card>\s*<\/div>\s*\)\}/,
  `</form>\n              </CardContent>\n            </Card>\n${fasilCard}\n          </div>\n        )}`
);

fs.writeFileSync('src/app/(snt)/snt-akun/client.tsx', client);
console.log('Fixed snt-akun client');
