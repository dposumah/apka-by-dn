const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Imports
code = code.replace("import { useState } from 'react'", "import { useState, useEffect } from 'react'\nimport { createRekapManual } from '@/app/actions/rekap'");

// 2. Props
code = code.replace("export function RekapHonorClient({ initialData }: { initialData: any[] }) {", "export function RekapHonorClient({ initialData, fasilitators = [] }: { initialData: any[], fasilitators?: any[] }) {");

// 3. States
const stateIdx = code.indexOf("const [loadingId, setLoadingId] = useState<string | null>(null)");
const manualFormState = `
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualFasilId, setManualFasilId] = useState('')
  const [manualBulan, setManualBulan] = useState('')
  const [manualJP, setManualJP] = useState('')
  const [manualHonor, setManualHonor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto calculate if JP changes
    const jp = parseInt(manualJP) || 0
    setManualHonor((jp * 65000).toString())
  }, [manualJP])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0)
      setShowManualForm(false)
      setManualFasilId('')
      setManualBulan('')
      setManualJP('')
      setManualHonor('')
      router.refresh()
    } catch(err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
`;
code = code.substring(0, stateIdx) + manualFormState + code.substring(stateIdx);

// 4. UI Injection
const titleDivIdx = code.indexOf("<div>\n        <h1 className=\"text-3xl font-bold tracking-tight\">Rekap Honorarium Bulanan</h1>");
const endTitleDivIdx = code.indexOf("</div>", titleDivIdx) + 6;

const newHeaderAndForm = `
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rekap Honorarium Bulanan</h1>
          <p className="text-slate-500 mt-1">Daftar rekapitulasi honorarium yang diajukan oleh Fasilitator.</p>
        </div>
        <button 
          onClick={() => setShowManualForm(!showManualForm)}
          className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
        >
          {showManualForm ? 'Batal' : '+ Buat Rekap Manual'}
        </button>
      </div>

      {showManualForm && (
        <Card className="mb-6 border-blue-200">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
            <CardTitle className="text-blue-900 text-lg">Buat Rekap Manual Tanpa Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fasilitator</label>
                  <select required className="w-full border rounded p-2" value={manualFasilId} onChange={e => setManualFasilId(e.target.value)}>
                    <option value="">Pilih Fasilitator...</option>
                    {fasilitators.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.namaLengkap} - {f.lokasiSNT}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bulan (YYYY-MM)</label>
                  <input type="month" required className="w-full border rounded p-2" value={manualBulan} onChange={e => setManualBulan(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah JP</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualJP} onChange={e => setManualJP(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Honor (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualHonor} onChange={e => setManualHonor(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Munculkan di Tabel'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
`;

code = code.substring(0, titleDivIdx) + newHeaderAndForm + code.substring(endTitleDivIdx);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Client page updated');
