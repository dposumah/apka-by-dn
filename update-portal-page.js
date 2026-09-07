const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/portal/page.tsx', 'utf8')
code = code.replace(
  "laporan: { orderBy: { date: 'desc' } }",
  "laporan: { orderBy: { date: 'desc' } },\n      rekapHonorarium: true"
)
fs.writeFileSync('src/app/(snt)/portal/page.tsx', code)
