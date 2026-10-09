const fs = require('fs');
const path = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let content = fs.readFileSync(path, 'utf8');

const returnPattern = /return \(\s*<div className="p-8 space-y-6 max-w-7xl mx-auto">/;
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">`;

content = content.replace(returnPattern, returnReplacement);
fs.writeFileSync(path, content);
console.log('Fixed filteredData definition');
