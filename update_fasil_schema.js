const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

c = c.replace(
  /defaultJPEkstra\s+Int\s+@default\(4\)/,
  'defaultJPEkstra   Int     @default(4)\n  jenisTugas        String  @default("INTRAKURIKULER") // INTRAKURIKULER, EKSTRAKURIKULER, KEDUANYA'
);

fs.writeFileSync('prisma/schema.prisma', c);
console.log('Done modifying schema');
