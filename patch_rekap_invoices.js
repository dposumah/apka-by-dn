const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Rename the old cetakInvoiceHonor to cetakKwitansiMaleo and fix arguments
code = code.replace(
  "const cetakInvoiceHonor = (rekap: any, kopType: 'robotik' | 'maleo') => {",
  "const cetakKwitansiMaleo = (rekap: any) => {"
);
code = code.replace(
  '<img src="${kopType === \\\'maleo\\\' ? \\\'/kop-maleo.png\\\' : \\\'/kop-surat.png\\\'}" class="header-img" alt="Kop Surat" />',
  '<img src="/kop-maleo.png" class="header-img" alt="Kop Surat" />'
);

// Add the rate per JP to Kwitansi
code = code.replace(
  "<div class=\"form-value-underline\">${rekap.totalJP} JP</div>",
  "<div class=\"form-value-underline\">${rekap.totalJP} JP</div>\n              </div>\n              <div class=\"form-group\">\n                <div class=\"form-label\">Honor per JP</div>\n                <div class=\"form-colon\">:</div>\n                <div class=\"form-value-underline\">Rp ${(rateHonor).toLocaleString('id-ID')}</div>"
);

// We need to remove the handleCetakInvoice function which was calling cetakInvoiceHonor
code = code.replace(/const handleCetakInvoice = async \([\s\S]*?\}\s*\}\s*\n/, '');

// Now we need to inject cetakInvoiceLama before cetakKwitansiMaleo
const cetakInvoiceLamaCode = `
  const cetakInvoiceLama = (rekap: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(\`
      <html>
        <head>
          <title>Invoice Honorarium - \${rekap.fasilitator?.namaLengkap}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; }
            .header { text-align: center; margin-bottom: 40px; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE HONORARIUM FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> \${rekap.fasilitator?.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> \${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}</p>
              <p><strong>Bulan Laporan:</strong> \${rekap.bulan}</p>
              <p><strong>Tanggal Diajukan:</strong> \${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>Jumlah JP</th>
                <th>Total Honor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Honorarium Fasilitator Bulan \${rekap.bulan}</td>
                <td>\${rekap.totalJP} JP</td>
                <td>Rp \${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colspan="2" class="total">TOTAL TAGIHAN HONORARIUM:</td>
                <td class="total text-emerald-600">Rp \${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> \${rekap.fasilitator?.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${rekap.fasilitator?.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> \${rekap.fasilitator?.namaLengkap}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin-top:40px;">Dicetak oleh: Admin SNT</p>
            </div>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    \`)
    win.document.close()
  }
`;

const cetakIdx = code.indexOf("const cetakKwitansiMaleo = (rekap: any) => {");
code = code.substring(0, cetakIdx) + cetakInvoiceLamaCode + '\n' + code.substring(cetakIdx);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Invoice and Kwitansi updated');
