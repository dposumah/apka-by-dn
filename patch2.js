const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

// I will use regex to be safe about line endings
const targetRegex = /const hasTransportToday = sameDayReports\.some\(lap => lap\.biayaTransport > 0\);\s+let grantedTransportDarat = 0;\s+if \(!hasTransportToday\) {\s+grantedTransportDarat = fasil\?\.besaranTransport \?\? 120000;\s+}\s+if \(data\.metodePelaksanaan === 'DARING'\) {\s+grantedTransportDarat = 0;\s+}/g;

const replacement = `const hasTransportToday = sameDayReports.some(lap => lap.biayaTransport > 0);
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

if(targetRegex.test(code)){
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync(filePath, code);
  console.log('Patched correctly');
} else {
  console.log('Regex did not match');
}
