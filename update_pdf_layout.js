const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// 1. Make header stack vertically
const oldHeader = `<div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p><strong>Nama Fasilitator:</strong> \${rekap.fasilitator?.namaLengkap}</p>
            <p><strong>Lokasi (SNT):</strong> \${rekap.fasilitator?.lokasiSNT || '-'}</p>
            <p><strong>Bulan Laporan:</strong> \${formatBulan(rekap.bulan)}</p>
          </div>
          <div>
            
            <p><strong>Total JP (Intra + Ekstra):</strong> \${rekap.totalJP} JP</p>
          </div>
        </div>`;

const newHeader = `<div style="margin-bottom: 20px; font-size: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 25%; padding: 4px 0;"><strong>Nama Fasilitator</strong></td><td>:</td><td>\${rekap.fasilitator?.namaLengkap}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Lokasi (SNT)</strong></td><td>:</td><td>\${rekap.fasilitator?.lokasiSNT || '-'}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Bulan Laporan</strong></td><td>:</td><td>\${formatBulan(rekap.bulan)}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Total JP (Intra + Ekstra)</strong></td><td>:</td><td>\${rekap.totalJP} JP</td></tr>
          </table>
        </div>`;
file = file.replace(oldHeader, newHeader);


// 2. Change Yayasan to dynamic based on kopType in Invoice
file = file.replace(
  '<p style="font-weight: bold; margin: 5px 0 0 0;">Yayasan Maleo Talenta Cendekia</p>',
  '<p style="font-weight: bold; margin: 5px 0 0 0;">${kopType === \'maleo\' ? \'Yayasan Maleo Talenta Cendekia\' : \'PT Jully Tjindrawan Robotik\'}</p>'
);

// 3. Decrease some margins to fit on 1 page
file = file.replace('margin-top: 50px;', 'margin-top: 30px;');
file = file.replace('margin-bottom: 30px;', 'margin-bottom: 15px;');

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
console.log('PDF updated for neat header and dynamic Yayasan');
