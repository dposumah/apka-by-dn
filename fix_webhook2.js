const fs = require('fs');
let r = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

const replacementLogic = `let finalNoUrut = inputNoUrut || "";
  if (!inputNoUrut) {
    if (existing) {
      if (existing.noKwitansi.includes('TEMP') || existing.noKwitansi === "") {
        finalNoUrut = existing.noUrut.toString().padStart(3, '0');
      } else {
        return JSON.parse(JSON.stringify(existing));
      }
    } else {
      const lastRecord = await prisma.kwitansiRecord.findFirst({ orderBy: { noUrut: 'desc' } });
      finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
    }
  }
  
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  const noUrut = finalNoUrut;`;

// 1. generateKwitansiExpense
r = r.replace(
  /if \(existing && !inputNoUrut\) \{\s*return JSON\.parse\(JSON\.stringify\(existing\)\);\s*\}\s*const webhookUrl = "https:\/\/script\.google\.com[^\n]*\n\s*const noUrut = inputNoUrut \|\| "";/,
  replacementLogic
);

// 2. generateKwitansiTransportBulanan
r = r.replace(
  /if \(existing && !inputNoUrut\) \{\s*return JSON\.parse\(JSON\.stringify\(existing\)\);\s*\}\s*const webhookUrl = "https:\/\/script\.google\.com[^\n]*\n\s*const noUrut = inputNoUrut \|\| "";/,
  replacementLogic
);

fs.writeFileSync('src/app/actions/rekap.ts', r);
console.log('Fixed all three functions');
