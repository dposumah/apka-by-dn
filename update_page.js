const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/page.tsx', 'utf8');

page = page.replace(
  /import \{ getLaporanPengeluaran \} from '@\/app\/actions\/rab'/,
  "import { getLaporanPengeluaran, getRabDashboardData } from '@/app/actions/rab'"
);

page = page.replace(
  /const expenses = await getLaporanPengeluaran\(searchParams\.startDate, searchParams\.endDate\)/,
  "const expenses = await getLaporanPengeluaran(searchParams.startDate, searchParams.endDate)\n  const rabData = await getRabDashboardData()"
);

page = page.replace(
  /<LaporanClientPage initialData=\{expenses\} \/>/,
  "<LaporanClientPage initialData={expenses} rabData={rabData} />"
);

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/page.tsx', page);
console.log('Updated page.tsx');
