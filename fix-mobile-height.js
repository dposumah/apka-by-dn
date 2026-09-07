const fs = require('fs')

let path = 'src/app/(snt)/mobile-sidebar.tsx'
let code = fs.readFileSync(path, 'utf8')

// Replace `flex-1 flex-col` with `h-full flex-col`
code = code.replace(
  'className="relative flex w-64 max-w-[80vw] flex-1 flex-col',
  'className="relative flex w-64 max-w-[80vw] h-[100dvh] flex-col'
)

fs.writeFileSync(path, code)
