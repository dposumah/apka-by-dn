const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  "alamat: formData.get('alamat') as string,",
  "alamat: formData.get('alamat') as string,\n      propinsi: formData.get('propinsi') as string,\n      kabKota: formData.get('kabKota') as string,"
)

// We have two places (create and update) where this might be needed. Let's do a global replace or check both.
const updateMatch = "alamat: data.get('alamat') as string,"
code = code.replace(
  updateMatch,
  "alamat: data.get('alamat') as string,\n      propinsi: data.get('propinsi') as string,\n      kabKota: data.get('kabKota') as string,"
)

fs.writeFileSync('src/app/actions/rab.ts', code)
