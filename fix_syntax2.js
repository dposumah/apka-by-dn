const fs = require('fs');

const fixParen = (file) => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/if\s*\(!\(await\s+confirm\(([^)]+)\)\)\s*return;/g, "if (!(await confirm($1))) return;");
    fs.writeFileSync(file, code);
  }
}

fixParen('src/app/(dashboard)/jurnal/[id]/page.tsx');
fixParen('src/app/(dashboard)/jurnal/page.tsx');
fixParen('src/app/(snt)/fasilitator/[id]/reset-button.tsx');

const portalPath = 'src/app/(snt)/portal/client-page.tsx';
if (fs.existsSync(portalPath)) {
  let code = fs.readFileSync(portalPath, 'utf8');
  code = code.replace("onClick={() => await alert('Harap lengkapi Profil dan Data Pembayaran Anda di menu Profil terlebih dahulu sebelum membuat laporan.')}",
  "onClick={async () => await alert('Harap lengkapi Profil dan Data Pembayaran Anda di menu Profil terlebih dahulu sebelum membuat laporan.')}");
  fs.writeFileSync(portalPath, code);
}

const sidebarPath = 'src/app/(snt)/sidebar.tsx';
if (fs.existsSync(sidebarPath)) {
  let code = fs.readFileSync(sidebarPath, 'utf8');
  // It was: const handleLogout = (e: any) => { e.preventDefault(); if (isLoggingOut) return; if (await confirm(...)) { ... } };
  code = code.replace("const handleLogout = (e: any) => { e.preventDefault(); if (isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar dari akun?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } };",
  "const handleLogout = async (e: any) => { e.preventDefault(); if (isLoggingOut) return; if (await confirm('Apakah Anda yakin ingin keluar dari akun?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } };");
  fs.writeFileSync(sidebarPath, code);
}

// Just to be safe, search for any other `await confirm` or `await alert` that is missing closing parenthesis.
console.log('Fixed syntax round 2');
