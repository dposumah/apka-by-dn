const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\{lap\.foto1 && <a href=\{lap\.foto1\} target="_blank" className="text-blue-600 hover:underline">Foto 1<\/a>\}/;
const replacement = `{lap.fileLaporanFisik && <a href={lap.fileLaporanFisik} target="_blank" className="text-purple-600 font-medium hover:underline">Lap. Fisik</a>}
                          {lap.foto1 && <a href={lap.foto1} target="_blank" className="text-blue-600 hover:underline">Foto 1</a>}`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code);
