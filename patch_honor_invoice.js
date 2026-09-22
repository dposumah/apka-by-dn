const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

if (!code.includes('terbilangRupiah')) {
  code = code.replace("import { formatCurrency } from '@/lib/format'", "import { formatCurrency, terbilangRupiah } from '@/lib/format'");
}

const startStr = "const cetakInvoiceHonor = (rekap: any) => {";
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
  const newCetakStr = `const cetakInvoiceHonor = (rekap: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    
    // Konversi angka bulan jadi romawi untuk No Kuitansi
    const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    const d = new Date(rekap.createdAt);
    const monthRoman = romanMonths[d.getMonth()] || 'I';
    const year = d.getFullYear();
    const noKwitansi = \`KWT/MTC/\${monthRoman}/\${year}\`;
    const rateHonor = rekap.totalJP > 0 ? (rekap.totalHonor / rekap.totalJP) : 0;
    
    win.document.write(\`
      <html>
        <head>
          <title>Kwitansi Honor - \${rekap.fasilitator.namaLengkap}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.5; font-size: 14px; }
            .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 20px; }
            .title-box { text-align: center; margin-bottom: 30px; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
            .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-col { width: 48%; }
            .form-group { margin-bottom: 12px; display: flex; }
            .form-label { width: 220px; font-weight: normal; }
            .form-colon { width: 20px; }
            .form-value { flex: 1; font-weight: bold; }
            .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
            .terbilang-box { background-color: #f1f5f9; padding: 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
            .section-title { font-weight: bold; margin: 20px 0 10px 0; text-decoration: underline; }
            
            .ttd-container { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
            .ttd-box { width: 250px; }
            .ttd-name { margin-top: 70px; font-weight: bold; text-decoration: underline; }
            
            .notes { margin-top: 40px; font-size: 12px; }
          </style>
        </head>
        <body>
          <img src="/kop-surat.png" class="header-img" alt="Kop Surat" />
          
          <div class="title-box">
            <h2>KWITANSI</h2>
            <p>Tanda Terima Honor Fasilitator</p>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>\${noKwitansi}</strong></div>
            <div>Tanggal : <strong>\${new Date(rekap.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Telah terima dari</div>
            <div class="form-colon">:</div>
            <div class="form-value-underline">Yayasan Maleo Talenta Cendekia</div>
          </div>
          
          <div class="form-group" style="margin-top: 20px;">
            <div class="form-label">Jumlah Uang</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-size: 16px;">Rp \${rekap.totalHonor.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Terbilang</div>
            <div class="form-colon">:</div>
            <div class="form-value terbilang-box">\${terbilangRupiah(rekap.totalHonor)}</div>
          </div>
          
          <div class="form-group" style="margin-top: 20px;">
            <div class="form-label">Untuk pembayaran</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-weight: normal;">Pembayaran honor fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</div>
          </div>
          
          <div style="margin-left: 20px;">
            <div class="form-group">
              <div class="form-label">Nama fasilitator</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">\${rekap.fasilitator.namaLengkap}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">No. Identitas (KTP/NPWP)</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">\${rekap.fasilitator.npwpNik || '-'}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Nama program/kegiatan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Sekolah Nasional Terintegrasi (SNT)</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Periode / sesi honor</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Bulan \${rekap.bulan}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Jumlah sesi / JP</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">\${rekap.totalJP} JP</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Honor per sesi / JP</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Rp \${rateHonor.toLocaleString('id-ID')}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Lokasi pelaksanaan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">\${rekap.fasilitator.lokasiSNT || '-'}</div>
            </div>
          </div>
          
          <div class="section-title">Rincian potongan (bila ada):</div>
          <div class="form-group">
            <div class="form-label" style="width: 200px;">PPh Pasal 21 (jika ada)</div>
            <div class="form-value" style="font-weight: normal;">Rp 0</div>
          </div>
          <div class="form-group">
            <div class="form-label" style="width: 200px; font-weight: bold;">Honor diterima bersih</div>
            <div class="form-value" style="font-size: 16px;">Rp \${rekap.totalHonor.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="ttd-container">
            <div class="ttd-box">
              <div>Mengetahui / Menyetujui,</div>
              <div style="font-weight: bold;">Yayasan Maleo Talenta Cendekia</div>
              <div class="ttd-name">( ______________________________ )</div>
            </div>
            
            <div class="ttd-box">
              <div>Yang Menerima Honor,</div>
              <div style="font-weight: bold;">Fasilitator</div>
              <div class="ttd-name">( \${rekap.fasilitator.namaLengkap} )</div>
            </div>
          </div>
          
          <div class="notes">
            <strong>Catatan:</strong><br/>
            • Materai Rp10.000 ditempel bila nominal honor di atas Rp5.000.000.<br/>
            • Bank: \${rekap.fasilitator.bankName || '-'} | No. Rek: \${rekap.fasilitator.bankAccount || '-'}
          </div>
          
          <script>window.print()</script>
        </body>
      </html>
    \`)
    win.document.close()
  }`;

  code = code.substring(0, startIndex) + newCetakStr + code.substring(endIndex);
  fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
  console.log('Successfully updated cetakInvoiceHonor');
} else {
  console.log('Failed to find bounds:', startIndex, endIndex);
}
