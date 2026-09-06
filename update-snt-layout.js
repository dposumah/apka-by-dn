const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/layout.tsx', 'utf8')

code = code.replace(
  'import { SntSidebar } from "./sidebar"',
  'import { SntSidebar } from "./sidebar"\nimport { SntHeader } from "./header"'
)

code = code.replace(
  '<header className="flex h-16 items-center justify-between border-b bg-white px-6 md:hidden">\n          <div className="flex items-center gap-2">\n            <h1 className="text-xl font-bold tracking-tight">SNT 2026</h1>\n          </div>\n        </header>',
  '<SntHeader />'
)

fs.writeFileSync('src/app/(snt)/layout.tsx', code)
