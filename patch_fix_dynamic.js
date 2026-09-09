const fs = require('fs');

function removeFirstDynamic(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Remove the very first occurrence of "export const dynamic = 'force-dynamic';" that I just prepended
  code = code.replace("export const dynamic = 'force-dynamic';\n", "");
  fs.writeFileSync(filePath, code);
}

removeFirstDynamic('src/app/(snt)/dashboard-rab/page.tsx');
removeFirstDynamic('src/app/(snt)/fasilitator/laporan/page.tsx');
console.log("Removed duplicate dynamic exports");
