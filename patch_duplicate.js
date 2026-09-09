const fs = require('fs');
const filePath = 'src/app/(snt)/portal/laporan/client-form.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/const \[fileLaporanFisik, setFileLaporanFisik\] = useState\(''\)\r?\n\s*const \[fileLaporanFisik, setFileLaporanFisik\] = useState\(''\)/g, "const [fileLaporanFisik, setFileLaporanFisik] = useState('')");

fs.writeFileSync(filePath, code);
