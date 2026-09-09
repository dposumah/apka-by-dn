const fs = require('fs');
const filePath = 'src/app/(snt)/portal/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/\{lap\.attendance\} Peserta<\/p>/, "{lap.attendance} Peserta &bull; {lap.metodePelaksanaan}</p>");
code = code.replace(/\{lap\.tingkatSekolah\} - Intra/, "{lap.tingkatSekolah} {lap.metodePelaksanaan} - Intra");

fs.writeFileSync(filePath, code);
