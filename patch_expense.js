const fs = require('fs');
const filePath = 'src/app/actions/rab.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Auto-approve on submit: add status: 'APPROVED' to create data
code = code.replace(
  "fasilitatorId: data.fasilitatorId || null\n    }\n  })\n  revalidatePath('/dashboard-rab')\n  revalidatePath('/pengeluaran')\n}",
  "fasilitatorId: data.fasilitatorId || null,\n      status: 'APPROVED'\n    }\n  })\n  revalidatePath('/dashboard-rab')\n  revalidatePath('/pengeluaran')\n}\n\nexport async function deleteExpense(id: string) {\n  await prisma.expenseRequest.delete({ where: { id } })\n  revalidatePath('/dashboard-rab')\n  revalidatePath('/pengeluaran')\n}"
);

// 2. Update approveExpense to accept paymentReceiptUrl
code = code.replace(
  "export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED') {\n  await prisma.expenseRequest.update({\n    where: { id: expenseId },\n    data: { status } // simplified for now, ideally set approvedById\n  })",
  "export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED', paymentReceiptUrl?: string) {\n  await prisma.expenseRequest.update({\n    where: { id: expenseId },\n    data: { status, paymentReceiptUrl: paymentReceiptUrl || null }\n  })"
);

fs.writeFileSync(filePath, code);
console.log("Done patching rab.ts");
