const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const regex = /const startOfDay = new Date\(new Date\(data\.date\)\.setHours\(0, 0, 0, 0\)\);[\s\S]*?if \(hasTransportLautToday\) \{\s*grantedTransportLaut = 0;\s*\}/;

const newLogic = `
    const currDate = new Date(data.date);
    const dayOfWeek = currDate.getDay() || 7; // 1(Mon) to 7(Sun)
    
    const startOfWeek = new Date(currDate);
    startOfWeek.setDate(currDate.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(currDate);
    endOfWeek.setDate(currDate.getDate() + (7 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyReports = await prisma.laporanKegiatan.findMany({
      where: {
        fasilitatorId,
        date: { gte: startOfWeek, lte: endOfWeek }
      }
    });

    const claimedThisWeek = weeklyReports.reduce((sum, lap) => sum + (lap.biayaTransport || 0), 0);
    const maxBudget = fasil?.besaranTransport ?? 120000;
    const remainingBudget = Math.max(0, maxBudget - claimedThisWeek);

    const reqTransportDarat = parseFloat(data.biayaTransport) || 0;
    let grantedTransportDarat = Math.min(reqTransportDarat, remainingBudget);

    // Transport Laut (Max 1 per day)
    const sameDayReports = weeklyReports.filter(lap => {
      const d = new Date(lap.date);
      return d.getFullYear() === currDate.getFullYear() && d.getMonth() === currDate.getMonth() && d.getDate() === currDate.getDate();
    });

    const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
    let grantedTransportLaut = parseFloat(data.biayaTransportLaut) || 0;
    if (hasTransportLautToday) {
      grantedTransportLaut = 0;
    }
`;

code = code.replace(regex, newLogic.trim());

// Add buktiTransportDarat to prisma.create
code = code.replace(
  /buktiTiketTransport:\s*data\.buktiTiketTransport\s*\|\|\s*null,/,
  "buktiTransportDarat: data.buktiTransportDarat || null,\n        buktiTiketTransport: data.buktiTiketTransport || null,"
);

fs.writeFileSync('src/app/actions/rab.ts', code);
console.log('Patched rab.ts successfully');
