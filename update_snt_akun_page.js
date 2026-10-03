const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/snt-akun/page.tsx', 'utf8');

if (!page.includes('getAppSetting')) {
  page = page.replace(
    /import \{ SntAkunClient \} from "\.\/client"/,
    'import { SntAkunClient } from "./client"\nimport { getAppSetting } from "@/app/actions/rab"'
  );
  
  page = page.replace(
    /return <SntAkunClient user=\{user\} \/>/,
    `const hargaPertamax = await getAppSetting('harga_pertamax', '13900');\n  return <SntAkunClient user={user} hargaPertamax={hargaPertamax} />`
  );
  
  fs.writeFileSync('src/app/(snt)/snt-akun/page.tsx', page);
}
console.log('Fixed snt-akun page');
