const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Change the modal logic
code = code.replace(
  "const handlePrintWithKop = (kopType: 'robotik' | 'maleo') => {",
  "const handlePrintWithKop = (docType: 'invoice' | 'kwitansi') => {"
);
code = code.replace(
  "if (selectedRekap) {\n      handleCetakInvoice(selectedRekap, kopType)\n    }",
  "if (selectedRekap) {\n      if (docType === 'invoice') {\n        cetakInvoiceLama(selectedRekap);\n      } else {\n        cetakKwitansiMaleo(selectedRekap);\n      }\n    }"
);

// Replace modal UI
code = code.replace(
  "Pilih Kop Surat Kwitansi",
  "Pilih Jenis Dokumen untuk Dicetak"
);
code = code.replace(
  "Pilih jenis kop surat yang akan digunakan untuk mencetak kwitansi honorarium ini.",
  "Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo)."
);
code = code.replace(
  "onClick={() => handlePrintWithKop('robotik')}",
  "onClick={() => handlePrintWithKop('invoice')}"
);
code = code.replace(
  "Gunakan Kop Robotik (Standar)",
  "Cetak Invoice Honorarium (Format Lama)"
);
code = code.replace(
  "onClick={() => handlePrintWithKop('maleo')}",
  "onClick={() => handlePrintWithKop('kwitansi')}"
);
code = code.replace(
  "Gunakan Kop Yayasan Maleo",
  "Cetak Kwitansi (Format Yayasan Maleo)"
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Modal updated');
