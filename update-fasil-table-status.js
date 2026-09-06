const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/page.tsx', 'utf8')

code = code.replace(
  "import { DeleteFasilButton } from './delete-fasil-button'",
  "import { DeleteFasilButton } from './delete-fasil-button'\nimport { ToggleStatusButton } from './toggle-status-button'"
)

code = code.replace(
  '<th className="px-4 py-3">Rekening Bank</th>',
  '<th className="px-4 py-3">Rekening Bank</th>\n                  <th className="px-4 py-3">Akses Login</th>'
)

const targetRowData = `<td className="px-4 py-3">
                      {f.bankAccount ? (
                        <span className="text-emerald-600 font-medium">{f.bankName} - {f.bankAccount}</span>
                      ) : (
                        <span className="text-rose-500 text-xs italic">Belum diset</span>
                      )}
                    </td>`

const replacementRowData = `<td className="px-4 py-3">
                      {f.bankAccount ? (
                        <span className="text-emerald-600 font-medium">{f.bankName} - {f.bankAccount}</span>
                      ) : (
                        <span className="text-rose-500 text-xs italic">Belum diset</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleStatusButton id={f.id} isActive={f.isActive} />
                    </td>`

code = code.replace(targetRowData, replacementRowData)

fs.writeFileSync('src/app/(snt)/fasilitator/page.tsx', code)
