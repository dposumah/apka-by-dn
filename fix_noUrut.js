const fs = require('fs');
let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

c = c.replace(
  /const record = await generateKwitansiTransportBulanan\(selectedRekap\.id, inputNoUrut, inputTanggal\);/g,
  `let transportNoUrut = inputNoUrut;
          if (printCheckHonor && printCheckTransport && inputNoUrut) {
            const num = parseInt(inputNoUrut, 10);
            if (!isNaN(num)) transportNoUrut = (num + 1).toString();
            else transportNoUrut = inputNoUrut + "-T";
          }
          const record = await generateKwitansiTransportBulanan(selectedRekap.id, transportNoUrut, inputTanggal);`
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', c);
