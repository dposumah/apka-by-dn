const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Remove manualJenis state
c = c.replace(/const \[manualJenis, setManualJenis\] = useState\('INTRAKURIKULER'\)\n?/, '');

// 2. Remove manualJenis from useEffect dependency array
c = c.replace(/\[manualJenis, manualFasilId, manualSesi, fasilitators\]/, '[manualFasilId, manualSesi, fasilitators]');

// 3. Remove the dropdown HTML block
c = c.replace(/<div>\s*<label className="block text-sm font-medium mb-1">Jenis Pembelajaran<\/label>\s*<select className="w-full border rounded p-2" value=\{manualJenis\} onChange=\{e => setManualJenis\(e\.target\.value\)\}>\s*<option value="INTRAKURIKULER">Intrakurikuler<\/option>\s*<option value="EKSTRAKURIKULER">Ekstrakurikuler<\/option>\s*<\/select>\s*<\/div>/, '');

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', c);
console.log('Done removing manualJenis');
