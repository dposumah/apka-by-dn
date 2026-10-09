const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/target-jp/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  "import { getRekapTargetJp } from '@/app/actions/rekap'",
  "import { getRekapTargetJp, updateTargetJpFasilitator } from '@/app/actions/rekap'"
);

// Add editing state and functions
const stateInjection = `const [data, setData] = useState<any[]>(initialData)
  const [bulan, setBulan] = useState(defaultMonth)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTargetBulan, setEditTargetBulan] = useState(32)
  const [editTargetTotal, setEditTargetTotal] = useState(128)
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (row: any) => {
    setEditingId(row.fasilitator.id)
    setEditTargetBulan(row.targetBulan)
    setEditTargetTotal(row.targetTotal)
  }

  const handleSave = async (id: string) => {
    setIsSaving(true)
    try {
      await updateTargetJpFasilitator(id, editTargetBulan, editTargetTotal)
      setEditingId(null)
      // refresh data
      const res = await getRekapTargetJp(bulan)
      setData(res)
    } catch(e) {
      alert("Gagal menyimpan target")
    } finally {
      setIsSaving(false)
    }
  }
`;
content = content.replace(/const \[data, setData\] = useState<any\[\]>\(initialData\)\s*const \[bulan, setBulan\] = useState\(defaultMonth\)\s*const \[isLoading, setIsLoading\] = useState\(false\)/, stateInjection);

// Add Aksi column header
content = content.replace(
  '<th className="py-2 px-4 text-center font-semibold text-slate-700 border-b border-l bg-amber-50/50" colSpan={4}>Total Keseluruhan (S.d 31 Des)</th>',
  '<th className="py-2 px-4 text-center font-semibold text-slate-700 border-b border-l bg-amber-50/50" colSpan={4}>Total Keseluruhan (S.d 31 Des)</th>\n                  <th className="py-3 px-4 font-semibold text-slate-700 border-l" rowSpan={2}>Aksi</th>'
);

// Modify row
const rowRegex = /<td className="py-3 px-4 text-center border-l">\{row\.targetBulan\} JP<\/td>([\s\S]*?)<td className="py-3 px-4 text-center border-l">\{row\.targetTotal\} JP<\/td>([\s\S]*?)<\/Badge>\s*<\/td>\s*<\/tr>/;
content = content.replace(rowRegex, (match, p1, p2) => {
  return `<td className="py-3 px-4 text-center border-l">{editingId === row.fasilitator.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editTargetBulan} onChange={e=>setEditTargetBulan(parseInt(e.target.value)||0)} /> : \`\${row.targetBulan} JP\`}</td>${p1}<td className="py-3 px-4 text-center border-l">{editingId === row.fasilitator.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editTargetTotal} onChange={e=>setEditTargetTotal(parseInt(e.target.value)||0)} /> : \`\${row.targetTotal} JP\`}</td>${p2}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center border-l">
                      {editingId === row.fasilitator.id ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleSave(row.fasilitator.id)} disabled={isSaving} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="text-xs bg-slate-200 px-2 py-1 rounded">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(row)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border">Edit Target</button>
                      )}
                    </td>
                  </tr>`
});

fs.writeFileSync(path, content);
console.log('Added Edit Target UI');
