const fs = require('fs');

const rekapPath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(rekapPath, 'utf8');

const newAction = `
export async function syncLaporanToRekap(rekapId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId }
  });

  if (!rekap) throw new Error("Rekap tidak ditemukan");

  const [y, m] = rekap.bulan.split('-');
  const startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
  const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);

  const updated = await prisma.laporanKegiatan.updateMany({
    where: {
      fasilitatorId: rekap.fasilitatorId,
      date: {
        gte: startDate,
        lte: endDate
      },
      rekapHonorariumId: null
    },
    data: {
      rekapHonorariumId: rekap.id
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal');
  revalidatePath('/portal/rekap');
  
  return updated.count;
}
`;

if (!content.includes('syncLaporanToRekap')) {
  content += newAction;
  fs.writeFileSync(rekapPath, content);
  console.log('Added syncLaporanToRekap');
}
