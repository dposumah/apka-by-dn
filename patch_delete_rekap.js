const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const newAction = `
export async function deleteRekap(id: string) {
  const session = await getServerSession(authOptions);
  
  const rekap = await prisma.rekapHonorarium.findUnique({ where: { id } });
  if (!rekap) throw new Error('Rekap tidak ditemukan');

  // Unlink LaporanKegiatan if any
  await prisma.laporanKegiatan.updateMany({
    where: { rekapHonorariumId: id },
    data: { rekapHonorariumId: null }
  });

  // Delete ExpenseRequest if any
  await prisma.expenseRequest.deleteMany({
    where: { receiptUrl: rekap.filePdf } // the only way we linked them previously
  });

  await prisma.rekapHonorarium.delete({
    where: { id }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal/rekap');
}
`;

code = code + '\n' + newAction;
fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('deleteRekap action created');
