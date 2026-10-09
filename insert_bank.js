const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

// Insert Bank Info
const bankInfoHtml = `
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
              <td>\${rekap.fasilitator?.bankName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Nomor Rekening</td>
              <td>:</td>
              <td>\${rekap.fasilitator?.bankAccount || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Atas Nama</td>
              <td>:</td>
              <td>\${rekap.fasilitator?.namaLengkap || '-'}</td>
            </tr>
          </table>
`;

file = file.replace(
  '<div style="margin-bottom: 30px; font-size: 14px;">\n          <p style="font-weight: bold; text-decoration: underline; margin-bottom: 15px;">Rincian potongan (bila ada):</p>',
  bankInfoHtml + '<div style="margin-bottom: 30px; font-size: 14px;">\n          <p style="font-weight: bold; text-decoration: underline; margin-bottom: 15px;">Rincian potongan (bila ada):</p>'
);

file = file.replace(
  '              \n            <p style="font-weight: bold; margin-bottom: 10px;">Rincian potongan (bila ada):</p>',
  bankInfoHtml + '\n            <p style="font-weight: bold; margin-bottom: 10px;">Rincian potongan (bila ada):</p>'
);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
console.log("Bank info inserted!");
