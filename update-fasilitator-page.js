const fs = require('fs')
let path = 'src/app/(snt)/fasilitator/page.tsx'
let code = fs.readFileSync(path, 'utf8')

const importStr = `import { ExportExcelButton } from './export-excel-button'`
if (!code.includes(importStr)) {
  code = code.replace(
    `import { ToggleStatusButton } from './toggle-status-button'`,
    `import { ToggleStatusButton } from './toggle-status-button'\n${importStr}`
  )
}

const buttonsBlock = `<div className="flex gap-2">
          <Link href="/fasilitator/transport" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-10 py-2 px-4">
            Rekap Transport
          </Link>
          <Link href="/fasilitator/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
            + Tambah Fasilitator
          </Link>
        </div>`

const newButtonsBlock = `<div className="flex gap-2 flex-wrap">
          <ExportExcelButton data={fasilitators} />
          <Link href="/fasilitator/transport" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-10 py-2 px-4">
            Rekap Transport
          </Link>
          <Link href="/fasilitator/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
            + Tambah Fasilitator
          </Link>
        </div>`

code = code.replace(buttonsBlock, newButtonsBlock)

fs.writeFileSync(path, code)
