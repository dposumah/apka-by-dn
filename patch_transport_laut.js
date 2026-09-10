const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

const target1 = `  const hasTransportToday = sameDayReports.some(lap => lap.biayaTransport > 0);
  
  let grantedTransportDarat = 0;
  if (!hasTransportToday) {
    grantedTransportDarat = fasil?.besaranTransport ?? 120000;
  }
  
  if (data.metodePelaksanaan === 'DARING') {
    grantedTransportDarat = 0;
  }`;

const replacement1 = `  const hasTransportToday = sameDayReports.some(lap => lap.biayaTransport > 0);
  const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
  
  let grantedTransportDarat = 0;
  if (!hasTransportToday) {
    grantedTransportDarat = fasil?.besaranTransport ?? 120000;
  }

  let grantedTransportLaut = data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0;
  if (hasTransportLautToday) {
    grantedTransportLaut = 0;
  }
  
  if (data.metodePelaksanaan === 'DARING') {
    grantedTransportDarat = 0;
    grantedTransportLaut = 0;
  }`;

code = code.replace(target1, replacement1);

const target2 = `biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,`;
const replacement2 = `biayaTransportLaut: grantedTransportLaut,`;

code = code.replace(target2, replacement2);

fs.writeFileSync(filePath, code);
console.log('Patched rab.ts for Transport Laut limit');
