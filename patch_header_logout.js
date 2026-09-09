const fs = require('fs');
const filePath = 'src/components/layout/Header.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (code.includes('signOut')) {
  code = code.replace(
    "export function Header() {",
    "export function Header() {\n  const [isLoggingOut, setIsLoggingOut] = React.useState(false);"
  );
  
  code = code.replace(
    "onClick={() => signOut({ callbackUrl: '/login' })}",
    "onClick={(e) => { e.preventDefault(); if(isLoggingOut) return; setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); }}"
  );
  
  code = code.replace(
    ">Keluar</DropdownMenuItem>",
    ">{isLoggingOut ? 'Keluar...' : 'Keluar'}</DropdownMenuItem>"
  );
  
  fs.writeFileSync(filePath, code);
  console.log("Patched APKA Header logout");
}
