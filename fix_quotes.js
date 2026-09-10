const fs = require('fs');

function fix(file) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/if\s*\(!\(await\s+confirm\(([^)]+)\)\)\s*return;/g, "if (!(await confirm($1))) return;");
    // Also if there's double quotes inside
    code = code.replace(/if\s*\(!\(await\s+confirm\("([^"]+)"\)\)\s*return;/g, "if (!(await confirm(\"$1\"))) return;");
    fs.writeFileSync(file, code);
  }
}
fix('src/app/(dashboard)/jurnal/[id]/page.tsx');
fix('src/app/(dashboard)/jurnal/page.tsx');
fix('src/app/(snt)/fasilitator/[id]/reset-button.tsx');
console.log("Fixed quotes");
