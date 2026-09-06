const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8')

const targetHTML = `          <div class="header">
            <h2>INVOICE HONORARIUM FASILITATOR</h2>
            <p>Proyek SNT 2026</p>
          </div>
          <p><strong>Nama Fasilitator:</strong> \${rekap.fasilitator.namaLengkap}</p>
          <p><strong>Lokasi SNT:</strong> \${rekap.fasilitator.lokasiSNT || '-'}</p>
          <p><strong>Bulan Laporan:</strong> \${rekap.bulan}</p>
          <p><strong>Tanggal Diajukan:</strong> \${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>`

const replacementHTML = `          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE HONORARIUM FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> \${rekap.fasilitator.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> \${rekap.fasilitator.lokasiSNT || '-'}</p>
              <p><strong>Bulan Laporan:</strong> \${rekap.bulan}</p>
              <p><strong>Tanggal Diajukan:</strong> \${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div style="text-align: right; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> \${rekap.fasilitator.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> \${rekap.fasilitator.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> \${rekap.fasilitator.namaLengkap}</p>
            </div>
          </div>`

code = code.replace(targetHTML, replacementHTML)

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code)
