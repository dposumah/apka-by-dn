const fs = require('fs');
let code = fs.readFileSync('src/middleware.ts', 'utf8');
code = code.replace('/((?!api/auth|_next/static|_next/image|favicon.ico|login|icon.png|$).*)', '/((?!api/auth|api/test-email|_next/static|_next/image|favicon.ico|login|icon.png|$).*)');
fs.writeFileSync('src/middleware.ts', code);
