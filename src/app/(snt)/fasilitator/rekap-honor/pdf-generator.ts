export const getInvoiceHtml = (rekap: any, kopType: 'maleo' | 'robotic') => {
  const kopImage = window.location.origin + (kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png');
  return `
    <div style="font-family: sans-serif; padding: 40px;  min-height: 1123px; box-sizing: border-box;">
      <div style="margin-bottom: 30px;">
        <img src="${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
      </div>
      <div style="text-align: center; margin-bottom: 40px;">
        <h2>INVOICE HONORARIUM FASILITATOR</h2>
        <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <tr><td style="width: 30%; padding: 6px 0;">Nama program/kegiatan</td><td style="width: 5%">:</td><td style="width: 65%; border-bottom: 1px solid #000;">Sekolah Nasional Terintegrasi (SNT)</td></tr>
        <tr><td style="padding: 6px 0;">Periode / sesi honor</td><td>:</td><td style="border-bottom: 1px solid #000;">Bulan ${rekap.bulan}</td></tr>
        <tr><td style="padding: 6px 0;">Jumlah sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">${rekap.totalJP} JP</td></tr>
        <tr><td style="padding: 6px 0;">Honor per JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp ${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
        <tr><td style="padding: 6px 0;">Honor per sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp ${(Math.round(rekap.totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
        <tr><td style="padding: 6px 0;">Lokasi pelaksanaan</td><td>:</td><td style="border-bottom: 1px solid #000;">${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT : '-'}</td></tr>
      </table>
      <div style="margin-bottom: 30px; font-size: 14px;">
        <p style="font-weight: bold; text-decoration: underline; margin-bottom: 15px;">Rincian potongan (bila ada):</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="width: 35%; padding: 5px 0;">PPh Pasal 21 (jika ada)</td><td>Rp 0</td></tr>
          <tr><td style="padding: 15px 0; font-weight: bold;">Honor diterima bersih</td><td style="font-weight: bold; font-size: 1.1em;">Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td></tr>
        </table>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 14px;">
        <div>
          <p style="margin: 0;">Mengetahui / Menyetujui,</p>
          <p style="font-weight: bold; margin: 5px 0 0 0;">Yayasan Maleo Talenta Cendekia</p>
        </div>
        <div>
          <p style="margin: 0;">Yang Menerima Honor,</p>
          <p style="font-weight: bold; margin: 5px 0 0 0;">Fasilitator</p>
          <br/><br/><br/>
          <p style="font-weight: bold; margin: 0;">${rekap.fasilitator?.namaLengkap}</p>
        </div>
      </div>

      </div>
  `;
}

export const getKwitansiHtml = (rekap: any, record: any, type: 'HONOR' | 'TRANSPORT', terbilangRupiah: (n: number) => string) => {
  const kopImage = window.location.origin + '/kop-maleo.png';
  const noKwitansi = record.noKwitansi || 'KWT/TEMP';
  const kwitansiDate = record.tanggal ? new Date(record.tanggal) : new Date();
  
  return `
    <div style="font-family: sans-serif; padding: 40px;  min-height: 1123px; box-sizing: border-box;">
      <div style="margin-bottom: 30px;">
        <img src="${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
      </div>
      <div style="text-align: center; margin-bottom: 40px;">
        <h2>KWITANSI</h2>
        <p>Tanda Terima ${type === 'HONOR' ? 'Honor' : 'Transport'} Fasilitator</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
        <div>Tanggal : <strong>${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; width: 200px;">Telah terima dari</td>
          <td style="padding: 10px 0;">: <strong>Yayasan Maleo Talenta Cendekia</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Uang sejumlah</td>
          <td style="padding: 10px 0;">: <span style="background-color: #f1f5f9; padding: 5px 10px; font-style: italic; font-weight: bold;">${terbilangRupiah(record.nominal)} Rupiah</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; vertical-align: top;">Untuk Pembayaran</td>
          <td style="padding: 10px 0;">: ${record.perihal}</td>
        </tr>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
        <div style="font-size: 1.5em; font-weight: bold; background-color: #f8fafc; padding: 15px 30px; border: 2px solid #e2e8f0; border-radius: 8px;">
          Rp ${record.nominal.toLocaleString('id-ID')}
        </div>
        <div style="text-align: center;">
          <p>Penerima,</p>
          <br/><br/><br/>
          <p><strong>${rekap.fasilitator?.namaLengkap || 'Penerima'}</strong></p>
        </div>
      </div>
    </div>
  `;
}
