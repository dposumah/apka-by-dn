const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('reqBiayaTransport')) {
  schema = schema.replace(
    'buktiTransportDarat String?',
    'buktiTransportDarat String?\n  reqBiayaTransport Int?'
  );
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Added reqBiayaTransport to schema');
} else {
  console.log('reqBiayaTransport already exists');
}
