const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  /lokasiSNT: data.lokasiSNT \|\| null,/g,
  "lokasiSNT: data.lokasiSNT || null,\n        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,"
)

fs.writeFileSync('src/app/actions/rab.ts', code)
