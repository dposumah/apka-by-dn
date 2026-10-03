const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/sidebar.tsx', 'utf8');

page = page.replace(
  /\{ title: "Pengeluaran Lapangan", href: "\/pengeluaran", icon: Wallet, adminOnly: true \},/,
  `{ title: "Pengeluaran Lapangan", href: "/pengeluaran", icon: Wallet, adminOnly: true },\n  { title: "Laporan Pengeluaran", href: "/laporan-pengeluaran", icon: ClipboardList, adminOnly: true },`
);

fs.writeFileSync('src/app/(snt)/sidebar.tsx', page);
console.log('Fixed sidebar');
