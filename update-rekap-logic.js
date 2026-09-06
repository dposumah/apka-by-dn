const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

// First, remove ExpenseRequest creation from submitRekapBulanan
const targetToReplace = `  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Honor', mode: 'insensitive' } }
  });

  if (rabItem) {
    await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: rekap.totalHonor,
        description: \`Honor Pengajar - Bulan \${rekap.bulan} (\${rekap.totalJP} JP)\`,
        receiptUrl: fileUrl,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId: rekap.fasilitatorId,
      }
    });
  }`

code = code.replace(targetToReplace, '')

// Next, create a new Server Action for Admin to generate the invoice
const adminAction = `
export async function adminGenerateInvoiceHonor(rekapId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });

  if (!rekap) throw new Error('Rekap tidak ditemukan');
  
  if (rekap.status === 'APPROVED') {
    return rekap; // Already approved
  }

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Honor', mode: 'insensitive' } }
  });

  if (rabItem) {
    await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: rekap.totalHonor,
        description: \`Honor Pengajar - Bulan \${rekap.bulan} (\${rekap.totalJP} JP)\`,
        receiptUrl: rekap.filePdf,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId: rekap.fasilitatorId,
      }
    });
  }

  const updated = await prisma.rekapHonorarium.update({
    where: { id: rekapId },
    data: {
      status: 'APPROVED'
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/dashboard-rab');
  return updated;
}
`
code += adminAction;

fs.writeFileSync('src/app/actions/rekap.ts', code)
