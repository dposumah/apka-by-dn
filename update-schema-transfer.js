const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  /statusTransport String     @default\("PENDING"\)/g,
  `statusTransport String     @default("PENDING")
  buktiTransferTransport String?`
)

schema = schema.replace(
  /receiptUrl    String\?/g,
  `receiptUrl    String?
  paymentReceiptUrl String?`
)

fs.writeFileSync('prisma/schema.prisma', schema)
