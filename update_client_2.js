const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Replace both occurrences of getInvoiceHtml
file = file.replace(
  /if\s*\(printCheckInvoice\)\s*\{\s*htmlString\s*\+=\s*getInvoiceHtml\(selectedRekap,\s*printKopType\);\s*\}/g,
  `if (printCheckInvoice) {
                          const invRecord = await generateInvoiceHonorRecord(selectedRekap.id, inputNoUrut, inputTanggal);
                          if (invRecord?.error) throw new Error(invRecord.error);
                          htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
                        }`
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', file);
console.log("Client page updated!");
