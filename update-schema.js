const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
const target =   npwpNik         String?
const replacement =   npwpNik         String?
  statusKepegawaian String?
  pangkatGolongan   String?

schema = schema.replace(target, replacement)
fs.writeFileSync('prisma/schema.prisma', schema)
