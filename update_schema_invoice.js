const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const invoiceModel = `
model InvoiceRecord {
  id          String   @id @default(cuid())
  noUrut      Int      @unique @default(autoincrement())
  noInvoice   String   @unique
  tanggal     DateTime @default(now())
  perihal     String
  owner       String   @default("Robotic Explorer")
  nominal     Float
  
  expenseId   String?  @unique
  expense     ExpenseRequest? @relation(fields: [expenseId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@map("invoice_record")
}
`;

schema = schema.replace(/model KwitansiRecord \{[\s\S]*?@@map\("kwitansi_record"\)\n\}/, match => match + '\n\n' + invoiceModel);

schema = schema.replace(/kwitansiRecord\s+KwitansiRecord\?/, 'kwitansiRecord KwitansiRecord?\n  invoiceRecord InvoiceRecord?');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Updated schema');
