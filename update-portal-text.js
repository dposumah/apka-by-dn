const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')
code = code.replace(
  '<p className="text-slate-500 mt-1">Dashboard Portal Fasilitator KKA Robotika SNT 2026</p>',
  '<p className="text-slate-500 mt-1">Dashboard Portal Fasilitator PT. JT Robotic SNT 2026</p>'
)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
