const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const startPattern = "export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {";

const startIndex = code.indexOf(startPattern);

// Find the end of the function using regex
const endRegex = /  return laporan;\r?\n\}/;
const endMatch = code.substring(startIndex).match(endRegex);

if (startIndex === -1 || !endMatch) {
  console.log("Could not find bounds");
  process.exit(1);
}

const endIndex = startIndex + endMatch.index + endMatch[0].length;

const newFunction = `export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const { error: authError, session } = await checkAuth();
  if (authError) throw new Error(authError);

  const fasil = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } });
  
  const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
  const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;

  const targetDate = new Date(data.date);
  const dayOfWeek = targetDate.getDay() || 7; 
  
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(targetDate);
  endOfWeek.setDate(targetDate.getDate() + (7 - dayOfWeek));
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
  
  const sameDayReports = weeklyReports.filter(lap => {
    const d = new Date(lap.date);
    return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
  });

  const hasTransportDaratToday = sameDayReports.some(lap => (lap.biayaTransport || 0) > 0);
  let finalReqTransportDarat = reqTransportDarat;
  if (hasTransportDaratToday) {
    finalReqTransportDarat = 0;
  }

  let grantedTransportDarat = Math.min(finalReqTransportDarat, remainingBudget);

  const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
  let grantedTransportLaut = parseFloat(data.biayaTransportLaut) || 0;
  if (hasTransportLautToday) {
    grantedTransportLaut = 0;
  }

  if (data.metodePelaksanaan === 'DARING') {
    grantedTransportDarat = 0;
    grantedTransportLaut = 0;
  }

  if (fasil?.lokasiSNT) {
    const { start, end } = getWeekRange(data.date);
    const weeklyLocationReports = await prisma.laporanKegiatan.findMany({
      where: {
        date: { gte: start, lte: end },
        fasilitator: { lokasiSNT: fasil.lokasiSNT }
      }
    });
    
    const totalIntraUsed = weeklyLocationReports.reduce((sum, lap) => sum + lap.jumlahJPIntra, 0);
    const totalEkstraUsed = weeklyLocationReports.reduce((sum, lap) => sum + lap.jumlahJPEkstra, 0);
    
    if (totalIntraUsed + reqJpIntra > 8) {
      throw new Error(\`Sisa kuota Intrakurikuler minggu ini di lokasi Anda hanya tinggal \${8 - totalIntraUsed} JP.\`);
    }
    if (totalEkstraUsed + reqJpEkstra > 4) {
      throw new Error(\`Sisa kuota Ekstrakurikuler minggu ini di lokasi Anda hanya tinggal \${4 - totalEkstraUsed} JP.\`);
    }
  }

  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      date: new Date(data.date),
      topic: data.topic,
      attendance: parseInt(data.attendance),
      evaluation: data.evaluation,
      tingkatSekolah: data.tingkatSekolah,
      metodePelaksanaan: data.metodePelaksanaan || 'LURING',
      jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: grantedTransportDarat,
      biayaTransportLaut: grantedTransportLaut,
      foto1: data.foto1 || null,
      fileLaporanFisik: data.fileLaporanFisik || null,
      foto2: data.foto2 || null,
      buktiTransportDarat: data.buktiTransportDarat || null,
      buktiTiketTransport: data.buktiTiketTransport || null,
      statusTransport: 'PENDING',
    }
  });

  try {
    const { getAdminNotificationEmailHtml } = require('@/lib/email-templates');
    const { sendEmail } = require('@/lib/email');
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { email: true }
    });
    const adminEmails = admins.map(a => a.email).filter(Boolean);

    if (adminEmails.length > 0) {
      const dateStr = new Date(laporan.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const hasTransport = (laporan.biayaTransport > 0) || ((laporan.biayaTransportLaut || 0) > 0);
      const transportTotal = (laporan.biayaTransport || 0) + (laporan.biayaTransportLaut || 0);

      for (const email of adminEmails) {
        await sendEmail({
          to: email as string,
          subject: '🚨 Laporan Baru: ' + fasil?.namaLengkap,
          html: getAdminNotificationEmailHtml(fasil?.namaLengkap || 'Fasilitator', dateStr, laporan.topic, hasTransport, transportTotal)
        });
      }
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }

  revalidatePath('/portal');
  revalidatePath('/dashboard-rab');
  return laporan;
}`;

const finalCode = code.substring(0, startIndex) + newFunction + code.substring(endIndex);
fs.writeFileSync('src/app/actions/rab.ts', finalCode);
console.log('Successfully patched rab.ts');
