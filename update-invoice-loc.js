const fs = require('fs')

function replaceLokasiSNT(filePath) {
  let code = fs.readFileSync(filePath, 'utf8')
  // We look for lap.fasilitator.lokasiSNT and replace it with (lap.fasilitator.lokasiSNT ? lap.fasilitator.lokasiSNT.split(' - ')[0] : '-')
  // Also rekap.fasilitator.lokasiSNT
  code = code.replace(
    /\$\{lap\.fasilitator\.lokasiSNT \|\| '-'\}/g,
    "${lap.fasilitator.lokasiSNT ? lap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}"
  )
  code = code.replace(
    /\$\{rekap\.fasilitator\.lokasiSNT \|\| '-'\}/g,
    "${rekap.fasilitator.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}"
  )
  // For JSX in pdf page:
  code = code.replace(
    /\{rekap\.fasilitator\.lokasiSNT \|\| '-'\}/g,
    "{rekap.fasilitator.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}"
  )
  fs.writeFileSync(filePath, code)
}

replaceLokasiSNT('src/app/(snt)/fasilitator/laporan/client-page.tsx')
replaceLokasiSNT('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx')
replaceLokasiSNT('src/app/(snt)/portal/rekap/[id]/pdf/page.tsx')
