const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/laporan/client-form.tsx', 'utf8')

code = code.replace(
  "biayaTransport: '',",
  "biayaTransportLaut: '',"
)

code = code.replace(
  /formData\.biayaTransport/g,
  "formData.biayaTransportLaut"
)

fs.writeFileSync('src/app/(snt)/portal/laporan/client-form.tsx', code)
