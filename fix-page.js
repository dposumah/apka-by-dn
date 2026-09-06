const fs = require('fs')
let page = fs.readFileSync('src/app/(snt)/portal/page.tsx', 'utf8')
page = page.replace(/laporan:\s*\{\s*,\s*orderBy:\s*\{\s*date:\s*'desc'\s*\}\s*\}/g, "laporan: { orderBy: { date: 'desc' } }")
fs.writeFileSync('src/app/(snt)/portal/page.tsx', page)
