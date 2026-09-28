const fs = require('fs');

let c = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

const startIdx = c.indexOf('export const getKwitansiHtml =');
if (startIdx !== -1) {
  // Truncate the file at getKwitansiHtml
  c = c.substring(0, startIdx);
  
  const newHtml = `export const getKwitansiHtml = (rekap: any, record: any, type: 'HONOR' | 'TRANSPORT', terbilangRupiah: (n: number) => string) => {
  const kopImage = window.location.origin + '/kop-maleo.png';
  const noKwitansi = record.noKwitansi || 'KWT/TEMP';
  const kwitansiDate = record.tanggal ? new Date(record.tanggal) : new Date();
  const dateFormatted = kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  if (type === 'HONOR') {
    return \`
      <div style="font-family: 'Times New Roman', serif; padding: 40px; min-height: 1123px; box-sizing: border-box;">
        <div style="margin-bottom: 20px;">
          <img src="\${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; color: #1e3a8a; font-family: sans-serif;">KWITANSI</h2>
          <p style="margin: 5px 0 0 0; color: #64748b; font-style: italic;">Tanda Terima Honor Fasilitator</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
          <div>No. Kuitansi : \${noKwitansi}</div>
          <div>Tanggal : \${dateFormatted}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; width: 25%;">Telah terima dari</td>
            <td style="padding: 8px 0; width: 5%;">:</td>
            <td style="padding: 8px 0;">Yayasan Maleo Talenta Cendekia</td>
          </tr>
        </table>
        
        <div style="border: 1px solid #1e3a8a; padding: 15px; margin-bottom: 25px; background-color: #f8fafc;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="font-weight: bold; width: 20%;">Jumlah Uang</td>
              <td style="width: 5%;">:</td>
              <td style="font-weight: bold;">Rp \${record.nominal.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Terbilang</td>
              <td>:</td>
              <td style="font-style: italic;">\${terbilangRupiah(record.nominal)} Rupiah</td>
            </tr>
          </table>
        </div>
        
        <div style="font-size: 14px;">
          <p style="font-weight: bold; margin-bottom: 5px;">Untuk pembayaran :</p>
          <p style="margin-top: 0; margin-bottom: 15px;">Pembayaran honor fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr><td style="width: 35%; padding: 6px 0;">Nama fasilitator</td><td style="width: 5%;">:</td><td style="border-bottom: 1px solid #cbd5e1;">\${rekap.fasilitator?.namaLengkap || '-'}</td></tr>
            <tr><td style="padding: 6px 0;">No. Identitas (KTP/NPWP)</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;"></td></tr>
            <tr><td style="padding: 6px 0;">Nama program/kegiatan</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">Sekolah Nasional Terintegrasi (SNT)</td></tr>
            <tr><td style="padding: 6px 0;">Periode / sesi honor</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">Bulan \${rekap.bulan}</td></tr>
            <tr><td style="padding: 6px 0;">(bulan / tanggal pelaksanaan)</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;"></td></tr>
            <tr><td style="padding: 6px 0;">Jumlah sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">\${rekap.totalJP} JP</td></tr>
            <tr><td style="padding: 6px 0;">Honor per sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">Rp \${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
            <tr><td style="padding: 6px 0;">Lokasi pelaksanaan</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">\${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT : '-'}</td></tr>
          </table>
          
          <p style="font-weight: bold; margin-bottom: 10px;">Rincian potongan (bila ada):</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #cbd5e1;">
            <tr>
              <td style="padding: 10px; width: 60%; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">PPh Pasal 21 (jika ada)</td>
              <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Rp 0</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td style="padding: 10px; border-right: 1px solid #cbd5e1;">Honor diterima bersih</td>
              <td style="padding: 10px;">Rp \${record.nominal.toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; text-align: center; font-size: 14px;">
          <div>
            <p style="margin: 0;">Mengetahui / Menyetujui,</p>
            <br/><br/><br/>
            <p style="margin: 0;">( ______________________________ )</p>
            <p style="margin: 5px 0 0 0; font-style: italic;">Yayasan Maleo Talenta Cendekia</p>
          </div>
          <div>
            <p style="margin: 0;">Yang Menerima Honor,</p>
            <br/><br/><br/>
            <p style="margin: 0; font-weight: bold;">( \${rekap.fasilitator?.namaLengkap || '______________________________'} )</p>
            <p style="margin: 5px 0 0 0; font-style: italic;">Fasilitator</p>
          </div>
        </div>
        
        <div style="margin-top: 40px; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">Catatan:</p>
          <p style="margin: 0 0 3px 0;">• Materai Rp10.000 ditempel bila nominal honor di atas Rp5.000.000.</p>
          <p style="margin: 0;">• Sertakan nomor rekening penerima dan bukti transfer sebagai lampiran, jika pembayaran non-tunai.</p>
        </div>
      </div>
    \`;
  }
  
  return \`
    <div style="font-family: sans-serif; padding: 40px; min-height: 1123px; box-sizing: border-box;">
      <div style="margin-bottom: 30px;">
        <img src="\${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
      </div>
      <div style="text-align: center; margin-bottom: 40px;">
        <h2>KWITANSI</h2>
        <p>Tanda Terima \${type === 'HONOR' ? 'Honor' : 'Transport'} Fasilitator</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>No. Kuitansi : <strong>\${noKwitansi}</strong></div>
        <div>Tanggal : <strong>\${dateFormatted}</strong></div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; width: 200px;">Telah terima dari</td>
          <td style="padding: 10px 0;">: <strong>Yayasan Maleo Talenta Cendekia</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Uang sejumlah</td>
          <td style="padding: 10px 0;">: <span style="background-color: #f1f5f9; padding: 5px 10px; font-style: italic; font-weight: bold;">\${terbilangRupiah(record.nominal)} Rupiah</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; vertical-align: top;">Untuk Pembayaran</td>
          <td style="padding: 10px 0;">: \${record.perihal}</td>
        </tr>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
        <div style="font-size: 1.5em; font-weight: bold; background-color: #f8fafc; padding: 15px 30px; border: 2px solid #e2e8f0; border-radius: 8px;">
          Rp \${record.nominal.toLocaleString('id-ID')}
        </div>
        <div style="text-align: center;">
          <p>Penerima,</p>
          <br/><br/><br/>
          <p><strong>\${rekap.fasilitator?.namaLengkap || 'Penerima'}</strong></p>
        </div>
      </div>
    </div>
  \`;
}
`;
  
  c = c + newHtml;
  fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', c);
}
