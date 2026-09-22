const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

const oldLogic = `      let noKwitansi = "KWT/MTC/TEMP";
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
      if (!win) return`;

const newLogic = `      // Open window immediately to avoid popup blocker
      const win = window.open('', '_blank');
      if (!win) return;
      
      // Write loading state
      win.document.write("<html><body><h3>Menghubungkan ke Google Sheets...</h3></body></html>");

      let noKwitansi = "KWT/MTC/TEMP";
      let kwitansiDate = new Date(rekap.createdAt);
      
      try {
        const record = await generateKwitansiHonor(rekap.id);
        noKwitansi = record.noKwitansi;
        kwitansiDate = new Date(record.tanggal);
      } catch (err: any) {
        console.error("Gagal generate no kwitansi:", err);
        win.close();
        alert(err.message || "Gagal menghubungi Google Sheets");
        return;
      }
      
      // Clear loading state
      win.document.open();
`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Fixed popup blocker');
