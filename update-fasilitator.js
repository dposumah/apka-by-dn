const fs = require('fs')

let page = fs.readFileSync('src/app/(snt)/fasilitator/page.tsx', 'utf8')

const target = `<Link href="/fasilitator/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
          + Tambah Fasilitator
        </Link>`

const replacement = `<div className="flex gap-2">
          <Link href="/fasilitator/transport" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-10 py-2 px-4">
            Rekap Transport
          </Link>
          <Link href="/fasilitator/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
            + Tambah Fasilitator
          </Link>
        </div>`

page = page.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/fasilitator/page.tsx', page)
