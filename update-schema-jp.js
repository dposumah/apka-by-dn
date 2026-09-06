const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  'jenisKegiatan   String @default("INTRAKURIKULER")',
  '// jenisKegiatan   String @default("INTRAKURIKULER")'
)
schema = schema.replace(
  'jumlahJP        Int    @default(0)',
  'jumlahJPIntra   Int    @default(0)\n    jumlahJPEkstra  Int    @default(0)'
)

fs.writeFileSync('prisma/schema.prisma', schema)
