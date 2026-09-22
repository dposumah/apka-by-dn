const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

const toReplace = `      try {
        const record = await generateKwitansiHonor(rekap.id);
        noKwitansi = record.noKwitansi;
        kwitansiDate = new Date(record.tanggal);
      } catch (err) {
        console.error("Gagal generate no kwitansi:", err);
      }`;

const replaceWith = `      try {
        const record = await generateKwitansiHonor(rekap.id);
        noKwitansi = record.noKwitansi;
        kwitansiDate = new Date(record.tanggal);
      } catch (err: any) {
        console.error("Gagal generate no kwitansi:", err);
        alert(err.message || "Gagal menghubungi Google Sheets");
        return; // Stop if failed
      }`;

code = code.replace(toReplace, replaceWith);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Added alert for webhook failure');
