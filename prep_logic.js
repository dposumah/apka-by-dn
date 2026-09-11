const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

// The replacement strategy: We will completely rewrite the transport logic part.
const oldLogicRegex = /const sameDayReports = await prisma\.laporanKegiatan\.findMany\(\{[\s\S]*?grantedTransportLaut = 0;\s*\}/;

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

    // Filter weeklyReports to get same day reports for Transport Laut check
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

code = code.replace(oldLogicRegex, newLogic);

// Wait, I also need to make sure buktiTransportDarat is saved!
code = code.replace(
  /buktiTiketTransport:\s*data\.buktiTiketTransport\s*\|\|\s*null,/,
  "buktiTransportDarat: data.buktiTransportDarat || null,\n        buktiTiketTransport: data.buktiTiketTransport || null,"
);

// Remove the `if (!hasTransportToday) { grantedTransportDarat = ... }` which might be dangling if my regex missed it
// Let's just use string replacement on the exact block.
