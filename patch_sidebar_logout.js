const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add state for isLoggingOut
code = code.replace(
  "export function SntSidebar() {",
  "export function SntSidebar() {\n  const [isLoggingOut, setIsLoggingOut] = React.useState(false);\n  const handleLogout = (e: any) => {\n    e.preventDefault();\n    if (isLoggingOut) return;\n    setIsLoggingOut(true);\n    signOut({ callbackUrl: '/login' });\n  };"
);

// Replace button 1
code = code.replace(
  /onClick=\{\(e\) => \{ e\.preventDefault\(\); signOut\(\{ callbackUrl: "\/login" \}\) \}\}\s*onTouchEnd=\{\(e\) => \{ e\.preventDefault\(\); signOut\(\{ callbackUrl: "\/login" \}\) \}\}/g,
  "onClick={handleLogout} onTouchEnd={handleLogout}"
);

// Replace "Keluar" text
code = code.replace(
  ">Keluar</button>",
  ">{isLoggingOut ? 'Keluar...' : 'Keluar'}</button>"
);

fs.writeFileSync(filePath, code);
console.log("Patched sidebar.tsx logout");
