const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  'kabKota           String?',
  'kabKota           String?\n    isActive          Boolean @default(true)'
)

fs.writeFileSync('prisma/schema.prisma', schema)
