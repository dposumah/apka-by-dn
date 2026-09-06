const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  /biayaTransport  Float\?\s+@default\(0\)\s+statusTransport String\s+@default\("PENDING"\)\s+buktiTransferTransport String\?/,
  `biayaTransport  Float? @default(0)\n  statusTransport String @default("PENDING")\n  buktiTransferTransport String?\n  buktiTiketTransport String?`
)

fs.writeFileSync('prisma/schema.prisma', schema)
