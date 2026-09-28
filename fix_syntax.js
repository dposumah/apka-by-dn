const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');
c = c.split("'KWT/TEMP/$({Date.now()};").join("('KWT/TEMP/' + Date.now())");
fs.writeFileSync('src/app/actions/rekap.ts', c);
