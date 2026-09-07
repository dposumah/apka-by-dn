const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')
code = '"use client"\n\n' + code
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
