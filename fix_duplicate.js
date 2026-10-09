const fs = require('fs');
let content = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
content = content.replace(/ktpUrl: data.ktpUrl !== undefined \? data.ktpUrl : undefined,\n\s*ktpUrl: data.ktpUrl \|\| null,/g, 'ktpUrl: data.ktpUrl || null,');
fs.writeFileSync('src/app/actions/rab.ts', content);
