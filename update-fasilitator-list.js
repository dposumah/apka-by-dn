const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/page.tsx', 'utf8')

// Import delete action, assume we will create deleteFasilitator in rab.ts
code = code.replace(
  "import { getFasilitators } from '@/app/actions/rab'",
  "import { getFasilitators } from '@/app/actions/rab'\nimport { DeleteFasilButton } from './delete-fasil-button'"
)

// Add Alamat column
code = code.replace(
  '<th className="px-4 py-3">Bidang Keahlian</th>',
  '<th className="px-4 py-3">Bidang Keahlian</th>\n                  <th className="px-4 py-3">Alamat / Wilayah</th>'
)

// Add Alamat data
const targetData = `<td className="px-4 py-3">
                      <Badge variant="secondary">{f.klusterKeahlian}</Badge>
                    </td>`
const replacementData = `<td className="px-4 py-3">
                      <Badge variant="secondary">{f.klusterKeahlian}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-600" title={f.alamat || ''}>
                      {f.kabKota || f.propinsi ? \`\${f.kabKota || ''} \${f.propinsi ? '('+f.propinsi+')' : ''}\` : (f.alamat || '-')}
                    </td>`

code = code.replace(targetData, replacementData)

// Add delete button next to Lihat Profil
const targetAction = `<Link href={\`/fasilitator/\${f.id}\`} className="text-sm font-medium text-blue-600 hover:underline">
                        Lihat Profil &rarr;
                      </Link>`
const replacementAction = `<div className="flex items-center gap-3">
                        <Link href={\`/fasilitator/\${f.id}\`} className="text-sm font-medium text-blue-600 hover:underline">
                          Lihat Profil &rarr;
                        </Link>
                        <DeleteFasilButton id={f.id} />
                      </div>`

code = code.replace(targetAction, replacementAction)

fs.writeFileSync('src/app/(snt)/fasilitator/page.tsx', code)
