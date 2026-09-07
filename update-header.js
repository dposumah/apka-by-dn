const fs = require('fs')

let path = 'src/app/(snt)/header.tsx'
let code = fs.readFileSync(path, 'utf8')

// Add import
const importMobileSidebar = `import { MobileSidebar } from "./mobile-sidebar"\n`
code = code.replace(`import Link from "next/link"`, `import Link from "next/link"\n${importMobileSidebar}`)

// Add to JSX
const target = `<header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-2 md:hidden">
        <h1 className="text-lg font-bold tracking-tight">KKA SNT 2026</h1>
      </div>`

const replacement = `<header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <MobileSidebar />
        <h1 className="text-lg font-bold tracking-tight">KKA SNT</h1>
      </div>`

code = code.replace(target, replacement)
fs.writeFileSync(path, code)
