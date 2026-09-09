const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/ Transport Darat Quota per Fasilitator per Week[\s\S]*?if \(data\.metodePelaksanaan === 'DARING'\) \{/m;

const replacement = `// Cek apakah sudah ada laporan di hari yang sama
  const targetDate = new Date(data.date);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
  
  const sameDayReports = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      date: { gte: startOfDay, lte: endOfDay }
    }
  });
  
  const hasTransportToday = sameDayReports.some(lap => lap.biayaTransport > 0);
  
  let grantedTransportDarat = 0;
  if (!hasTransportToday) {
    grantedTransportDarat = fasil?.besaranTransport ?? 120000;
  }
  
  if (data.metodePelaksanaan === 'DARING') {`;

code = code.replace(regex, replacement);
fs.writeFileSync(filePath, code);
