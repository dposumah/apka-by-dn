const fs = require('fs');

// 1. Update rab.ts
let rabFile = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
rabFile = rabFile.replace(
  /export async function submitExpense\(data: \{ rabItemId: string, amount: number, description: string, receiptUrl\?: string, userId: string, fasilitatorId\?: string \}\) \{/,
  "export async function submitExpense(data: { rabItemId: string, amount: number, description: string, receiptUrl?: string, userId: string, fasilitatorId?: string, date?: string }) {"
);
rabFile = rabFile.replace(
  /status: 'APPROVED'\n\s*\},/,
  "status: 'APPROVED',\n      date: data.date ? new Date(data.date) : new Date()\n    },"
);
fs.writeFileSync('src/app/actions/rab.ts', rabFile);

// 2. Update form.tsx
let formFile = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');
formFile = formFile.replace(
  /const \[description, setDescription\] = useState\(''\)/,
  "const [description, setDescription] = useState('')\n  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])"
);
formFile = formFile.replace(
  /fasilitatorId: isHonorarium \? selectedFasilitatorId : undefined/,
  "fasilitatorId: isHonorarium ? selectedFasilitatorId : undefined,\n        date: expenseDate"
);
formFile = formFile.replace(
  /setFile\(null\)/,
  "setFile(null)\n      setExpenseDate(new Date().toISOString().split('T')[0])"
);

// Add the date input UI in form.tsx before Nominal
formFile = formFile.replace(
  /<div>\s*<Label className="block text-sm font-medium mb-1">Nominal \(Rp\)/,
  `<div>
            <Label className="block text-sm font-medium mb-1">Tanggal Pengeluaran</Label>
            <Input 
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1">Nominal (Rp)`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', formFile);
console.log('Fixed expense form date');
