const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/rekap/[id]/pdf/page.tsx', 'utf8')

const targetHeader = `{/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Laporan Bulanan Fasilitator</h1>
          <h2 className="text-lg font-semibold mt-1">SNT KKA Robotika 2026</h2>
        </div>`

const replacementHeader = `{/* Kop Surat */}
        <div className="mb-6">
          <img src="/kop-surat.png" className="w-full max-h-32 object-contain" alt="Kop Surat" />
        </div>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8 mt-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Laporan Bulanan Fasilitator</h1>
          <h2 className="text-lg font-semibold mt-1">KKA Sekolah Nasional Terintegrasi Tahun 2026</h2>
        </div>`

code = code.replace(targetHeader, replacementHeader)

fs.writeFileSync('src/app/(snt)/portal/rekap/[id]/pdf/page.tsx', code)
