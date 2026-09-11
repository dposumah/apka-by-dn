const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8');

// The line is:
// {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 font-bold hover:underline">Tiket</a>}
const newHtml = `
                        {lap.buktiTransportDarat && <a href={lap.buktiTransportDarat} target="_blank" className="text-blue-600 font-bold hover:underline mr-2">Bukti Darat</a>}
                        {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 font-bold hover:underline">Bukti Laut</a>}
`;
code = code.replace(
  /\{lap\.buktiTiketTransport\s*&&\s*<a[^>]+>Tiket<\/a>\}/,
  newHtml.trim()
);

fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code);
console.log('Patched fasilitator/laporan/client-page.tsx');
