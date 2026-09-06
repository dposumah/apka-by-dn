const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

// Replace globally (there are 2 occurrences of alamat: data.alamat)
code = code.replace(
  /alamat:\s*data\.alamat\s*\|\|\s*null,/g,
  "alamat: data.alamat || null,\n      propinsi: data.propinsi || null,\n      kabKota: data.kabKota || null,"
)

fs.writeFileSync('src/app/actions/rab.ts', code)
