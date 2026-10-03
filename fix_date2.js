const fs = require('fs');

let formFile = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

if (!formFile.includes('const [expenseDate')) {
  formFile = formFile.replace(
    /const \[loading, setLoading\] = useState\(false\)/,
    "const [loading, setLoading] = useState(false)\n  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])"
  );
}

fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', formFile);
console.log('Fixed expenseDate definition');
