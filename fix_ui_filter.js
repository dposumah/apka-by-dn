const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetPattern = /<\/div>\s*<Card>\s*<CardContent className="p-0">/;
const replacement = `</div>
      <div className="flex flex-col md:flex-row gap-4 mb-2">
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
        <CardContent className="p-0">`;

if (!content.includes('Cari Nama Fasilitator')) {
  content = content.replace(targetPattern, replacement);
  fs.writeFileSync(path, content);
  console.log('Filters injected successfully');
} else {
  console.log('Filters already exist!');
}
