const fs = require('fs');

let formFile = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');
formFile = formFile.replace(
  /<div className="space-y-2">\s*<Label>Nominal Pengeluaran \(Rp\)<\/Label>/,
  `<div className="space-y-2">
            <Label>Tanggal Pengeluaran</Label>
            <Input 
              type="date"
              name="expenseDate"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Nominal Pengeluaran (Rp)</Label>`
);

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', formFile);
console.log('Fixed date input');
