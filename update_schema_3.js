const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const invoiceModelRegex = /model InvoiceRecord \{[\s\S]*?@@map\("invoice_record"\)\n\}/;
const match = schema.match(invoiceModelRegex);

if (match) {
  let modelStr = match[0];
  if (!modelStr.includes('rekapId')) {
    modelStr = modelStr.replace(
      '@@map("invoice_record")',
      'rekapId String? @unique\n  rekap RekapHonorarium? @relation(fields: [rekapId], references: [id])\n\n  @@map("invoice_record")'
    );
    schema = schema.replace(match[0], modelStr);
    fs.writeFileSync('prisma/schema.prisma', schema);
    console.log('InvoiceRecord updated');
  }
}
