const fs = require('fs')

const filePath = 'src/app/(snt)/fasilitator/page.tsx'
let code = fs.readFileSync(filePath, 'utf8')

// Replace headers
code = code.replace(
  /<th className="px-4 py-3">Instansi<\/th>[\s\S]*?<th className="px-4 py-3">Bidang Keahlian<\/th>/,
  '<th className="px-4 py-3">Lokasi SNT</th>\n                  <th className="px-4 py-3">Email</th>'
)

// Replace body rows
const bodyRegex = /<td className="px-4 py-3 text-slate-600">\{f\.instansi\}<\/td>[\s\S]*?<td className="px-4 py-3">\s*<Badge variant="secondary">\{f\.klusterKeahlian\}<\/Badge>\s*<\/td>/

const bodyReplacement = `<td className="px-4 py-3 text-slate-600">{f.lokasiSNT || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{f.email || '-'}</td>`

code = code.replace(bodyRegex, bodyReplacement)

fs.writeFileSync(filePath, code)
