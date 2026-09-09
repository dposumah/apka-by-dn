const fs = require('fs');
const filePath = 'src/app/(snt)/fasilitator/laporan/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/<td>\$\{lap\.tingkatSekolah\}<\/td>/, "<td>${lap.tingkatSekolah} <br/><small>${lap.metodePelaksanaan}</small></td>");
code = code.replace(/<td className="py-3 px-4 text-center">\{lap\.tingkatSekolah\}<\/td>/, '<td className="py-3 px-4 text-center">{lap.tingkatSekolah} <div className="text-xs text-slate-500">{lap.metodePelaksanaan}</div></td>');

fs.writeFileSync(filePath, code);
