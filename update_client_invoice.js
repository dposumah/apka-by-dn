const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

file = file.replace(
  'import { adminGenerateInvoiceHonor, uploadBuktiRekap } from \'@/app/actions/rekap\'',
  'import { adminGenerateInvoiceHonor, uploadBuktiRekap, generateInvoiceHonorRecord } from \'@/app/actions/rekap\''
);

file = file.replace(
  '        // 1. Invoice\n        if (printCheckInvoice) {\n          htmlString += getInvoiceHtml(selectedRekap, printKopType);\n        }',
  '        // 1. Invoice\n        if (printCheckInvoice) {\n          const invRecord = await generateInvoiceHonorRecord(selectedRekap.id, inputNoUrut, inputTanggal);\n          if (invRecord?.error) throw new Error(invRecord.error);\n          htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);\n        }'
);

file = file.replace(
  '                        if (printCheckInvoice) {\n                          htmlString += getInvoiceHtml(selectedRekap, printKopType);\n                        }',
  '                        if (printCheckInvoice) {\n                          const invRecord = await generateInvoiceHonorRecord(selectedRekap.id, inputNoUrut, inputTanggal);\n                          if (invRecord?.error) throw new Error(invRecord.error);\n                          htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);\n                        }'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', file);
