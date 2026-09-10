const fs = require('fs');
const files = [
  'src/components/layout/Header.tsx',
  'src/app/(dashboard)/akun/page.tsx',
  'src/app/(dashboard)/jurnal/[id]/page.tsx',
  'src/app/(dashboard)/jurnal/page.tsx',
  'src/app/(dashboard)/jurnal/baru/page.tsx',
  'src/app/(dashboard)/bank/rekonsiliasi/page.tsx',
  'src/app/(dashboard)/buku-besar/page.tsx',
  'src/app/(dashboard)/laporan/neraca-saldo/page.tsx',
  'src/app/(snt)/fasilitator/delete-fasil-button.tsx',
  'src/app/(snt)/fasilitator/[id]/reset-button.tsx',
  'src/app/(snt)/sidebar.tsx',
  'src/app/(snt)/dashboard-rab/ApproveButton.tsx',
  'src/app/(snt)/fasilitator/[id]/delete-laporan-button.tsx',
  'src/app/(snt)/fasilitator/[id]/cancel-lunas-button.tsx',
  'src/app/(snt)/portal/client-page.tsx',
  'src/app/(snt)/fasilitator/transport/client-page.tsx',
  'src/app/(snt)/fasilitator/laporan/client-page.tsx',
  'src/app/(snt)/portal/upload-fisik-btn.tsx',
  'src/app/(snt)/fasilitator/toggle-status-button.tsx',
  'src/app/(snt)/portal/rekap/client-page.tsx',
  'src/app/(snt)/fasilitator/rekap-honor/client-page.tsx',
  'src/app/(snt)/portal/profil/client-profil.tsx',
  'src/app/(snt)/fasilitator/form.tsx',
  'src/app/(snt)/fasilitator/[id]/bank-form.tsx'
];

let replacedCount = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  let original = code;
  
  if (!code.includes('useModal')) {
    // Add import
    const importStatement = "import { useModal } from '@/components/modal-provider';\n";
    
    // Find last import
    const lastImportIndex = code.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = code.indexOf('\n', lastImportIndex);
      code = code.slice(0, endOfLine + 1) + importStatement + code.slice(endOfLine + 1);
    } else {
      code = importStatement + code;
    }
  }

  // Inject hook into component
  // Usually it's `export default function Name() {` or `export function Name() {`
  const compRegex = /(export\s+(?:default\s+)?function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*{)/;
  if (!code.includes('const { confirm, alert } = useModal();')) {
      code = code.replace(compRegex, `$1\n  const { confirm, alert } = useModal();\n`);
  }

  // Handle specific inline confirm loops that must be async
  // E.g. onClick={(e) => { ... if(confirm(...)) ... }}
  code = code.replace(/onClick=\{\(e\)\s*=>\s*\{([^}]*)if\s*\(\s*confirm\(([^)]+)\)\s*\)([^}]*)\}\}/g, 
    "onClick={async (e) => {$1if(await confirm($2))$3}}");

  // e.g onClick={() => confirm(...) && doSomething()} -> not used, so safe

  // Handle generic `if (confirm(...))` to `if (await confirm(...))`
  // Only if the function is already async. This is tricky. Let's just do a blanket replace and fix build errors if needed.
  code = code.replace(/if\s*\(\s*!confirm\(/g, "if (!(await confirm(");
  code = code.replace(/if\s*\(\s*confirm\(/g, "if (await confirm(");
  
  // Handle alerts
  code = code.replace(/return\s+alert\(/g, "return await alert(");
  code = code.replace(/(?<!\.)alert\(/g, "await alert(");
  
  // Some await alert() might end up in a non-async arrow function e.g. .catch(e => await alert())
  // Let's fix common ones: .catch((e) => await alert(...)) => .catch(async (e) => await alert(...))
  code = code.replace(/\.catch\(\s*\(\s*e\s*\)\s*=>\s*await alert/g, ".catch(async (e) => await alert");
  code = code.replace(/\.catch\(\s*e\s*=>\s*await alert/g, ".catch(async (e) => await alert");

  if (code !== original) {
    fs.writeFileSync(file, code);
    replacedCount++;
    console.log(`Updated ${file}`);
  }
}
console.log(`Finished updating ${replacedCount} files.`);
