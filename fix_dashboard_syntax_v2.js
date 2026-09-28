const fs = require('fs');

function rewriteFunctions(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  const getInvoiceHtmlPattern = /const getInvoiceHtml = \(expense: any, kopType: string\) => \{[\s\S]*?const getKwitansiHtml =/g;
  
  const newInvoice = `const getInvoiceHtml = (expense: any, kopType: string) => {
    const kopImage = window.location.origin + (kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png');
    return \`
      <div style="padding: 40px; font-family: sans-serif; page-break-after: always; width: 100%; box-sizing: border-box;">
        <div style="margin-bottom: 30px;">
          <img src="\${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
        </div>
        <div style="text-align: center; margin-bottom: 40px;">
          <h2>INVOICE PENGELUARAN LAPANGAN</h2>
          <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p><strong>Item RAB:</strong> \${expense.rabItem.name}</p>
            \${expense.fasilitator ? \`<p><strong>Nama Fasilitator:</strong> \${expense.fasilitator.namaLengkap}</p>\` : ''}
            <p><strong>Tanggal Diajukan:</strong> \${new Date(expense.createdAt).toLocaleDateString('id-ID')}</p>
            <p><strong>Status:</strong> \${expense.status}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Deskripsi</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">\${expense.description}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">\${formatCurrency(expense.amount)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; font-size: 1.2em;">TOTAL:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold; font-size: 1.2em;">\${formatCurrency(expense.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    \`;
  }
  
  const getKwitansiHtml =`;

  c = c.replace(getInvoiceHtmlPattern, newInvoice);
  
  const getKwitansiHtmlPattern = /const getKwitansiHtml = \(expense: any, record: any\) => \{[\s\S]*?<p style="margin-top: 50px;">[\s\S]*?\(_____________________\)[\s\S]*?<\/p>[\s\S]*?<\/div>[\s\S]*?<\/div>(\s*`;\s*})?(\s*})?/g;
  
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
  }`;
  
  c = c.replace(getKwitansiHtmlPattern, newKwitansi);
  fs.writeFileSync(file, c);
}

rewriteFunctions('src/app/(snt)/dashboard-rab/client-page.tsx');
rewriteFunctions('src/app/(snt)/pengeluaran/form.tsx');
