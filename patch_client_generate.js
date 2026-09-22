const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// 1. Add import
code = code.replace(
  "import { createRekapManual, deleteRekap } from '@/app/actions/rekap'",
  "import { createRekapManual, deleteRekap, generateKwitansiHonor } from '@/app/actions/rekap'"
);

// 2. Make handleAction async
code = code.replace(
  "const handleAction = (rekap: any, actionType: 'lama' | 'maleo') => {",
  "const handleAction = async (rekap: any, actionType: 'lama' | 'maleo') => {"
);

// 3. Update cetakKwitansiMaleo signature and logic
const toReplaceFunc = `const cetakKwitansiMaleo = (rekap: any) => {
      const win = window.open('', '_blank')
      if (!win) return
      
      // Konversi angka bulan jadi romawi untuk No Kuitansi
      const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      const d = new Date(rekap.createdAt);
      const monthRoman = romanMonths[d.getMonth()] || 'I';
      const year = d.getFullYear();
      const noKwitansi = \`KWT/MTC/\${monthRoman}/\${year}\`;`;

const newFunc = `const cetakKwitansiMaleo = async (rekap: any) => {
      // 1. Generate or fetch kwitansi record
      let noKwitansi = "KWT/MTC/TEMP";
      let kwitansiDate = new Date(rekap.createdAt);
      try {
        const record = await generateKwitansiHonor(rekap.id);
        noKwitansi = record.noKwitansi;
        kwitansiDate = new Date(record.tanggal);
      } catch (err) {
        console.error("Gagal generate no kwitansi:", err);
      }

      const win = window.open('', '_blank')
      if (!win) return
      `;

code = code.replace(toReplaceFunc, newFunc);

// Update Date logic inside cetakKwitansiMaleo HTML
code = code.replace(
  "<div>Tanggal : <strong>${new Date(rekap.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>",
  "<div>Tanggal : <strong>${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>"
);

// 4. Update the call in handleAction
code = code.replace(
  "cetakKwitansiMaleo(rekap);",
  "await cetakKwitansiMaleo(rekap);"
);


fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Updated client page to use DB Kwitansi numbering');
