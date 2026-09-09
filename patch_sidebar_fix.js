const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "const userRole = session?.user?.role",
  "const userRole = session?.user?.role\n  const [isLoggingOut, setIsLoggingOut] = React.useState(false);\n  const handleLogout = (e: any) => { e.preventDefault(); if (isLoggingOut) return; setIsLoggingOut(true); signOut({ callbackUrl: '/login' }); };"
);

code = code.replace(">Keluar</button>", ">{isLoggingOut ? 'Keluar...' : 'Keluar'}</button>");

fs.writeFileSync(filePath, code);
console.log("Fixed handleLogout");
