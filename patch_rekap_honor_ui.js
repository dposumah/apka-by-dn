const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add missing modal JSX at the very end before the last closing tags
const modalJsx = `
      {/* Modal Pilih Dokumen */}
      {showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Pilih Jenis Dokumen untuk Dicetak</h3>
            <p className="text-sm text-slate-600 mb-6">Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo).</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handlePrintWithKop('invoice')}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Invoice Honorarium (Format Lama)</span>
              </button>
              <button 
                onClick={() => handlePrintWithKop('kwitansi')}
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Kwitansi (Format Yayasan Maleo)</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowKopModal(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
`;

// Insert it right before the last `</div>\n  )\n}`
code = code.replace(/<\/div>\s*\)\s*}\s*$/, modalJsx + '\n    </div>\n  )\n}');

// 2. Add Rate Honor field to the manual form
// The manual form state
code = code.replace(
  "const [manualJP, setManualJP] = useState('')",
  "const [manualJP, setManualJP] = useState('')\n  const [manualRate, setManualRate] = useState('65000')"
);
code = code.replace(
  "const jp = parseInt(manualJP) || 0\n    setManualHonor((jp * 65000).toString())",
  "const jp = parseInt(manualJP) || 0\n    const rate = parseInt(manualRate) || 0\n    setManualHonor((jp * rate).toString())"
);
// Also add manualRate to useEffect dependencies
code = code.replace(
  "}, [manualJP])",
  "}, [manualJP, manualRate])"
);
// Reset manualRate
code = code.replace(
  "setManualJP('')\n      setManualHonor('')",
  "setManualJP('')\n      setManualHonor('')\n      setManualRate('65000')"
);

// Add input in form UI
const rateHtml = `
                <div>
                  <label className="block text-sm font-medium mb-1">Honor per JP (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualRate} onChange={e => setManualRate(e.target.value)} />
                </div>
`;
code = code.replace(
  "<div>\n                  <label className=\"block text-sm font-medium mb-1\">Total Honor (Rp)</label>",
  rateHtml + "\n                <div>\n                  <label className=\"block text-sm font-medium mb-1\">Total Honor (Rp)</label>"
);

// We need to add the delete button to the table
// Let's import deleteRekapManual from rekap.ts
code = code.replace(
  "import { createRekapManual } from '@/app/actions/rekap'",
  "import { createRekapManual, deleteRekap } from '@/app/actions/rekap'"
);

// Let's add the handleDelete function
const deleteFn = `
  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus rekap ini?')) {
      try {
        await deleteRekap(id)
        router.refresh()
      } catch (e: any) {
        alert(e.message)
      }
    }
  }
`;
code = code.replace(
  "const handleManualSubmit = async (e: React.FormEvent) => {",
  deleteFn + "\n  const handleManualSubmit = async (e: React.FormEvent) => {"
);

// Add the delete button next to "Buat Invoice & Cetak"
const actionButtons = `
                      {rekap.status === 'SUBMITTED' && (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => openKopModal(rekap)}
                            disabled={loadingId === rekap.id}
                            className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            {loadingId === rekap.id ? 'Memproses...' : 'Buat Invoice & Cetak'}
                          </button>
                          <button 
                            onClick={() => handleDelete(rekap.id)}
                            className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
`;
code = code.replace(
  /\{rekap\.status === 'SUBMITTED' && \([\s\S]*?<\/button>\s*\)\}/,
  actionButtons
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Client page updated');
