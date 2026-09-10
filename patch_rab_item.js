const fs = require('fs');
const filePath = 'src/app/actions/rekap.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace("where: { name: { contains: 'Transport', mode: 'insensitive' } }", "where: { name: { contains: 'Bantuan Sewa Rumah Fasilitator', mode: 'insensitive' } }");

fs.writeFileSync(filePath, code);
console.log('Updated RabItem mapping for transport');
