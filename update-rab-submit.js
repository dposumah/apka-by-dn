const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const oldSubmit = `export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const session = await getServerSession(authOptions);
  
  const fasil = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } });
  const besaranTransportDarat = fasil?.besaranTransport ?? 120000;
  
  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      date: new Date(data.date),
      topic: data.topic,
      attendance: parseInt(data.attendance),
      evaluation: data.evaluation,
      tingkatSekolah: data.tingkatSekolah,
      jenisKegiatan: data.jenisKegiatan,
      jumlahJP: parseInt(data.jumlahJP) || 0,
      biayaTransport: besaranTransportDarat,
      biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,
      foto1: data.foto1 || null,
      foto2: data.foto2 || null,
      buktiTiketTransport: data.buktiTiketTransport || null,
      statusTransport: 'PENDING',
    }
  });`

const newSubmit = `function getWeekRange(dateString: string) {
  const d = new Date(dateString)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const start = new Date(d.setDate(diff))
  start.setHours(0,0,0,0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23,59,59,999)
  return { start, end }
}

export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const session = await getServerSession(authOptions);
  
  const fasil = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } });
  const besaranTransportDarat = fasil?.besaranTransport ?? 120000;
  
  const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
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
      biayaTransport: besaranTransportDarat,
      biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,
      foto1: data.foto1 || null,
      foto2: data.foto2 || null,
      buktiTiketTransport: data.buktiTiketTransport || null,
      statusTransport: 'PENDING',
    }
  });`

code = code.replace(oldSubmit, newSubmit)
fs.writeFileSync('src/app/actions/rab.ts', code)
