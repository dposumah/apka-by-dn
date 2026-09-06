const fs = require('fs')

let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8')

code = code.replace(
  'foto2: data.foto2 || null,\n      statusTransport: \'PENDING\',',
  'foto2: data.foto2 || null,\n      buktiTiketTransport: data.buktiTiketTransport || null,\n      statusTransport: \'PENDING\','
)

fs.writeFileSync('src/app/actions/rab.ts', code)
