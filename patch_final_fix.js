const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8');

// Convert CRLF to LF for easier manipulation
code = code.replace(/\r\n/g, '\n');

// 1. Make handlePrintWithKop async
code = code.replace(
  "const handlePrintWithKop = (docType: 'invoice' | 'kwitansi') => {",
  "const handlePrintWithKop = async (docType: 'invoice' | 'kwitansi') => {"
);

code = code.replace(
  "cetakKwitansiMaleo(selectedRekap);",
  "await cetakKwitansiMaleo(selectedRekap);"
);

// 2. Add generateKwitansiHonor import
if (!code.includes('generateKwitansiHonor')) {
  code = code.replace(
    "import { createRekapManual, deleteRekap } from '@/app/actions/rekap'",
    "import { createRekapManual, deleteRekap, generateKwitansiHonor } from '@/app/actions/rekap'"
  );
}

// 3. Completely replace the cetakKwitansiMaleo function
const startIndex = code.indexOf('const cetakKwitansiMaleo =');
const endIndex = code.indexOf('return (', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newFunc = `const cetakKwitansiMaleo = async (rekap: any) => {
      // 1. Buka popup langsung (sinkron) agar tidak diblokir browser!
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write("<html><body><h2 style='font-family:sans-serif; text-align:center; margin-top:50px;'>Menghubungkan ke Google Sheets...</h2></body></html>");
      
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
      
      // 2. Clear tulisan loading
      win.document.open();
      
      const rateHonor = rekap.totalJP > 0 ? (rekap.totalHonor / rekap.totalJP) : 0;
      
      win.document.write(\`
        <html>
          <head>
            <title>Kwitansi Honor - \${rekap.fasilitator.namaLengkap}</title>
            <style>
              @page { margin: 0.5cm 1cm; }
              @media print { body { padding: 0; } }
              body { font-family: 'Times New Roman', Times, serif; padding: 10px 40px; line-height: 1.5; font-size: 14px; }
              .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px; }
              .title-box { text-align: center; margin-bottom: 15px; }
              .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
              .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .info-col { width: 48%; }
              .form-group { margin-bottom: 8px; display: flex; }
              .form-label { width: 220px; font-weight: normal; }
              .form-colon { width: 20px; }
              .form-value { flex: 1; font-weight: bold; }
              .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
              .terbilang-box { background-color: #f1f5f9; padding: 6px 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
              .section-title { font-weight: bold; margin: 20px 0 10px 0; text-decoration: underline; }
              
              .ttd-container { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
              .ttd-box { width: 250px; }
              .ttd-name { margin-top: 50px; font-weight: bold; text-decoration: underline; }
              
              .notes { margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <img src="/kop-maleo.png" class="header-img" alt="Kop Surat" />
            
            <div class="title-box">
              <h2>KWITANSI</h2>
              <p>Tanda Terima Honor Fasilitator</p>
            </div>
            
            <div class="info-row">
              <div>No. Kuitansi : <strong>\${noKwitansi}</strong></div>
              <div>Tanggal : <strong>\${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Telah terima dari</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Yayasan Maleo Talenta Cendekia</div>
            </div>
            
            <div class="form-group" style="margin-top: 10px;">
              <div class="form-label">Jumlah Uang</div>
              <div class="form-colon">:</div>
              <div class="form-value" style="font-size: 16px;">Rp \${rekap.totalHonor.toLocaleString('id-ID')}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Terbilang</div>
              <div class="form-colon">:</div>
              <div class="form-value terbilang-box">\${terbilangRupiah(rekap.totalHonor)}</div>
            </div>

            <div class="section-title">Untuk Pembayaran:</div>
            <div style="padding-left: 20px;">
              <div class="form-group">
                <div class="form-label" style="width: 180px;">Nama program/kegiatan</div>
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
                <div class="form-value-underline">\${rekap.jumlahSesi || 4} (pertemuan dalam 1 bulan) / \${rekap.totalJP} JP</div>
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
                <p>Mengetahui / Menyetujui,</p>
                <p><strong>Yayasan Maleo Talenta Cendekia</strong></p>
                <p class="ttd-name">....................................................</p>
              </div>
              <div class="ttd-box">
                <p>Yang Menerima Honor,</p>
                <p><strong>Fasilitator</strong></p>
                <p class="ttd-name">\${rekap.fasilitator.namaLengkap}</p>
              </div>
            </div>
            
            <div class="notes">
              <p><em>* Dokumen ini dibuat dan dicetak secara otomatis oleh sistem SNT.</em></p>
            </div>
            <script>window.print()</script>
          </body>
        </html>
      \`);
      win.document.close();
    }
  
    `;
    code = code.substring(0, startIndex) + newFunc + code.substring(endIndex);
}

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code);
console.log('Successfully replaced cetakKwitansiMaleo!');
