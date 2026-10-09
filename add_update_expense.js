const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');

const updateExpenseCode = `
export async function updateExpense(
  id: string, 
  data: {
    rabItemId: string,
    amount: number,
    description: string,
    fasilitatorId?: string,
    date?: Date
  }
) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return { error: authError };

  const expense = await prisma.expenseRequest.findUnique({
    where: { id }
  });

  if (!expense) return { error: 'Expense not found' };

  try {
    const updated = await prisma.expenseRequest.update({
      where: { id },
      data: {
        rabItemId: data.rabItemId,
        amount: data.amount,
        description: data.description,
        fasilitatorId: data.fasilitatorId || null,
        ...(data.date ? { date: data.date } : {})
      },
      include: {
        rabItem: true,
        fasilitator: true
      }
    });

    revalidatePath('/dashboard-rab');
    revalidatePath('/laporan-pengeluaran');
    return { success: true, expense: updated };
  } catch (error: any) {
    return { error: error.message };
  }
}
`;

if (!code.includes('updateExpense(')) {
  code += updateExpenseCode;
  fs.writeFileSync('src/app/actions/rab.ts', code);
}
console.log('Added updateExpense action');
