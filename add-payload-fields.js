const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/form.tsx', 'utf8')

code = code.replace(
  "alamat: fd.get('alamat'),",
  "alamat: fd.get('alamat'),\n      propinsi: fd.get('propinsi'),\n      kabKota: fd.get('kabKota'),"
)

fs.writeFileSync('src/app/(snt)/fasilitator/form.tsx', code)
