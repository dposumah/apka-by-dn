const fs = require('fs')

let path = 'src/app/(snt)/portal/client-page.tsx'
let code = fs.readFileSync(path, 'utf8')

code = code.replace(
  '<Link href="/portal/profil" className="underline font-medium">Lengkapi Profil Sekarang &rarr;</Link>',
  '<Link href="/portal/profil?edit=true" className="underline font-medium">Lengkapi Profil Sekarang &rarr;</Link>'
)

fs.writeFileSync(path, code)
