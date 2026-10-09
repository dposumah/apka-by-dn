const fs = require('fs');

const path = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Filter States
const statePattern = /const \[deletingId, setDeletingId\] = useState<string \| null>\(null\)/;
const stateReplacement = `const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterNama, setFilterNama] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
`;

if (!content.includes('filterNama')) {
  content = content.replace(statePattern, stateReplacement);
}

// 2. Add filtering logic before return statement
const returnPattern = /return \(\s*<div className="p-4 md:p-8">/;
const returnReplacement = `
  const filteredData = initialData.filter(lap => {
    const matchNama = lap.fasilitator?.namaLengkap?.toLowerCase().includes(filterNama.toLowerCase()) ?? true;
    let matchBulan = true;
    if (filterBulan) {
      const d = new Date(lap.date);
      matchBulan = (d.getMonth() + 1).toString() === filterBulan;
    }
    return matchNama && matchBulan;
  });

  return (
    <div className="p-4 md:p-8">`;

if (!content.includes('filteredData')) {
  content = content.replace(returnPattern, returnReplacement);
}

// 3. Add UI for Filters above the Card
const cardHeaderPattern = /<Card>\s*<CardHeader>\s*<CardTitle>Laporan Mingguan/;
const cardHeaderReplacement = `<div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Cari Nama Fasilitator</label>
          <input 
            type="text" 
            placeholder="Ketik nama..." 
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="text-sm font-medium mb-1 block">Filter Bulan</label>
          <select 
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Mingguan`;

if (!content.includes('Cari Nama Fasilitator')) {
  content = content.replace(cardHeaderPattern, cardHeaderReplacement);
}

// 4. Change `initialData.map` to `filteredData.map`
const mapPattern = /initialData\.map\(\(lap/g;
content = content.replace(mapPattern, "filteredData.map((lap");

const emptyPattern = /initialData\.length === 0/g;
content = content.replace(emptyPattern, "filteredData.length === 0");

fs.writeFileSync(path, content);
console.log('Added filters to Laporan Mingguan client page');
