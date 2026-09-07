const fs = require('fs')

let path = 'src/app/(snt)/portal/profil/client-profil.tsx'
let code = fs.readFileSync(path, 'utf8')

code = code.replace(
  '<p className="font-medium">{fasilitator.lokasiSNT || \'-\'}</p>',
  `{fasilitator.lokasiSNT ? (
    <>
      <p className="font-medium">{fasilitator.lokasiSNT.split(' - ')[0]}</p>
      {fasilitator.lokasiSNT.split(' - ')[1] && <p className="text-slate-600 text-xs mt-0.5 leading-tight">{fasilitator.lokasiSNT.split(' - ')[1]}</p>}
    </>
  ) : (
    <p className="font-medium">-</p>
  )}`
)

fs.writeFileSync(path, code)
