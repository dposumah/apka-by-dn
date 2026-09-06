const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

const target = `export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED') {
  await prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { status } // simplified for now, ideally set approvedById
  })
  revalidatePath('/dashboard-rab')
}`

const replacement = `export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED', paymentReceiptUrl?: string) {
  await prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { 
      status,
      paymentReceiptUrl: paymentReceiptUrl || null
    }
  })
  revalidatePath('/dashboard-rab')
}`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/actions/rab.ts', code)
