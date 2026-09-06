const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8')

code = code.replace(
  /const totalJP = laporan.reduce\(\(sum, lap\) => sum \+ lap\.jumlahJP, 0\);/,
  "const totalJP = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0), 0);"
)

fs.writeFileSync('src/app/actions/rekap.ts', code)
