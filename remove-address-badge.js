const fs = require('fs')

let path = 'src/app/(snt)/portal/client-page.tsx'
let code = fs.readFileSync(path, 'utf8')

const targetBadge = `{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <span className="text-sm font-bold">{fasilitator.lokasiSNT.split(' - ')[0]}</span>
              {fasilitator.lokasiSNT.split(' - ')[1] && <span className="text-xs text-blue-600/80">{fasilitator.lokasiSNT.split(' - ')[1]}</span>}
            </div>
          ) : (`

const replacementBadge = `{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium">
              Lokasi SNT: <span className="font-bold">{fasilitator.lokasiSNT.split(' - ')[0]}</span>
            </div>
          ) : (`

code = code.replace(targetBadge, replacementBadge)
fs.writeFileSync(path, code)
