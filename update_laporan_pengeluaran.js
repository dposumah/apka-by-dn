const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

if (!page.includes('updateExpense')) {
  page = page.replace(
    /import \{ Badge \} from '@\/components\/ui\/badge'/,
    "import { Badge } from '@/components/ui/badge'\nimport { updateExpense } from '@/app/actions/rab'"
  );
}

const editState = `
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const openEditModal = (expense: any) => {
    setEditData({
      id: expense.id,
      date: expense.date ? new Date(expense.date).toISOString().substring(0,10) : new Date(expense.createdAt).toISOString().substring(0,10),
      description: expense.description,
      amount: expense.amount,
      rabItemId: expense.rabItemId
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: parseFloat(editData.amount),
        rabItemId: editData.rabItemId
      });
      if (res.error) throw new Error(res.error);
      setShowEditModal(false);
      window.location.reload();
    } catch (err) {
      alert("Gagal mengedit: " + err);
    } finally {
      setIsSaving(false);
    }
  }
`;

if (!page.includes('showEditModal')) {
  page = page.replace(
    /const \[endDate, setEndDate\] = useState\(searchParams.get\('endDate'\) \|\| ''\)/,
    `const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')\n${editState}`
  );
}

// Add Aksi column
page = page.replace(
  /<th className="py-3 px-4 text-center print:hidden">Bukti<\/th>/,
  '<th className="py-3 px-4 text-center print:hidden">Bukti</th>\n                    <th className="py-3 px-4 text-center print:hidden">Aksi</th>'
);

page = page.replace(
  /<\/td>\s*<\/tr>\s*\)\)\s*\)\}/,
  `</td>
                        <td className="py-2 px-4 text-center print:hidden">
                          <button onClick={() => openEditModal(exp)} className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}`
);

page = page.replace(
  /<td className="print:hidden"><\/td>/,
  '<td className="print:hidden"></td>\n                      <td className="print:hidden"></td>'
);

const editModal = `
        {showEditModal && editData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
              <h3 className="text-lg font-bold mb-4">Edit Pengeluaran</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    value={editData.date}
                    onChange={e => setEditData({...editData, date: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deskripsi</label>
                  <textarea 
                    value={editData.description}
                    onChange={e => setEditData({...editData, description: e.target.value})}
                    className="w-full border rounded px-3 py-2 h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nominal</label>
                  <input 
                    type="number" 
                    value={editData.amount}
                    onChange={e => setEditData({...editData, amount: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pilih Item RAB</label>
                  <select 
                    value={editData.rabItemId}
                    onChange={e => setEditData({...editData, rabItemId: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {rabData?.categories?.flatMap((cat: any) => 
                      cat.items.map((item: any) => (
                        <option key={item.id} value={item.id}>{cat.name} - {item.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded hover:bg-slate-50"
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
`;

if (!page.includes('showEditModal && editData')) {
  page = page.replace(
    /<\/div>\s*<\/div>\s*\)\s*\}\s*$/,
    `</div>\n${editModal}\n    </div>\n  )\n}`
  );
}

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed laporan-pengeluaran client page');
