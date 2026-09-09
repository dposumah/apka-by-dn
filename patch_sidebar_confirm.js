const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// We already added handleLogout, let's update it to add confirm
code = code.replace(
  "const handleLogout = (e: any) => { e.preventDefault(); if (isLoggingOut) return; setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); };",
  "const handleLogout = (e: any) => { e.preventDefault(); if (isLoggingOut) return; if (confirm('Apakah Anda yakin ingin keluar dari akun?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } };"
);

fs.writeFileSync(filePath, code);
console.log("Patched sidebar.tsx to add confirm");
