const fs = require('fs');
const filePath = 'src/app/(snt)/portal/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\{lap\.materialLink && \([\s\S]*?<\/a>\s*\)\}/;
const replacement = `{lap.materialLink && (
                        <a href={lap.materialLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block mr-3">
                          Materi Pembelajaran
                        </a>
                      )}
                      {lap.fileLaporanFisik && (
                        <a href={lap.fileLaporanFisik} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block mr-3">
                          Laporan Fisik
                        </a>
                      )}
                      {lap.foto1 && (
                        <a href={lap.foto1} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block mr-3">
                          Foto 1
                        </a>
                      )}
                      {lap.foto2 && (
                        <a href={lap.foto2} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                          Foto 2
                        </a>
                      )}`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code);
