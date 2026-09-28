const fs = require('fs');
let r = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const invoiceFunc = `
export async function generateInvoiceExpense(expenseId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const existing = await prisma.invoiceRecord.findFirst({ where: { expenseId } });
    
    const expense = await prisma.expenseRequest.findUnique({
      where: { id: expenseId },
      include: { rabItem: true, fasilitator: true }
    });
    
    if (!expense) return { error: "Expense not found" };
    
    const perihal = \`\${expense.description} - \${expense.rabItem.name}\`;
    
    let finalNoUrut = inputNoUrut || "";
    if (!inputNoUrut) {
      if (existing) {
        if (existing.noInvoice.includes('TEMP') || existing.noInvoice === "") {
          finalNoUrut = existing.noUrut.toString().padStart(3, '0');
        } else {
          return JSON.parse(JSON.stringify(existing));
        }
      } else {
        const lastRecord = await prisma.invoiceRecord.findFirst({ orderBy: { noUrut: 'desc' } });
        finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
      }
    }

    const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
    const noUrut = finalNoUrut;
    const d = inputTanggal ? new Date(inputTanggal) : new Date();
    const tanggalFormatted = \`\${d.getDate().toString().padStart(2, '0')}/\${(d.getMonth() + 1).toString().padStart(2, '0')}/\${d.getFullYear()}\`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' }),
      });
      
      if (!response.ok) return { error: "HTTP error " + response.status };
      
      const result = await response.json();
      if (result.error) return { error: result.error };
      
      let noInvoiceSheet = result.noSeri || result.noKwitansi || ('INV/TEMP/' + Date.now() + Math.floor(Math.random()*1000));
      const checkConflict = await prisma.invoiceRecord.findUnique({ where: { noInvoice: noInvoiceSheet } });
      if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
        noInvoiceSheet = noInvoiceSheet + '-' + Math.floor(Math.random() * 10000);
      }
      
      let inv;
      if (existing) {
        inv = await prisma.invoiceRecord.update({
          where: { id: existing.id },
          data: { noInvoice: noInvoiceSheet, tanggal: d }
        });
      } else {
        inv = await prisma.invoiceRecord.create({
          data: {
            noInvoice: noInvoiceSheet,
            perihal,
            nominal: expense.amount,
            expenseId: expense.id,
            tanggal: d
          }
        });
      }
      return JSON.parse(JSON.stringify(inv));
      
    } catch (error: any) {
      console.error("Webhook Error:", error);
      return { error: "Gagal mengambil nomor invoice dari Google Sheets: " + error.message };
    }
  } catch (error: any) {
    console.error('Error in generateInvoiceExpense:', error);
    return { error: error.message || 'Unknown error in generateInvoiceExpense' };
  }
}
`;

fs.writeFileSync('src/app/actions/rekap.ts', r + '\n' + invoiceFunc);
console.log('Added generateInvoiceExpense');
