export const getInvoiceHtml = (rekap: any, kopType: 'maleo' | 'robotic') => {
  const kopImage = kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png';
  return `
    <div style="font-family: sans-serif; padding: 40px; page-break-after: always; min-height: 297mm; box-sizing: border-box;">
      <div style="margin-bottom: 30px;">
        <img src="${kopImage}" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
      </div>
      <div style="text-align: center; margin-bottom: 40px;">
        <h2>INVOICE HONORARIUM FASILITATOR</h2>
        <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p><strong>Nama Fasilitator:</strong> ${rekap.fasilitator?.namaLengkap}</p>
          <p><strong>Lokasi SNT:</strong> ${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}</p>
          <p><strong>Bulan Laporan:</strong> ${rekap.bulan}</p>
          <p><strong>Tanggal Diajukan:</strong> ${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Keterangan</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Jumlah JP</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Total Honor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">Honorarium Fasilitator Bulan ${rekap.bulan}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">${rekap.totalJP} JP</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td colspan="2" style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; font-size: 1.2em;">TOTAL TAGIHAN HONORARIUM:</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold; font-size: 1.2em;">Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 50px; text-align: right;">
        <p>Mengetahui,</p>
        <br/><br/><br/>
        <p><strong>${rekap.fasilitator?.namaLengkap}</strong></p>
        <p>Fasilitator SNT</p>
      </div>
    </div>
  `;
}

export const getKwitansiHtml = (rekap: any, record: any, type: 'HONOR' | 'TRANSPORT', terbilangRupiah: (n: number) => string) => {
  const kopImage = '/kop-maleo.png';
  const noKwitansi = record.noKwitansi || 'KWT/TEMP';
  const kwitansiDate = record.tanggal ? new Date(record.tanggal) : new Date();
  
  return `
    <div style="font-family: sans-serif; padding: 40px; page-break-after: always; min-height: 297mm; box-sizing: border-box;">
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
