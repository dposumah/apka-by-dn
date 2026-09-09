const fs = require('fs');
const filePath = 'prisma/schema.prisma';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/foto1 String\?/, 'foto1 String?\n  fileLaporanFisik String?');

fs.writeFileSync(filePath, code);
