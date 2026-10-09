const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

file = file.replace(
  '<tr><td style="padding: 6px 0;">Honor per sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp ${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString(\'id-ID\')}</td></tr>',
  '<tr><td style="padding: 6px 0;">Total Honor</td><td>:</td><td style="border-bottom: 1px solid #000; font-weight: bold;">Rp ${(rekap.totalHonor || 0).toLocaleString(\'id-ID\')}</td></tr>'
);

file = file.replace(
  '<tr><td style="padding: 6px 0;">Honor per sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">Rp ${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString(\'id-ID\')}</td></tr>',
  '<tr><td style="padding: 6px 0;">Total Honor</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1; font-weight: bold;">Rp ${(rekap.totalHonor || 0).toLocaleString(\'id-ID\')}</td></tr>'
);

// Add Bank info if available
file = file.replace(
  '</table>\n          <div style="margin-bottom: 30px; font-size: 14px;">',
  `</table>
          <br/>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="width: 35%; padding: 6px 0; font-weight: bold;">Informasi Rekening Pembayaran:</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Nama Bank</td>
              <td>:</td>
              <td>\${rekap.fasilitator?.namaBank || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Nomor Rekening</td>
              <td>:</td>
              <td>\${rekap.fasilitator?.noRekening || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Atas Nama</td>
              <td>:</td>
              <td>\${rekap.fasilitator?.namaPemilikRekening || '-'}</td>
            </tr>
          </table>
          <div style="margin-bottom: 30px; font-size: 14px;">`
);

file = file.replace(
  '</table>\n              \n              <div style="margin-bottom: 30px; font-size: 14px;">',
  `</table>
              <br/>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                  <td style="width: 35%; padding: 6px 0; font-weight: bold;">Informasi Rekening Pembayaran:</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Nama Bank</td>
                  <td>:</td>
                  <td>\${rekap.fasilitator?.namaBank || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Nomor Rekening</td>
                  <td>:</td>
                  <td>\${rekap.fasilitator?.noRekening || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Atas Nama</td>
                  <td>:</td>
                  <td>\${rekap.fasilitator?.namaPemilikRekening || '-'}</td>
                </tr>
              </table>
              <div style="margin-bottom: 30px; font-size: 14px;">`
);


fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
console.log('PDF generator updated');
