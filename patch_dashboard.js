const fs = require('fs');
const filePath = 'src/app/(snt)/dashboard-rab/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace import
code = code.replace(
  "import { ApproveButton } from './ApproveButton'",
  "import { DeleteExpenseButton } from './DeleteExpenseButton'"
);

// Replace the Aksi column content
code = code.replace(
  `{exp.status === 'PENDING' ? (
                        <ApproveButton expenseId={exp.id} />
                      ) : exp.paymentReceiptUrl ? (
                        <a href={exp.paymentReceiptUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline text-xs bg-emerald-50 px-2 py-1 rounded">
                          Lihat Bukti Transfer
                        </a>
                      ) : null}`,
  `<div className="flex items-center gap-3">
                        {exp.receiptUrl && (
                          <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                            Lihat Nota
                          </a>
                        )}
                        <DeleteExpenseButton expenseId={exp.id} />
                      </div>`
);

fs.writeFileSync(filePath, code);
console.log("Done patching dashboard-rab page");
