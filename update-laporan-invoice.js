const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', 'utf8')

// The HTML template starts at: win.document.write(`\n      <html>
const targetHTML = `          <div class="header">
            <h2>INVOICE TRANSPORT FASILITATOR</h2>
            <p>Proyek SNT 2026</p>
          </div>
          <p><strong>Nama Fasilitator:</strong> \${lap.fasilitator.namaLengkap}</p>
          <p><strong>Lokasi SNT:</strong> \${lap.fasilitator.lokasiSNT || '-'}</p>
          <p><strong>Tanggal Laporan:</strong> \${new Date(lap.date).toLocaleDateString('id-ID')}</p>`

const replacementHTML = `          <div style="margin-bottom: 30px;">
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
              <p><strong>Tanggal Laporan:</strong> \${new Date(lap.date).toLocaleDateString('id-ID')}</p>
            </div>
            <div style="text-align: right; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> \${lap.fasilitator.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${lap.fasilitator.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> \${lap.fasilitator.namaLengkap}</p>
            </div>
          </div>`

code = code.replace(targetHTML, replacementHTML)

fs.writeFileSync('src/app/(snt)/fasilitator/laporan/client-page.tsx', code)
