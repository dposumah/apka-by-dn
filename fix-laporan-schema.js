const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  '  statusTransport String @default("PENDING")',
  '  statusTransport String @default("PENDING")\n  buktiTransferTransport String?\n  buktiTiketTransport String?'
)

fs.writeFileSync('prisma/schema.prisma', schema)
