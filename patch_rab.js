const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /const grantedTransportDarat = Math\.max\(0, Math\.min\(maxTransportPerminggu, maxTransportPerminggu - totalTransportDaratUsed\)\);/;
const replaceStr = `let grantedTransportDarat = Math.max(0, Math.min(maxTransportPerminggu, maxTransportPerminggu - totalTransportDaratUsed));
  
  if (data.metodePelaksanaan === 'DARING') {
    grantedTransportDarat = 0;
  }`;

code = code.replace(regex, replaceStr);

// Also save it to the db model
code = code.replace(/tingkatSekolah:\s*data\.tingkatSekolah,/, "tingkatSekolah: data.tingkatSekolah,\n        metodePelaksanaan: data.metodePelaksanaan || 'LURING',");

fs.writeFileSync(filePath, code);
