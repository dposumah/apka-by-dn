const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

const target = `export async function markTransportPaid(laporanId: string, buktiUrl: string) {
  await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: { 
      statusTransport: 'PAID',
      buktiTransferTransport: buktiUrl 
    }
  });
  revalidatePath('/fasilitator/transport');
}`

const replace = `export async function markTransportPaid(laporanId: string, buktiUrl: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const lap = await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: { 
      statusTransport: 'PAID',
      buktiTransferTransport: buktiUrl 
    }
  });

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Transport', mode: 'insensitive' } }
  });

  if (rabItem) {
    await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0),
        description: \`Transport Mengajar Fasilitator - \${lap.topic}\`,
        receiptUrl: buktiUrl,
        status: 'PAID',
        createdById: userId,
        fasilitatorId: lap.fasilitatorId,
      }
    });
  }

  revalidatePath('/fasilitator/transport');
}`

code = code.replace(target, replace)
fs.writeFileSync('src/app/actions/rekap.ts', code)
