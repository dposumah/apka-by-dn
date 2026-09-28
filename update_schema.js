const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(
  'status        String      @default("DRAFT")',
  'status        String      @default("DRAFT")\n    buktiPembayaranHonor      String?\n    buktiPembayaranTransport  String?'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated');
