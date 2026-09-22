const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const kwitansiModel = `
model KwitansiRecord {
  id          String   @id @default(cuid())
  noUrut      Int      @unique @default(autoincrement())
  noKwitansi  String   @unique
  tanggal     DateTime @default(now())
  perihal     String
  owner       String   @default("Robotic Explorer")
  nominal     Float
  
  rekapId     String?  @unique
  rekap       RekapHonorarium? @relation(fields: [rekapId], references: [id])
  
  expenseId   String?  @unique
  expense     ExpenseRequest? @relation(fields: [expenseId], references: [id])

  createdAt   DateTime @default(now())
  
  @@map("kwitansi_record")
}
`;

// Add relationships to RekapHonorarium and ExpenseRequest
code = code.replace(
  '@@map("rekap_honorarium")',
  'kwitansiRecord KwitansiRecord?\n\n  @@map("rekap_honorarium")'
);

code = code.replace(
  '@@map("expense_requests")',
  'kwitansiRecord KwitansiRecord?\n\n  @@map("expense_requests")'
);

code = code + '\n' + kwitansiModel;

fs.writeFileSync('prisma/schema.prisma', code);
console.log('Added KwitansiRecord to schema');
