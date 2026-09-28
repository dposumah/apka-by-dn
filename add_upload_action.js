const fs = require('fs');

const rekapUpdate = `
export async function uploadBuktiRekap(rekapId: string, urlHonor?: string, urlTransport?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('Unauthorized');
    
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser) throw new Error('User not found');

    const rekap = await prisma.rekapHonorarium.findUnique({
      where: { id: rekapId },
      include: { fasilitator: true, laporan: true }
    });
    
    if (!rekap) throw new Error("Rekap tidak ditemukan");

    // Lakukan update URL bukti di RekapHonorarium
    const updateData: any = {};
    if (urlHonor) updateData.buktiPembayaranHonor = urlHonor;
    if (urlTransport) updateData.buktiPembayaranTransport = urlTransport;
    
    await prisma.rekapHonorarium.update({
      where: { id: rekapId },
      data: updateData
    });

    // Otomatis buat Pengeluaran Lapangan (ExpenseRequest) untuk memotong RAB
    // 1. Potong RAB Honorarium Fasilitator Koding & KA
    if (urlHonor) {
      const honorRabItem = await prisma.rabItem.findFirst({
        where: { name: { contains: 'Fasilitator Koding & KA', mode: 'insensitive' } }
      });
      
      if (honorRabItem) {
        // Cek apakah sudah pernah dipotong
        const descText = \`Honorarium \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan} (RekapID: \${rekap.id})\`;
        const existingExpense = await prisma.expenseRequest.findFirst({
          where: { description: descText }
        });
        
        if (!existingExpense) {
          await prisma.expenseRequest.create({
            data: {
              rabItemId: honorRabItem.id,
              amount: rekap.totalHonor,
              description: descText,
              paymentReceiptUrl: urlHonor,
              status: 'APPROVED',
              createdById: currentUser.id,
              approvedById: currentUser.id,
              fasilitatorId: rekap.fasilitatorId,
              date: new Date()
            }
          });
        } else {
          // Update receipt url if it already existed
          await prisma.expenseRequest.update({
            where: { id: existingExpense.id },
            data: { paymentReceiptUrl: urlHonor }
          });
        }
      }
    }

    // 2. Potong RAB Sewa Rumah untuk Transport
    if (urlTransport) {
      const totalTransport = rekap.laporan.reduce((acc, lap) => acc + (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0), 0);
      
      if (totalTransport > 0) {
        const transportRabItem = await prisma.rabItem.findFirst({
          where: { name: { contains: 'Bantuan Sewa Rumah Fasilitator', mode: 'insensitive' } }
        });
        
        if (transportRabItem) {
          const descText = \`Transportasi \${rekap.fasilitator.namaLengkap} - Bulan \${rekap.bulan} (RekapID: \${rekap.id})\`;
          const existingExpense = await prisma.expenseRequest.findFirst({
            where: { description: descText }
          });
          
          if (!existingExpense) {
            await prisma.expenseRequest.create({
              data: {
                rabItemId: transportRabItem.id,
                amount: totalTransport,
                description: descText,
                paymentReceiptUrl: urlTransport,
                status: 'APPROVED',
                createdById: currentUser.id,
                approvedById: currentUser.id,
                fasilitatorId: rekap.fasilitatorId,
                date: new Date()
              }
            });
          } else {
            await prisma.expenseRequest.update({
              where: { id: existingExpense.id },
              data: { paymentReceiptUrl: urlTransport }
            });
          }
        }
      }
    }

    revalidatePath('/fasilitator/rekap-honor');
    revalidatePath('/dashboard-rab');
    return { success: true };
  } catch (error: any) {
    console.error('Error in uploadBuktiRekap:', error);
    return { error: error.message };
  }
}
`;

let rekapFile = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

// Also make sure getServerSession and authOptions are imported
if (!rekapFile.includes('getServerSession')) {
  rekapFile = `import { getServerSession } from 'next-auth'\nimport { authOptions } from '@/lib/auth'\n` + rekapFile;
}

fs.writeFileSync('src/app/actions/rekap.ts', rekapFile + '\n' + rekapUpdate);
console.log('Added uploadBuktiRekap server action');
