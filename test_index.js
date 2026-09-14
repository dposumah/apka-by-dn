const fs = require('fs');
let code = fs.readFileSync('src/app/actions/rab.ts', 'utf8');
console.log("IndexOf return laporan:", code.indexOf("  return laporan;\n}"));
