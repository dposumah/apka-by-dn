const fs = require('fs')
let code = fs.readFileSync('src/app/(snt)/dashboard-rab/page.tsx', 'utf8')

// Add import
code = code.replace(
  "import { Badge } from '@/components/ui/badge'",
  "import { Badge } from '@/components/ui/badge'\nimport { ApproveButton } from './ApproveButton'"
)

// Replace forms
const target = `{exp.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <form action={async () => { 'use server'; await approveExpense(exp.id, 'APPROVED') }}>
                            <button type="submit" className="text-green-600 hover:underline">Setujui</button>
                          </form>
                          <form action={async () => { 'use server'; await approveExpense(exp.id, 'REJECTED') }}>
                            <button type="submit" className="text-red-600 hover:underline">Tolak</button>
                          </form>
                        </div>
                      )}`

const replacement = `{exp.status === 'PENDING' ? (
                        <ApproveButton expenseId={exp.id} />
                      ) : exp.paymentReceiptUrl ? (
                        <a href={exp.paymentReceiptUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline text-xs bg-emerald-50 px-2 py-1 rounded">
                          Lihat Bukti Transfer
                        </a>
                      ) : null}`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/dashboard-rab/page.tsx', code)
