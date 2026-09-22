const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/akomodasi/page.tsx', 'utf8');
code = code.replace("import { getAllFasilitator } from '@/app/actions/fasilitator'", "import { getFasilitators } from '@/app/actions/rab'");
code = code.replace("getAllFasilitator()", "getFasilitators()");
fs.writeFileSync('src/app/(snt)/fasilitator/akomodasi/page.tsx', code);
console.log('Fixed page imports');
