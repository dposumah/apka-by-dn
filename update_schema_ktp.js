const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('ktpUrl')) {
  schema = schema.replace(
    /lokasiSNT\s+String\?/,
    'lokasiSNT         String?\n  ktpUrl            String?'
  );
  fs.writeFileSync(schemaPath, schema);
}
console.log('Added ktpUrl to schema');
