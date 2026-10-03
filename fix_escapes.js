const fs = require('fs');

let page = fs.readFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', 'utf8');

page = page.replace("router.push(`\\/laporan-pengeluaran?\\${params.toString()}\\`)", "router.push(`/laporan-pengeluaran?${params.toString()}`)");
page = page.replace("router.push(\\`/laporan-pengeluaran?\\${params.toString()}\\`)", "router.push(`/laporan-pengeluaran?${params.toString()}`)");
page = page.replace("download\", \\`Laporan_Pengeluaran_\\${startDate || 'All'}_\\${endDate || 'All'}.csv\\`)", "download\", `Laporan_Pengeluaran_${startDate || 'All'}_${endDate || 'All'}.csv`)");
page = page.replace("filename: \\`Laporan_Pengeluaran_\\${startDate || 'All'}_\\${endDate || 'All'}.pdf\\`,", "filename: `Laporan_Pengeluaran_${startDate || 'All'}_${endDate || 'All'}.pdf`,");
page = page.replace("\\\\n", "\\n");

fs.writeFileSync('src/app/(snt)/laporan-pengeluaran/client-page.tsx', page);
console.log('Fixed escape chars');
