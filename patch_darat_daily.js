const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const replacement = `
    const reqTransportDarat = parseFloat(data.biayaTransport) || 0;
    
    // Get same day reports
    const sameDayReports = weeklyReports.filter(lap => {
      const d = new Date(lap.date);
      return d.getFullYear() === currDate.getFullYear() && d.getMonth() === currDate.getMonth() && d.getDate() === currDate.getDate();
    });

    const hasTransportDaratToday = sameDayReports.some(lap => (lap.biayaTransport || 0) > 0);
    let finalReqTransportDarat = reqTransportDarat;
    if (hasTransportDaratToday) {
      finalReqTransportDarat = 0; // Hanya boleh 1x sehari
    }

    let grantedTransportDarat = Math.min(finalReqTransportDarat, remainingBudget);

    // Transport Laut (Max 1 per day)
    const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
    let grantedTransportLaut = parseFloat(data.biayaTransportLaut) || 0;
    if (hasTransportLautToday) {
      grantedTransportLaut = 0;
    }
`;

code = code.replace(
  /const reqTransportDarat = parseFloat\(data\.biayaTransport\) \|\| 0;\s*let grantedTransportDarat = Math\.min\(reqTransportDarat, remainingBudget\);\s*\/\/ Transport Laut \(Max 1 per day\)\s*const sameDayReports = weeklyReports\.filter[\s\S]*?grantedTransportLaut = 0;\s*\}/,
  replacement.trim()
);

fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Patched rab.ts for darat daily limit');
