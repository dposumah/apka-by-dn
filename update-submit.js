const fs = require('fs')

let content = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const regex = /export async function submitLaporanKegiatan\(fasilitatorId: string, data: any\) \{[\s\S]*?return laporan;\n}/;

const newFunc = `export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
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
      biayaTransport: data.biayaTransport ? parseFloat(data.biayaTransport) : 0,
      foto1: data.foto1 || null,
      foto2: data.foto2 || null,
      statusTransport: 'PENDING',
    }
  });

  revalidatePath('/portal');
  revalidatePath('/dashboard-rab');
  return laporan;
}`

content = content.replace(regex, newFunc)
fs.writeFileSync('src/app/actions/rab.ts', content)
