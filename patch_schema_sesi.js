const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(
  "totalJP       Int         @default(0)",
  "totalJP       Int         @default(0)\n  jumlahSesi    Int?        @default(4)"
);

fs.writeFileSync('prisma/schema.prisma', code);
console.log('Schema updated');
