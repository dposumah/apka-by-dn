const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUrl() {
  const expense = await prisma.expenseRequest.findFirst({
    where: { description: { contains: 'Perjalanan Dinas Korwil' } },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Expense Receipt URL:', expense?.receiptUrl);
}

checkUrl().finally(() => prisma.$disconnect());
