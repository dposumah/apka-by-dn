const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/dashboard-rab/page.tsx', 'utf8')

// Add imports
code = code.replace(
  "import { ApproveButton } from './ApproveButton'",
  "import { ApproveButton } from './ApproveButton'\nimport { prisma } from '@/lib/prisma'\nimport Link from 'next/link'"
)

// Fetch notification counts
code = code.replace(
  "const expenses = await getRecentExpenses(20)",
  "const expenses = await getRecentExpenses(20)\n\n  const pendingWeekly = await prisma.laporanKegiatan.count({ where: { statusTransport: 'PENDING', biayaTransport: { gt: 0 } } })\n  const pendingHonor = await prisma.rekapHonorarium.count({ where: { status: 'SUBMITTED' } })"
)

// Add widget
const widgetUI = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/fasilitator/laporan" className="block">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between hover:bg-amber-100 transition">
            <div>
              <h3 className="font-bold text-amber-900">Tagihan Transport Pending</h3>
              <p className="text-amber-700 text-sm">Menunggu verifikasi dan transfer</p>
            </div>
            <div className="text-2xl font-black text-amber-700 bg-amber-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingWeekly}
            </div>
          </div>
        </Link>
        <Link href="/fasilitator/rekap-honor" className="block">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between hover:bg-blue-100 transition">
            <div>
              <h3 className="font-bold text-blue-900">Rekap Honorarium Pending</h3>
              <p className="text-blue-700 text-sm">Menunggu verifikasi dan pembuatan Invoice</p>
            </div>
            <div className="text-2xl font-black text-blue-700 bg-blue-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingHonor}
            </div>
          </div>
        </Link>
      </div>`

code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
  `${widgetUI}\n\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`
)

fs.writeFileSync('src/app/(snt)/dashboard-rab/page.tsx', code)
