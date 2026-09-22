const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add manualSesi to state
code = code.replace(
  "const [manualRate, setManualRate] = useState('65000')",
  "const [manualRate, setManualRate] = useState('65000')\n  const [manualSesi, setManualSesi] = useState('4')"
);

// 2. Pass to action
code = code.replace(
  "createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0)",
  "createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0, parseInt(manualSesi) || 4)"
);

// 3. Reset state
code = code.replace(
  "setManualRate('65000')",
  "setManualRate('65000')\n      setManualSesi('4')"
);

// 4. Add UI field
const htmlToFind = "<div>\n                    <label className=\"block text-sm font-medium mb-1\">Jumlah JP</label>";
const newHtml = `<div>
                    <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>
                    <input type="number" min="0" required className="w-full border rounded p-2" value={manualSesi} onChange={e => setManualSesi(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Jumlah JP</label>`;
code = code.replace(htmlToFind, newHtml);

// 5. Change the grid from grid-cols-2 to grid-cols-3 so it looks good (or keep it as is? Currently it's grid-cols-2)
code = code.replace(
  '<div className="grid grid-cols-2 gap-4">\n                  <div>\n                    <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>',
  '<div className="grid grid-cols-3 gap-4">\n                  <div>\n                    <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>'
);
// Wait, the grid containing "Jumlah JP" and "Honor per JP" and "Total Honor" originally had 2 columns? I added 1. Now it's 3! Let's check original.
code = code.replace(
  '<div className="grid grid-cols-2 gap-4">\n                  <div>\n                    <label className="block text-sm font-medium mb-1">Jumlah JP</label>',
  '<div className="grid grid-cols-3 gap-4">\n                  <div>\n                    <label className="block text-sm font-medium mb-1">Jumlah JP</label>'
); // fallback if my previous replace failed

// 6. Update cetakKwitansiMaleo template to show the new format!
code = code.replace(
  '<div class="form-value-underline">${rekap.totalJP} JP</div>',
  '<div class="form-value-underline">${rekap.jumlahSesi || 4} (pertemuan dalam 1 bulan) / ${rekap.totalJP} JP</div>'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Client page updated for Sesi');
