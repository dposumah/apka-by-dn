const fs = require('fs');

const rabFile = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
const exportFunc = `
export async function getLaporanPengeluaran(startDate?: string, endDate?: string) {
  const where: any = {
    status: 'APPROVED'
  };
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    where.date = { gte: new Date(startDate) };
  } else if (endDate) {
    where.date = { lte: new Date(endDate) };
  }

  const expenses = await prisma.expenseRequest.findMany({
    where,
    include: {
      rabItem: {
        include: {
          category: true
        }
      },
      fasilitator: true,
      kwitansiRecord: true,
      invoiceRecord: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  return expenses;
}
`;

fs.writeFileSync('src/app/actions/rab.ts', rabFile + '\n' + exportFunc);
console.log('Added getLaporanPengeluaran to rab.ts');
