const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')
code = code.replace(/pangkatGolongan:\s*data\.pangkatGolongan\s*\|\|\s*null,/g, "pangkatGolongan: data.pangkatGolongan || null,\n        lokasiSNT: data.lokasiSNT || null,")
fs.writeFileSync('src/app/actions/rab.ts', code)
