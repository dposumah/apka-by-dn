const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add rekapId to InvoiceRecord
schema = schema.replace(
  '  expenseId String?         @unique\n  expense   ExpenseRequest? @relation(fields: [expenseId], references: [id])\n\n  createdAt DateTime @default(now())',
  '  expenseId String?         @unique\n  expense   ExpenseRequest? @relation(fields: [expenseId], references: [id])\n\n  rekapId   String?         @unique\n  rekap     RekapHonorarium? @relation(fields: [rekapId], references: [id])\n\n  createdAt DateTime @default(now())'
);

// 2. Add invoiceRecord to RekapHonorarium
schema = schema.replace(
  '  kwitansiRecord KwitansiRecord[]\n\n  @@map("rekap_honorarium")',
  '  kwitansiRecord KwitansiRecord[]\n  invoiceRecord  InvoiceRecord?\n\n  @@map("rekap_honorarium")'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated carefully');
