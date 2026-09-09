const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/foto1: data\.foto1 \|\| null,/, 'foto1: data.foto1 || null,\n      fileLaporanFisik: data.fileLaporanFisik || null,');

fs.writeFileSync(filePath, code);
