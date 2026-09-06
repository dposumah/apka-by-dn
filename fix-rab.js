const fs = require('fs')
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  "  revalidatePath('/portal')\r\n  return updated\r\n\r\nexport async function submitLaporanKegiatan",
  "  revalidatePath('/portal')\r\n  return updated\r\n}\r\n\r\nexport async function submitLaporanKegiatan"
)

fs.writeFileSync('src/app/actions/rab.ts', code)
