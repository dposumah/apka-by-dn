const fs = require('fs');
const filePath = 'src/app/actions/rekap.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix result.noKwitansi parsing
content = content.replace(/let noKwitansiSheet = result\.noKwitansi \|\|/g, "let noKwitansiSheet = result.noSeri || result.noKwitansi ||");

fs.writeFileSync(filePath, content);
console.log('Fixed noKwitansi parsing in rekap.ts');
