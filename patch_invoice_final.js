const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8');

const startStr = "const cetakInvoiceTransport = (lap: any) => {";
const endStr = "win.document.close()\n  }";
const altEndStr = "win.document.close()\r\n  }";

const startIndex = code.indexOf(startStr);
let endIndex = code.indexOf(endStr, startIndex);
if (endIndex === -1) {
  endIndex = code.indexOf(altEndStr, startIndex);
  if (endIndex !== -1) endIndex += altEndStr.length;
} else {
  endIndex += endStr.length;
}

if (startIndex !== -1 && endIndex !== -1) {
  const newCetakStr = `const cetakInvoiceTransport = (lap: any) => {
    // Cari semua laporan pada tanggal yang sama untuk fasilitator ini
    const sameDayReports = initialData.filter(r => 
      r.fasilitatorId === lap.fasilitatorId && 
      new Date(r.date).toDateString() === new Date(lap.date).toDateString()
    );

    // Generate Invoice PDF
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(\`
      <html>
        <head>
          <title>Invoice Transport - \${lap.fasilitator.namaLengkap}</title>
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
            <h2>INVOICE TRANSPORT FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> \${lap.fasilitator.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> \${lap.fasilitator.lokasiSNT || '-'}</p>
              <p><strong>Tanggal Laporan:</strong> \${new Date(lap.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Deskripsi / Topik</th>
                <th>Tingkat</th>
                <th>JP</th>
                <th>Biaya Transport</th>
              </tr>
            </thead>
            <tbody>
              \${sameDayReports.map((r: any, i: number) => \`
                <tr>
                  <td>
                    \${r.topic} <br/>
                    <small style="color: #64748b;">\${r.jumlahJPIntra > 0 ? 'Intrakurikuler' : 'Ekstrakurikuler'}</small>
                  </td>
                  <td>\${r.tingkatSekolah} <br/><small>\${r.metodePelaksanaan}</small></td>
                  <td>\${(r.jumlahJPIntra || 0) + (r.jumlahJPEkstra || 0)}</td>
                  \${i === 0 ? \`<td rowspan="\${sameDayReports.length}">Rp \${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')} <br/><small>(Darat: Rp \${(lap.biayaTransport || 0).toLocaleString('id-ID')} | Laut: Rp \${(lap.biayaTransportLaut || 0).toLocaleString('id-ID')})</small></td>\` : ''}
                </tr>
              \`).join('')}
              <tr>
                <td colspan="3" class="total">TOTAL TAGIHAN TRANSPORT:</td>
                <td class="total text-emerald-600">Rp \${((lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0)).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> \${lap.fasilitator.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${lap.fasilitator.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> \${lap.fasilitator.namaLengkap}</p>
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
  }`;
  
  code = code.substring(0, startIndex) + newCetakStr + code.substring(endIndex);
  fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code);
  console.log('Successfully updated cetakInvoiceTransport');
} else {
  console.log('Failed to find bounds:', startIndex, endIndex);
}
