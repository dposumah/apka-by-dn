const fs = require('fs');

const filesToFix = [
  'src/app/(dashboard)/akun/page.tsx',
  'src/app/(dashboard)/jurnal/page.tsx',
  'src/app/(snt)/fasilitator/[id]/reset-button.tsx',
  'src/app/(snt)/fasilitator/laporan/client-page.tsx',
  'src/app/(snt)/portal/client-page.tsx',
  'src/app/(snt)/fasilitator/transport/client-page.tsx',
  'src/app/(snt)/fasilitator/[id]/delete-laporan-button.tsx',
  'src/app/(snt)/fasilitator/[id]/cancel-lunas-button.tsx',
  'src/app/(snt)/fasilitator/delete-fasil-button.tsx'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Fix missing closing parenthesis
    code = code.replace(/if\s*\(\!\(await\s+confirm\(([^)]+)\)\)\s*(?!(\)|\{))/g, "if (!(await confirm($1))) ");
    code = code.replace(/if\s*\(\!\(await\s+confirm\(([^)]+)\)\)\s*\{/g, "if (!(await confirm($1))) {");
    
    // Also the first regex might have produced `if (!(await confirm('...')) return;`
    // Let's just fix it globally
    code = code.replace(/if\s*\(!\(await\s+confirm\(([^)]+)\)\)\s*return;/g, "if (!(await confirm($1))) return;");
    
    // Transport client page had `if (!(await confirm('...')) {`
    code = code.replace(/if\s*\(!\(await\s+confirm\(([^)]+)\)\)\s*\{/g, "if (!(await confirm($1))) {");
    fs.writeFileSync(file, code);
  }
}

// Fix sidebar.tsx syntax error: `import { useModal }` placed inside another import block
const sidebarPath = 'src/app/(snt)/sidebar.tsx';
if (fs.existsSync(sidebarPath)) {
  let code = fs.readFileSync(sidebarPath, 'utf8');
  code = code.replace("import {\nimport { useModal } from '@/components/modal-provider';\n  LayoutDashboard,", "import {\n  LayoutDashboard,");
  if (!code.includes("import { useModal }")) {
    code = "import { useModal } from '@/components/modal-provider';\n" + code;
  }
  
  // Also fix onClick non-async
  code = code.replace("onClick={(e) => { e.preventDefault(); if (isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar dari akun?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } }}",
  "onClick={async (e) => { e.preventDefault(); if (isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar dari akun?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } }}");
  fs.writeFileSync(sidebarPath, code);
}

// Fix Header.tsx onClick non-async
const headerPath = 'src/components/layout/Header.tsx';
if (fs.existsSync(headerPath)) {
  let code = fs.readFileSync(headerPath, 'utf8');
  code = code.replace("onClick={(e) => { e.preventDefault(); if(isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } }}",
  "onClick={async (e) => { e.preventDefault(); if(isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } }}");
  fs.writeFileSync(headerPath, code);
}

// Fix non-async function awaits
const nonAsyncAwaits = [
  'src/app/(dashboard)/buku-besar/page.tsx',
  'src/app/(dashboard)/jurnal/[id]/page.tsx',
  'src/app/(dashboard)/jurnal/baru/page.tsx',
  'src/app/(dashboard)/laporan/neraca-saldo/page.tsx'
];

for (const file of nonAsyncAwaits) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace("const handleExport = (type: \"pdf\" | \"excel\") => {", "const handleExport = async (type: \"pdf\" | \"excel\") => {");
    code = code.replace("const removeLine = (id: string) => {", "const removeLine = async (id: string) => {");
    fs.writeFileSync(file, code);
  }
}

console.log('Fixed syntax errors');
