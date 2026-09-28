const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

page = page.replace(
  /import \{ adminGenerateInvoiceHonor \} from '@\/app\/actions\/rekap'/,
  "import { adminGenerateInvoiceHonor, uploadBuktiRekap } from '@/app/actions/rekap'"
);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', page);
console.log('Fixed import');
