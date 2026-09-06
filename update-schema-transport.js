const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

// Add to Fasilitator
schema = schema.replace(
  'isActive          Boolean @default(true)',
  'isActive          Boolean @default(true)\n    besaranTransport  Float   @default(120000)'
)

// Add to LaporanKegiatan
schema = schema.replace(
  'biayaTransport  Float? @default(0)',
  'biayaTransport  Float? @default(0)\n    biayaTransportLaut Float? @default(0)'
)

fs.writeFileSync('prisma/schema.prisma', schema)
