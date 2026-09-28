const fs = require('fs');
let c = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const target = "const noKwitansiSheet = result.noKwitansi || ('KWT/TEMP/' + Date.now() + Math.floor(Math.random()*1000))";
const replacement = `let noKwitansiSheet = result.noKwitansi || ('KWT/TEMP/' + Date.now() + Math.floor(Math.random()*1000));
      const checkConflict = await prisma.kwitansiRecord.findUnique({ where: { noKwitansi: noKwitansiSheet } });
      if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
        noKwitansiSheet = noKwitansiSheet + '-' + Math.floor(Math.random() * 10000);
      }`;

c = c.split(target).join(replacement);
fs.writeFileSync('src/app/actions/rekap.ts', c);
