const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const targetCreate = `export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const session = await getServerSession(authOptions);
  
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
      biayaTransport: data.biayaTransport ? parseFloat(data.biayaTransport) : 0,`

const replacementCreate = `export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
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
      biayaTransportLaut: data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0,`

code = code.replace(targetCreate, replacementCreate)

fs.writeFileSync('src/app/actions/rab.ts', code)
