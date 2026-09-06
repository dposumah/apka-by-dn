const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/dashboard-rab/ApproveButton.tsx', 'utf8')

code = code.replace(
  /className=\{\\inline-flex items-center gap-1 cursor-pointer text-emerald-600 font-medium hover:underline \\\\}/,
  "className={'inline-flex items-center gap-1 cursor-pointer text-emerald-600 font-medium hover:underline ' + (processing ? 'opacity-50' : '')}"
)

fs.writeFileSync('src/app/(snt)/dashboard-rab/ApproveButton.tsx', code)
