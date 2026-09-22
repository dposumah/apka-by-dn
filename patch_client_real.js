const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

const oldFuncStart = `const cetakKwitansiMaleo = (rekap: any) => {
      const win = window.open('', '_blank')
      if (!win) return
      
      // Konversi angka bulan jadi romawi untuk No Kuitansi
      const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      const d = new Date(rekap.createdAt);
      const monthRoman = romanMonths[d.getMonth()] || 'I';
      const year = d.getFullYear();
      const noKwitansi = \`KWT/MTC/\${monthRoman}/\${year}\`;
      const rateHonor = rekap.totalJP > 0 ? (rekap.totalHonor / rekap.totalJP) : 0;`;

const newFuncStart = `const cetakKwitansiMaleo = async (rekap: any) => {
      let noKwitansi = "KWT/MTC/TEMP";
      let kwitansiDate = new Date(rekap.createdAt);
      
      try {
        const record = await generateKwitansiHonor(rekap.id);
        noKwitansi = record.noKwitansi;
        kwitansiDate = new Date(record.tanggal);
      } catch (err: any) {
        console.error("Gagal generate no kwitansi:", err);
        alert(err.message || "Gagal menghubungi Google Sheets");
        return;
      }

      const win = window.open('', '_blank')
      if (!win) return
      
      const rateHonor = rekap.totalJP > 0 ? (rekap.totalHonor / rekap.totalJP) : 0;`;

code = code.replace(oldFuncStart, newFuncStart);

// Now change handlePrintWithKop to be async
const oldHandlePrint = `const handlePrintWithKop = (docType: 'invoice' | 'kwitansi') => {
      setShowKopModal(false)
      if (selectedRekap) {
        if (docType === 'invoice') {
          cetakInvoiceLama(selectedRekap);
        } else {
          cetakKwitansiMaleo(selectedRekap);
        }
      }
    }`;

const newHandlePrint = `const handlePrintWithKop = async (docType: 'invoice' | 'kwitansi') => {
      setShowKopModal(false)
      if (selectedRekap) {
        if (docType === 'invoice') {
          cetakInvoiceLama(selectedRekap);
        } else {
          await cetakKwitansiMaleo(selectedRekap);
        }
      }
    }`;

code = code.replace(oldHandlePrint, newHandlePrint);

// Add the import if not exists
if (!code.includes('generateKwitansiHonor')) {
  code = code.replace(
    "import { createRekapManual, deleteRekap } from '@/app/actions/rekap'",
    "import { createRekapManual, deleteRekap, generateKwitansiHonor } from '@/app/actions/rekap'"
  );
}

// Ensure the date logic inside cetakKwitansiMaleo uses kwitansiDate
code = code.replace(
  /<div>Tanggal : <strong>\$\{new Date\(rekap\.createdAt\)\.toLocaleDateString\('id-ID', \{ year: 'numeric', month: 'long', day: 'numeric' \}\)\}<\/strong><\/div>/g,
  "<div>Tanggal : <strong>${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>"
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Fixed client page!');
