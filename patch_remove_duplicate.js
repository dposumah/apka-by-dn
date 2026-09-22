const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// I will remove the first "Honor per JP" block completely
const regex = /<div class="form-group">\s*<div class="form-label">Honor per JP<\/div>[\s\S]*?<\/div>/;
code = code.replace(regex, "");

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Removed duplicate via regex');
