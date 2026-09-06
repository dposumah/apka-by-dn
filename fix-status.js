const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')
code = code.replace("status: 'PAID',", "status: 'APPROVED',")
fs.writeFileSync('src/app/actions/rekap.ts', code)
