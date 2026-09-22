const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/sidebar.tsx', 'utf8');

if (!code.includes('Akomodasi ToT')) {
  const target = '{ title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" },';
  const addition = '{ title: "Sewa & Akomodasi", href: "/fasilitator/akomodasi" },';
  code = code.replace(target, target + '\n      ' + addition);
  fs.writeFileSync('src/app/(snt)/sidebar.tsx', code);
  console.log('Sidebar updated');
}
