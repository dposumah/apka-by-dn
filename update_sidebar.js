const fs = require('fs');
const path = 'src/app/(snt)/sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '{ title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" }',
  '{ title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" },\n          { title: "Target JP", href: "/fasilitator/target-jp" }'
);

fs.writeFileSync(path, content);
console.log('Sidebar updated');
