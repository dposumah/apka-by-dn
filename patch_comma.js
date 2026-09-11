const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');
code = code.replace("},,", "},");
fs.writeFileSync('src/app/actions/rekap.ts', code);
console.log('Fixed double comma syntax error in rekap.ts');
