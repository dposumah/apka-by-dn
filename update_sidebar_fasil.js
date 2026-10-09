const fs = require('fs');
const path = 'src/app/(snt)/sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('FileText')) {
  content = content.replace('ClipboardList,', 'ClipboardList, FileText,');
}

content = content.replace(
  '{ title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" }',
  '{ title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" },\n          { title: "Target JP", href: "/fasilitator/target-jp" }'
);

content = content.replace(
  '{ title: "Pengaturan Sandi", href: "/portal/password", icon: Lock, fasilOnly: true },',
  '{ title: "Rekap Honorarium", href: "/portal/rekap", icon: FileText, fasilOnly: true },\n  { title: "Pengaturan Sandi", href: "/portal/password", icon: Lock, fasilOnly: true },'
);

fs.writeFileSync(path, content);
console.log('Sidebar updated properly');
