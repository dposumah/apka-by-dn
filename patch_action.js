const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newAction = `
export async function uploadLaporanFisik(laporanId: string, fileUrl: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  })
  if (!lap) throw new Error('Not found')

  await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: { fileLaporanFisik: fileUrl }
  })

  revalidatePath('/portal', 'layout')
  revalidatePath('/dashboard-rab', 'layout')
  revalidatePath('/fasilitator', 'layout')
  return { success: true }
}
`;

if (!code.includes('uploadLaporanFisik')) {
  code += newAction;
  fs.writeFileSync(filePath, code);
  console.log('Added uploadLaporanFisik action');
}
