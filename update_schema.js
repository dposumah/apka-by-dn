const fs = require('fs')
const path = 'prisma/schema.prisma'
let code = fs.readFileSync(path, 'utf8')

// Add metodePelaksanaan
code = code.replace(/tingkatSekolah\s+String\s+@default\("SMP"\)/, 'tingkatSekolah  String @default("SMP")\n  metodePelaksanaan String @default("LURING")')

fs.writeFileSync(path, code)
