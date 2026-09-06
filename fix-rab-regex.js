const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  /revalidatePath\('\/portal'\)\s+return updated\s+export async function submitLaporanKegiatan/,
  "revalidatePath('/portal')\n  return updated\n}\n\nexport async function submitLaporanKegiatan"
)

fs.writeFileSync('src/app/actions/rab.ts', code)
