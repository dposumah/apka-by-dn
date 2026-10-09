const fs = require('fs');

const path = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('adminUpdateTransportAmount')) {
  content = content.replace(
    /import { cancelTransportPaid } from '@\/app\/actions\/rekap'/,
    "import { cancelTransportPaid, adminUpdateTransportAmount } from '@/app/actions/rekap'"
  );
}

// 2. Add state
const statePattern = /const \[cancelingId, setCancelingId\] = useState<string \| null>\(null\)/;
const stateReplacement = `const [cancelingId, setCancelingId] = useState<string | null>(null)
  
  const [editingTransport, setEditingTransport] = useState<any | null>(null);
  const [editDarat, setEditDarat] = useState(0);
  const [editLaut, setEditLaut] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTransport = async () => {
    if (!editingTransport) return;
    setIsSaving(true);
    try {
      await adminUpdateTransportAmount(editingTransport.id, editDarat, editLaut);
      alert('Success', 'Biaya transport berhasil diperbarui.');
      setEditingTransport(null);
      router.refresh();
    } catch (e: any) {
      alert('Error', e.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };
`;
if (!content.includes('setEditingTransport')) {
  content = content.replace(statePattern, stateReplacement);
}

// 3. Add button
const buttonPattern = /Cetak Invoice Transport\s*<\/button>\s*\)\}/;
const buttonReplacement = `Cetak Invoice Transport
                          </button>
                        )}
                        {((lap.biayaTransport || 0) > 0 || (lap.reqBiayaTransport || 0) > 0) && lap.statusTransport === 'PENDING' && (
                          <button 
                            onClick={() => {
                              setEditingTransport(lap);
                              setEditDarat(lap.biayaTransport || 0);
                              setEditLaut(lap.biayaTransportLaut || 0);
                            }}
                            className="w-full text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap mt-1"
                          >
                            ✏️ Edit Transport
                          </button>
                        )}`;
if (!content.includes('Edit Transport')) {
  content = content.replace(buttonPattern, buttonReplacement);
}

// 4. Add modal at the end before closing div
const modalPattern = /<\/div>\s*<\/CardContent>\s*<\/Card>\s*<\/div>\s*\)\s*\}/;
const modalReplacement = `</div>
        </CardContent>
      </Card>

      {editingTransport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit Nominal Transport</h3>
            <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
              <p><strong>Fasilitator:</strong> {editingTransport.fasilitator?.namaLengkap}</p>
              <p><strong>Tanggal:</strong> {new Date(editingTransport.date).toLocaleDateString('id-ID')}</p>
              <p><strong>Req Awal Darat:</strong> {formatCurrency(editingTransport.reqBiayaTransport || 0)}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Biaya Transport Darat (Disetujui)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                  <input 
                    type="number" 
                    value={editDarat} 
                    onChange={e => setEditDarat(Number(e.target.value))}
                    className="w-full border rounded-lg pl-8 pr-2 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Biaya Transport Laut (Disetujui)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                  <input 
                    type="number" 
                    value={editLaut} 
                    onChange={e => setEditLaut(Number(e.target.value))}
                    className="w-full border rounded-lg pl-8 pr-2 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => setEditingTransport(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveTransport}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}`;
if (!content.includes('fixed inset-0')) {
  content = content.replace(modalPattern, modalReplacement);
}

fs.writeFileSync(path, content);
console.log('Added edit transport UI to client-page');
