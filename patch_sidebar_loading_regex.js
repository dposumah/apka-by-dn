const fs = require('fs');
const filePath = 'src/app/(snt)/sidebar.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/>\s*Keluar\s*<\/button>/g, ">{isLoggingOut ? 'Keluar...' : 'Keluar'}</button>");

fs.writeFileSync(filePath, code);
console.log("Patched sidebar.tsx to show loading text regex");
