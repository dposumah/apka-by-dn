const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/sidebar.tsx', 'utf8')
code = code.replace(
  '<h1 className="text-xl font-bold tracking-tight text-white leading-tight">KKA Robotika</h1>',
  '<h1 className="text-xl font-bold tracking-tight text-white leading-tight">PT. JT Robotic</h1>'
)
fs.writeFileSync('src/app/(snt)/sidebar.tsx', code)
