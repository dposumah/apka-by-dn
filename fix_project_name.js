const fs = require('fs');

const targetFile = 'src/app/(snt)/laporan-pengeluaran/client-page.tsx';
let page = fs.readFileSync(targetFile, 'utf8');

// Replace the fallback 'Proyek SNT' string in the print header
page = page.replace(
  /\{rabData\?\.project\?\.name \|\| 'Proyek SNT'\}/g,
  "{rabData?.project?.name === 'Proyek SNT' || !rabData?.project?.name ? 'Program KKA Sekolah Nasional Terintegrasi (SNT) Tahun 2026' : rabData.project.name}"
);

fs.writeFileSync(targetFile, page);
console.log('Fixed project name in header');
