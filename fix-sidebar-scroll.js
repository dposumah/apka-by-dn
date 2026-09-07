const fs = require('fs')

let path = 'src/app/(snt)/sidebar.tsx'
let code = fs.readFileSync(path, 'utf8')

// Remove overflow-y-auto from wrapper
code = code.replace(
  'className="flex h-full w-full flex-col border-r bg-emerald-950 text-emerald-50 overflow-y-auto"',
  'className="flex h-full w-full flex-col border-r bg-emerald-950 text-emerald-50"'
)

// Add overflow-y-auto to nav
code = code.replace(
  '<nav className="flex-1 space-y-1 p-3">',
  '<nav className="flex-1 overflow-y-auto space-y-1 p-3">'
)

// Make sure footer is shrink-0
code = code.replace(
  '<div className="border-t border-emerald-900 p-4">',
  '<div className="shrink-0 border-t border-emerald-900 p-4">'
)

fs.writeFileSync(path, code)
