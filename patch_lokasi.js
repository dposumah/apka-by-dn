const fs = require('fs');
const filePath = 'src/app/(snt)/portal/client-page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/Lokasi SNT: <span className="font-bold">\{fasilitator\.lokasiSNT\.split\(' - '\)\[0\]\}<\/span>/, 'Lokasi SNT: <span className="font-bold">{fasilitator.lokasiSNT.replace(" - ", ", ")}</span>');

fs.writeFileSync(filePath, code);
