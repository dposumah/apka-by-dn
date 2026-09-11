const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/transport/client-page.tsx', 'utf8');

const replacement = `
                <td className="px-4 py-3">{lap.topic}</td>
                <td className="px-4 py-3 text-right">
                  <div className="font-semibold text-blue-700">Rp {((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</div>
                  <div className="flex flex-col items-end gap-1 mt-1 text-xs">
                    {lap.buktiTransportDarat && <a href={lap.buktiTransportDarat} target="_blank" className="text-blue-600 hover:underline">Bukti Darat</a>}
                    {lap.buktiTiketTransport && <a href={lap.buktiTiketTransport} target="_blank" className="text-emerald-600 hover:underline">Bukti Laut</a>}
                  </div>
                </td>
`;

code = code.replace(
  /<td className="px-4 py-3">\{lap\.topic\}<\/td>\s*<td className="px-4 py-3 text-right font-semibold text-blue-700">Rp \{\(\(lap\.biayaTransport \|\| 0\) \+ \(lap\.biayaTransportLaut \|\| 0\)\)\.toLocaleString\('id-ID'\)\}<\/td>/,
  replacement.trim()
);

fs.writeFileSync('src/app/(snt)/fasilitator/transport/client-page.tsx', code);
console.log('Patched transport client page to show proofs');
