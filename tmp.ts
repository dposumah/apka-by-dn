export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      date: new Date(data.date),
      topic: data.topic,
      attendance: parseInt(data.attendance),
      evaluation: data.evaluation,
      materialLink: data.materialLink,
    }
  });

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Honor', mode: 'insensitive' } }
  });
  
  if (rabItem) {
    const expense = await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: parseInt(data.honorAmount) || 200000,
        description: 'Honor Pengajar: ' + data.topic,
        receiptUrl: data.materialLink,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId,
      }
    });
    
    await prisma.laporanKegiatan.update({
      where: { id: laporan.id },
      data: { expenseRequestId: expense.id }
    });
  }

  revalidatePath('/portal');
  revalidatePath('/dashboard-rab');
  return laporan;
}
