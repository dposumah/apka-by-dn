const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/rekap/client-page.tsx', 'utf8')

// Fix Link href
code = code.replace(
  "<Link href={/portal/rekap//pdf} target=\"_blank\"",
  "<Link href={`/portal/rekap/${rekap.id}/pdf`} target=\"_blank\""
)

fs.writeFileSync('src/app/(snt)/portal/rekap/client-page.tsx', code)
