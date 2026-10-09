const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/rekap-honor/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add sort state
const sortState = `  const [sortField, setSortField] = useState<'nama' | 'lokasi' | 'bulan' | 'tanggal'>('tanggal')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: 'nama' | 'lokasi' | 'bulan' | 'tanggal') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedData = [...initialData].sort((a, b) => {
    let comparison = 0
    if (sortField === 'nama') {
      comparison = (a.fasilitator.namaLengkap || '').localeCompare(b.fasilitator.namaLengkap || '')
    } else if (sortField === 'lokasi') {
      comparison = (a.fasilitator.lokasiSNT || '').localeCompare(b.fasilitator.lokasiSNT || '')
    } else if (sortField === 'bulan') {
      comparison = (a.bulan || '').localeCompare(b.bulan || '')
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
`;

// Insert sort state before useEffect
if (!content.includes('const [sortField')) {
  content = content.replace('useEffect(() => {', sortState + '\n  useEffect(() => {');
}

// 2. Add sort UI arrows and make headers clickable
content = content.replace(
  '<th className="py-3 px-4 font-semibold text-slate-700">Fasilitator</th>',
  '<th className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("nama")}>Fasilitator {sortField==="nama" ? (sortOrder==="asc"?"↑":"↓") : ""}</th>'
);
// We can also add a column or just sort by location. Let's add location next to name, so the header will just be Fasilitator & Lokasi
content = content.replace(
  '<th className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("nama")}>Fasilitator {sortField==="nama" ? (sortOrder==="asc"?"↑":"↓") : ""}</th>',
  '<th className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("nama")}>Fasilitator & Lokasi {sortField==="nama" ? (sortOrder==="asc"?"↑":"↓") : ""}</th>'
);

content = content.replace(
  '<th className="py-3 px-4">Bulan</th>',
  '<th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("bulan")}>Bulan {sortField==="bulan" ? (sortOrder==="asc"?"↑":"↓") : ""}</th>'
);

// 3. Render lokasiSNT in the row
content = content.replace(
  '<td className="py-3 px-4 font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</td>',
  `<td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</div>
                        <div className="text-xs text-slate-500 uppercase">{rekap.fasilitator.lokasiSNT || '-'}</div>
                      </td>`
);

// 4. Change map to use sortedData
content = content.replace(
  '{initialData.map((rekap) => (',
  '{sortedData.map((rekap) => ('
);


fs.writeFileSync(path, content);
console.log('Added sorting and location');
