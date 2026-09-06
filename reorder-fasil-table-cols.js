const fs = require('fs')

const filePath = 'src/app/(snt)/fasilitator/page.tsx'
let code = fs.readFileSync(filePath, 'utf8')

// Fix Headers order
code = code.replace(
  '<th className="px-4 py-3">Lokasi SNT</th>\n                  <th className="px-4 py-3">Email</th>\n                  <th className="px-4 py-3">Alamat / Wilayah</th>',
  '<th className="px-4 py-3">Lokasi SNT</th>\n                  <th className="px-4 py-3">Alamat / Wilayah</th>\n                  <th className="px-4 py-3">Email</th>'
)

// Fix Body order
const bodyRegex = /<td className="px-4 py-3 text-slate-600">\{f\.email \|\| '-'\}<\/td>[\s\S]*?<td className="px-4 py-3 max-w-\[200px\] truncate text-slate-600" title=\{f\.alamat \|\| ''\}>[\s\S]*?<\/td>/

const bodyReplacement = `<td className="px-4 py-3 max-w-[200px] truncate text-slate-600" title={f.alamat || ''}>
                      {f.kabKota || f.propinsi ? \`\${f.kabKota || ''} \${f.propinsi ? '('+f.propinsi+')' : ''}\` : (f.alamat || '-')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{f.email || '-'}</td>`

code = code.replace(bodyRegex, bodyReplacement)

fs.writeFileSync(filePath, code)
