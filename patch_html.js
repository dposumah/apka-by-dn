const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

const regex = /<div class="form-group">\s*<div class="form-label">Jumlah sesi \/ JP<\/div>\s*<div class="form-colon">:<\/div>\s*<div class="form-value-underline">\$\{rekap.jumlahSesi \|\| 4\} \(pertemuan dalam 1 bulan\) \/ \$\{rekap.totalJP\} JP<\/div>\s*<\/div>\s*<div class="form-value-underline">Rp \$\{\(rateHonor\).toLocaleString\('id-ID'\)\}<\/div>\s*<\/div>/g;

const replaceWith = `<div class="form-group">
                <div class="form-label">Jumlah sesi / JP</div>
                <div class="form-colon">:</div>
                <div class="form-value-underline">\${rekap.jumlahSesi || 4} (pertemuan dalam 1 bulan) / \${rekap.totalJP} JP</div>
              </div>`;

code = code.replace(regex, replaceWith);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Fixed HTML layout using regex');
