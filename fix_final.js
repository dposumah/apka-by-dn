const fs = require('fs');

const sidebarPath = 'src/app/(snt)/sidebar.tsx';
if (fs.existsSync(sidebarPath)) {
  let code = fs.readFileSync(sidebarPath, 'utf8');
  code = code.replace("import { useModal } from '@/components/modal-provider';\n\"use client\"", "\"use client\"\nimport { useModal } from '@/components/modal-provider';");
  fs.writeFileSync(sidebarPath, code);
}

const resetBtnPath = 'src/app/(snt)/fasilitator/[id]/reset-button.tsx';
if (fs.existsSync(resetBtnPath)) {
  let code = fs.readFileSync(resetBtnPath, 'utf8');
  code = code.replace("if (!(await confirm('Apakah Anda yakin ingin mereset kata sandi fasilitator ini ke standar (SNT2026)?')) return;", "if (!(await confirm('Apakah Anda yakin ingin mereset kata sandi fasilitator ini ke standar (SNT2026)?'))) return;");
  fs.writeFileSync(resetBtnPath, code);
}
console.log('Fixed final 2 syntax errors');
