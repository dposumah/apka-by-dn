const fs = require('fs')

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8')

schema = schema.replace(
  'alamat            String?',
  'alamat            String?\n    propinsi          String?\n    kabKota           String?'
)

fs.writeFileSync('prisma/schema.prisma', schema)
