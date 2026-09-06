const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/sidebar.tsx', 'utf8')
code = code.replace(
  '<h2 className="text-sm text-emerald-300">SNT 2026 by JTR Explorer</h2>',
  '<h2 className="text-xs text-emerald-300">KKA Sekolah Nasional Terintegrasi Tahun 2026</h2>'
)
fs.writeFileSync('src/app/(snt)/sidebar.tsx', code)

let code2 = fs.readFileSync('src/app/(snt)/header.tsx', 'utf8')
code2 = code2.replace(
  '<h1 className="text-xl font-bold tracking-tight">SNT 2026</h1>',
  '<h1 className="text-lg font-bold tracking-tight">KKA SNT 2026</h1>'
)
fs.writeFileSync('src/app/(snt)/header.tsx', code2)
