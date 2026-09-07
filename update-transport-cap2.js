const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const target = `  const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
  const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;

  if (fasil?.lokasiSNT) {
    const { start, end } = getWeekRange(data.date)
    
    // Get all reports in the same week for this location
    const weeklyReports = await prisma.laporanKegiatan.findMany({
      where: {
        date: { gte: start, lte: end },
        fasilitator: { lokasiSNT: fasil.lokasiSNT }
      }
    })
    
    const totalIntraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPIntra, 0)
    const totalEkstraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPEkstra, 0)
    
    if (totalIntraUsed + reqJpIntra > 8) {
      throw new Error(\`Sisa kuota Intrakurikuler minggu ini di lokasi Anda hanya tinggal \${8 - totalIntraUsed} JP.\`)
    }
    if (totalEkstraUsed + reqJpEkstra > 4) {
      throw new Error(\`Sisa kuota Ekstrakurikuler minggu ini di lokasi Anda hanya tinggal \${4 - totalEkstraUsed} JP.\`)
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
      jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: besaranTransportDarat,`

const replacement = `  const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
  const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;

  const { start, end } = getWeekRange(data.date)

  // Transport Darat Quota per Fasilitator per Week
  const myWeeklyReports = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      date: { gte: start, lte: end }
    }
  });
  const totalTransportDaratUsed = myWeeklyReports.reduce((sum, lap) => sum + lap.biayaTransport, 0);
  const maxTransportPerminggu = fasil?.besaranTransport ?? 120000;
  const grantedTransportDarat = Math.max(0, Math.min(maxTransportPerminggu, maxTransportPerminggu - totalTransportDaratUsed));

  if (fasil?.lokasiSNT) {
    // Get all reports in the same week for this location
    const weeklyReports = await prisma.laporanKegiatan.findMany({
      where: {
        date: { gte: start, lte: end },
        fasilitator: { lokasiSNT: fasil.lokasiSNT }
      }
    })
    
    const totalIntraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPIntra, 0)
    const totalEkstraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPEkstra, 0)
    
    if (totalIntraUsed + reqJpIntra > 8) {
      throw new Error(\`Sisa kuota Intrakurikuler minggu ini di lokasi Anda hanya tinggal \${8 - totalIntraUsed} JP.\`)
    }
    if (totalEkstraUsed + reqJpEkstra > 4) {
      throw new Error(\`Sisa kuota Ekstrakurikuler minggu ini di lokasi Anda hanya tinggal \${4 - totalEkstraUsed} JP.\`)
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
      jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: grantedTransportDarat,`

if (!code.includes(target)) {
  console.log("Target not found!");
} else {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/actions/rab.ts', code);
  console.log("Success!");
}
