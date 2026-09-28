const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

if (!page.includes('inputInvoiceNoUrut')) {
  page = page.replace(
    /const \[inputNoUrut, setInputNoUrut\] = useState\(""\)/,
    `const [inputNoUrut, setInputNoUrut] = useState("")\n  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")\n  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")`
  );
  fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
}
console.log('Fixed missing states in form.tsx');
