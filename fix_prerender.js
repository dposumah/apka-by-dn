const fs = require('fs');

const file = 'src/app/(snt)/fasilitator/transport/page.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("export const dynamic = 'force-dynamic'")) {
    code = "export const dynamic = 'force-dynamic';\n" + code;
    fs.writeFileSync(file, code);
  }
}
console.log('Added force-dynamic');
