const fs = require('fs');
const filePath = 'src/app/layout.tsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('NextTopLoader')) {
  code = code.replace(
    "import { Providers } from './providers';",
    "import { Providers } from './providers';\nimport NextTopLoader from 'nextjs-toploader';"
  );
  
  code = code.replace(
    "<body className={inter.className}>",
    "<body className={inter.className}>\n        <NextTopLoader color=\"#10b981\" showSpinner={false} />"
  );
}

fs.writeFileSync(filePath, code);
console.log("Added NextTopLoader to RootLayout");
