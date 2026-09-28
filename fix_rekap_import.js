const fs = require('fs');
let page = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

if (!page.includes("import { deleteRekapHonor, uploadBuktiRekap }")) {
  page = page.replace(
    /import \{ deleteRekapHonor \} from '@\/app\/actions\/rekap'/,
    "import { deleteRekapHonor, uploadBuktiRekap } from '@/app/actions/rekap'"
  );
  fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', page);
}
console.log('Fixed import');
