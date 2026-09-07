const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const oldCode = `    const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
    const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;
  
    if (fasil?.lokasiSNT) {
      const { start, end } = getWeekRange(data.date)
      
      // Get all reports in the same week for this location
      const weeklyReports = await prisma.laporanKegiatan.findMany({
        where: {
          date: { gte: start, lte: end },
          fasilitator: { lokasiSNT: fasil.lokasiSNT }
        }
      })`

const newCode = `    const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
    const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;
  
    const { start, end } = getWeekRange(data.date);
    
    // Calculate Transport Darat Cap (Max per week per fasilitator)
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
      // Get all reports in the same week for this location to check JP Quota
      const weeklyReports = await prisma.laporanKegiatan.findMany({
        where: {
          date: { gte: start, lte: end },
          fasilitator: { lokasiSNT: fasil.lokasiSNT }
        }
      })`

code = code.replace(oldCode, newCode)

const oldCode2 = `        tingkatSekolah: data.tingkatSekolah,
        jumlahJPIntra: reqJpIntra,
        jumlahJPEkstra: reqJpEkstra,
        biayaTransport: besaranTransportDarat,
        biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,`

const newCode2 = `        tingkatSekolah: data.tingkatSekolah,
        jumlahJPIntra: reqJpIntra,
        jumlahJPEkstra: reqJpEkstra,
        biayaTransport: grantedTransportDarat,
        biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,`

code = code.replace(oldCode2, newCode2)

fs.writeFileSync('src/app/actions/rab.ts', code)
