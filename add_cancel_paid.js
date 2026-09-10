const fs = require('fs');
const filePath = 'src/app/actions/rekap.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newAction = `
export async function cancelTransportPaid(laporanId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized');

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  });

  if (!lap) throw new Error('Laporan tidak ditemukan');

  if (lap.statusTransport === 'PAID') {
    // Attempt to delete associated expense request if any
    if (lap.buktiTransferTransport) {
      await prisma.expenseRequest.deleteMany({
        where: {
          fasilitatorId: lap.fasilitatorId,
          receiptUrl: lap.buktiTransferTransport,
          description: { contains: 'Transport Mengajar' }
        }
      });
    }

    await prisma.laporanKegiatan.update({
      where: { id: laporanId },
      data: {
        statusTransport: 'PENDING',
        buktiTransferTransport: null
      }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  }
  return { error: 'Status bukan PAID' };
}
`;

code += newAction;
fs.writeFileSync(filePath, code);
console.log('Added cancelTransportPaid');
