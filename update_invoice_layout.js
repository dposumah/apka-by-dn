const fs = require('fs');

let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// Replace everything between <div style="display: flex ...> and </table> for the Invoice table
const regex = /<div style="display: flex; justify-content: space-between; margin-bottom: 20px;">[\s\S]*?<\/table>/;
const newHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <tr><td style="width: 30%; padding: 6px 0;">Nama program/kegiatan</td><td style="width: 5%">:</td><td style="width: 65%; border-bottom: 1px solid #000;">Sekolah Nasional Terintegrasi (SNT)</td></tr>
        <tr><td style="padding: 6px 0;">Periode / sesi honor</td><td>:</td><td style="border-bottom: 1px solid #000;">Bulan \${rekap.bulan}</td></tr>
        <tr><td style="padding: 6px 0;">Jumlah sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">\${rekap.totalJP} JP</td></tr>
        <tr><td style="padding: 6px 0;">Honor per JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp \${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
        <tr><td style="padding: 6px 0;">Honor per sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp \${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
        <tr><td style="padding: 6px 0;">Lokasi pelaksanaan</td><td>:</td><td style="border-bottom: 1px solid #000;">\${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT : '-'}</td></tr>
      </table>
      <div style="margin-bottom: 30px; font-size: 14px;">
        <p style="font-weight: bold; text-decoration: underline; margin-bottom: 15px;">Rincian potongan (bila ada):</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="width: 35%; padding: 5px 0;">PPh Pasal 21 (jika ada)</td><td>Rp 0</td></tr>
          <tr><td style="padding: 15px 0; font-weight: bold;">Honor diterima bersih</td><td style="font-weight: bold; font-size: 1.1em;">Rp \${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td></tr>
        </table>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 14px;">
        <div>
          <p style="margin: 0;">Mengetahui / Menyetujui,</p>
          <p style="font-weight: bold; margin: 5px 0 0 0;">Yayasan Maleo Talenta Cendekia</p>
        </div>
        <div>
          <p style="margin: 0;">Yang Menerima Honor,</p>
          <p style="font-weight: bold; margin: 5px 0 0 0;">Fasilitator</p>
          <br/><br/><br/>
          <p style="font-weight: bold; margin: 0;">\${rekap.fasilitator?.namaLengkap}</p>
        </div>
      </div>
`;

c = c.replace(regex, newHtml);

// Remove the old TTD at the bottom of the invoice if there is one
c = c.replace(/<div style="margin-top: 50px; text-align: right;">[\s\S]*?<\/div>\s*<\/div>\s*`;/g, '</div>\n  `;');

// Fix page breaks: remove page-break-after: always;
c = c.replace(/page-break-after: always;/g, '');

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', c);
