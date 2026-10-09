const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
    'expense   ExpenseRequest? @relation(fields: [expenseId], references: [id])',
    'expense   ExpenseRequest? @relation(fields: [expenseId], references: [id])\n\n  rekapId   String?         @unique\n  rekap     RekapHonorarium? @relation(fields: [rekapId], references: [id])'
);

schema = schema.replace(
    'kwitansiRecord KwitansiRecord[]',
    'kwitansiRecord KwitansiRecord[]\n  invoiceRecord InvoiceRecord[]'
);

fs.writeFileSync('prisma/schema.prisma', schema);
