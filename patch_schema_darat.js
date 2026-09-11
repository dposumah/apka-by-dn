const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!code.includes('buktiTransportDarat')) {
  code = code.replace(
    /buktiTiketTransport String\?/,
    "buktiTiketTransport String?\n  buktiTransportDarat String?"
  );
  fs.writeFileSync('prisma/schema.prisma', code);
  console.log('Added buktiTransportDarat to schema');
}
