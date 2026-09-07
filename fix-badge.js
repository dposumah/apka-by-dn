const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const targetBadge = `{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              Lokasi SNT: {fasilitator.lokasiSNT}
            </div>
          ) : (`

// Since whitespace can be an issue, let's use a regex
code = code.replace(/\{fasilitator\.lokasiSNT \? \([\s\S]*?Lokasi SNT: \{fasilitator\.lokasiSNT\}[\s\S]*?\) : \(/, 
`{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <span className="text-sm font-bold">{fasilitator.lokasiSNT.split(' - ')[0]}</span>
              {fasilitator.lokasiSNT.split(' - ')[1] && <span className="text-xs text-blue-600/80">{fasilitator.lokasiSNT.split(' - ')[1]}</span>}
            </div>
          ) : (`)

fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
console.log("Replaced badge!")
