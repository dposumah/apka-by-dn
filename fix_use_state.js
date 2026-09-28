const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/pengeluaran/form.tsx', 'utf8');

if (!page.includes('const [inputInvoiceNoUrut')) {
  page = page.replace(
    /const \[inputNoUrut, setInputNoUrut\] = useState\(""\)/,
    `const [inputNoUrut, setInputNoUrut] = useState("")\n  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")\n  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")`
  );
  fs.writeFileSync('src/app/(snt)/pengeluaran/form.tsx', page);
}
