const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

if (!code.includes('const [inputInvoiceNoUrut')) {
  code = code.replace(
    /const \[inputNoUrut, setInputNoUrut\] = useState\(""\)/,
    `const [inputNoUrut, setInputNoUrut] = useState("")\n  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")\n  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")`
  );
  fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', code);
}
console.log('Fixed dashboard-rab TS errors');
