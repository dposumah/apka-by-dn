const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

// Fix monthStr
code = code.replace(
  "const monthStr = ${d.getFullYear()}-;",
  "const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;"
)

// In submitRekapBulanan, I wrote:
// description: Honor Pengajar - Bulan  ( JP),
code = code.replace(
  "description: Honor Pengajar - Bulan  ( JP),",
  "description: `Honor Pengajar - Bulan ${rekap.bulan} (${rekap.totalJP} JP)`,"
)

fs.writeFileSync('src/app/actions/rekap.ts', code)
