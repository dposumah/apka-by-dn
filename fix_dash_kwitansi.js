const fs = require('fs');

let c = fs.readFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', 'utf8');

const getKwitansiStart = c.indexOf('const getKwitansiHtml = (expense: any, record: any) => {');
const handlePrintStart = c.indexOf('const handlePrint = async () => {');
const handlePrintDokumenStart = c.indexOf('const handlePrintDokumen = async () => {');

const getKwitansiEnd = handlePrintDokumenStart !== -1 ? handlePrintDokumenStart : handlePrintStart;

if (getKwitansiStart !== -1 && getKwitansiEnd !== -1) {
  const before = c.substring(0, getKwitansiStart);
  const after = c.substring(getKwitansiEnd);
  
  const newKwitansi = `const getKwitansiHtml = (expense: any, record: any) => {
    const kwitansiDate = record.tanggal ? new Date(record.tanggal) : new Date();
    return \`
      <div style="padding: 40px; font-family: sans-serif; page-break-after: always; width: 100%; box-sizing: border-box;">
        <div style="margin-bottom: 30px;">
          <img src="\${window.location.origin}/kop-maleo.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
        </div>
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h2 style="font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">KWITANSI</h2>
          <p style="margin: 5px 0 0 0;">No: \${record.noKwitansi || 'KWT/TEMP'}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="width: 30%; padding: 10px 0;"><strong>Telah terima dari</strong></td>
            <td style="width: 5%; text-align: center;">:</td>
            <td style="width: 65%; padding: 10px 0;">Yayasan Maleo Talenta Cendekia</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>Uang sejumlah</strong></td>
            <td style="text-align: center;">:</td>
            <td style="padding: 10px 0; font-style: italic;">\${terbilangRupiah(expense.amount)} Rupiah</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>Untuk pembayaran</strong></td>
            <td style="text-align: center;">:</td>
            <td style="padding: 10px 0;">\${expense.description} - \${expense.rabItem.name}</td>
          </tr>
        </table>
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px; font-size: 20px; font-weight: bold;">
            \${formatCurrency(expense.amount)}
          </div>
          <div style="text-align: center;">
            <p style="margin: 0 0 10px 0;">Tanggal: \${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Penerima,</p>
            <p style="margin-top: 50px;">
              <br/><br/>
              (\${expense.fasilitator ? expense.fasilitator.namaLengkap : '_____________________'})
            </p>
          </div>
        </div>
      </div>
    \`;
  }
  
  `;
  
  c = before + newKwitansi + after;
  fs.writeFileSync('src/app/(snt)/dashboard-rab/client-page.tsx', c);
}
