const fs = require('fs');
const pages = [
  'src/app/(snt)/dashboard-rab/page.tsx',
  'src/app/(snt)/fasilitator/laporan/page.tsx',
  'src/app/(snt)/fasilitator/[id]/page.tsx'
];

pages.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    if (!code.includes("export const dynamic = 'force-dynamic'")) {
      code = "export const dynamic = 'force-dynamic';\n" + code;
      fs.writeFileSync(filePath, code);
      console.log(`Added force-dynamic to ${filePath}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
