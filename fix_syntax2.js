const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');
c = c.replace(/console\.error\(Error in (.*?):, error\);/g, 'console.error(`Error in ${$1}:`, error);');
c = c.replace(/return \{ error: error\.message \|\| Unknown error in (.*?) \};/g, 'return { error: error.message || `Unknown error in ${$1}` };');
c = c.replace(/\$\{\$1\}/g, "$1");
fs.writeFileSync('src/app/actions/rekap.ts', c);
