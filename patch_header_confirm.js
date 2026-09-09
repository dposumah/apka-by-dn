const fs = require('fs');
const filePath = 'src/components/layout/Header.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "onClick={(e) => { e.preventDefault(); if(isLoggingOut) return; setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); }}",
  "onClick={(e) => { e.preventDefault(); if(isLoggingOut) return; if(confirm('Apakah Anda yakin ingin keluar?')) { setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); } }}"
);

fs.writeFileSync(filePath, code);
console.log("Patched Header.tsx to add confirm");
