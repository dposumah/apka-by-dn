const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');
page = page.replace(
  /import \{ generateKwitansiExpense \} from '@\/app\/actions\/rekap'/,
  "import { generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'"
);
fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
console.log('Fixed import in form.tsx');
