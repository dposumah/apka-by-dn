import { hitungTotalTransportRekap, hitungDetailTransportRekap } from '@/lib/transport';

export const getInvoiceHtml = (rekap: any, kopType: 'maleo' | 'robotic', invoiceRecord?: any) => {
  const kopImage = window.location.origin + (kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png');
  
  const noInvoiceStr = invoiceRecord ? invoiceRecord.noInvoice : '';
  const tanggalInvoice = invoiceRecord ? new Date(invoiceRecord.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '';

  const formatBulan = (bulan: string) => {
    if (!bulan) return '-';
    const [year, month] = bulan.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[parseInt(month, 10) - 1] || month;
    return `${monthName} ${year}`;
  };
  
  // Hitung detail & total transport
  const detailTransport = hitungDetailTransportRekap(rekap);
  const totalTransport = detailTransport.totalTransport;

  const totalHonor = rekap.totalHonor || 0;
  const totalKeseluruhan = totalHonor + totalTransport;
  
  return `
    <div style="font-family: sans-serif; padding: 0 0 40px 0; min-height: 1123px; page-break-after: always; box-sizing: border-box; background-color: #ffffff;">
      <div style="margin-bottom: 15px;">
        <img src="${kopImage}" style="width: 100%; max-height: 140px; object-fit: fill;" alt="Kop Surat" />
      </div>
      <div style="padding: 0 50px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2>${totalTransport > 0 ? 'INVOICE HONORARIUM & TRANSPORT' : 'INVOICE HONORARIUM'}</h2>
          ${noInvoiceStr ? `<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>No Invoice:</strong> ${noInvoiceStr}</div>` : ''}
          ${tanggalInvoice ? `<div style="text-align: center; margin-top: 5px; font-size: 14px;"><strong>Tanggal:</strong> ${tanggalInvoice}</div>` : ''}
          <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
        </div>
        
        <p style="margin-top: 0; margin-bottom: 12px; font-size: 14px;">Pembayaran honorarium ${totalTransport > 0 ? 'dan transport ' : ''}fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="width: 32%; padding: 5px 0;">Nama fasilitator</td><td style="width: 3%;">:</td><td style="width: 65%; border-bottom: 1px solid #000;">${rekap.fasilitator?.namaLengkap || '-'}</td></tr>
          <tr><td style="padding: 5px 0;">Nama program/kegiatan</td><td>:</td><td style="border-bottom: 1px solid #000;">KKA Sekolah Nasional Terintegrasi (SNT)</td></tr>
          <tr><td style="padding: 5px 0;">Periode / sesi honor</td><td>:</td><td style="border-bottom: 1px solid #000;">${formatBulan(rekap.bulan)}</td></tr>
          <tr><td style="padding: 5px 0;">Jumlah sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #000;">${(rekap.totalJPIntra > 0 && rekap.totalJPEkstra > 0) ? `${rekap.totalJP} JP (Intra: ${rekap.totalJPIntra} JP + Ekstra: ${rekap.totalJPEkstra} JP)` : `${rekap.totalJP} JP`}</td></tr>
          <tr><td style="padding: 5px 0;">Honor per JP</td><td>:</td><td style="border-bottom: 1px solid #000;">Rp ${(Math.round(totalHonor / (rekap.totalJP || 1))).toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 5px 0;">Subtotal Honor</td><td>:</td><td style="border-bottom: 1px solid #000; font-weight: bold;">Rp ${totalHonor.toLocaleString('id-ID')}</td></tr>
          <tr>
            <td style="padding: 5px 0; vertical-align: top;">Bantuan Biaya Transport</td>
            <td style="vertical-align: top;">:</td>
            <td style="border-bottom: 1px solid #000;">
              <span style="font-weight: bold;">Rp ${totalTransport.toLocaleString('id-ID')}</span>
              <div style="font-size: 11px; color: #475569; margin-top: 2px; font-weight: normal;">
                ${detailTransport.ringkasanKeterangan}
              </div>
            </td>
          </tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 6px 0; font-weight: bold;">Total Pembayaran</td><td>:</td><td style="border-bottom: 2px solid #000; font-weight: bold; font-size: 1.05em;">Rp ${totalKeseluruhan.toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 5px 0;">Lokasi pelaksanaan</td><td>:</td><td style="border-bottom: 1px solid #000;">${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT : '-'}</td></tr>
        </table>

        ${totalTransport > 0 && detailTransport.items.length > 0 ? `
        <div style="margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; background-color: #f8fafc; font-size: 12px;">
          <div style="font-weight: bold; color: #1e293b; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>Rincian Bantuan Transportasi Fasilitator:</span>
            <span style="font-weight: normal; color: #64748b;">${rekap.fasilitator?.jarakPPKm ? `Jarak PP: ${rekap.fasilitator.jarakPPKm} km` : ''}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; color: #475569;">
                <th style="padding: 4px; width: 14%;">Sesi</th>
                <th style="padding: 4px; width: 22%;">Tanggal / Metode</th>
                <th style="padding: 4px;">Dasar Penggantian Transportasi</th>
                <th style="padding: 4px; text-align: right; width: 20%;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${detailTransport.items.map(it => `
                <tr style="border-bottom: 1px dashed #e2e8f0;">
                  <td style="padding: 4px;">Pertemuan ${it.no}</td>
                  <td style="padding: 4px;">${it.tanggal ? it.tanggal + ' • ' : ''}<strong>${it.metode}</strong></td>
                  <td style="padding: 4px; color: #334155;">${it.keterangan}</td>
                  <td style="padding: 4px; text-align: right; font-weight: bold; color: #1e293b;">Rp ${it.total.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 6px; font-size: 10px; color: #64748b; font-style: italic;">
            * Penggantian transportasi luring tanpa bukti karcis/tiket umum dihitung berdasarkan Rumus Konsumsi BBM Jarak PP (${rekap.fasilitator?.jarakPPKm || 0} km) & Standar Operasional Transport Lokal SNT. Sesi daring tidak diberikan bantuan transport.
          </div>
        </div>
        ` : ''}
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px;">
          <tr>
            <td style="width: 35%; padding: 4px 0; font-weight: bold;">Informasi Rekening Pembayaran:</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">Nama Bank</td>
            <td>:</td>
            <td>${rekap.fasilitator?.bankName || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">Nomor Rekening</td>
            <td>:</td>
            <td>${rekap.fasilitator?.bankAccount || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">Atas Nama</td>
            <td>:</td>
            <td>${rekap.fasilitator?.namaLengkap || '-'}</td>
          </tr>
        </table>
        
        <div style="margin-bottom: 25px; font-size: 14px;">
          <p style="font-weight: bold; text-decoration: underline; margin-bottom: 8px;">Rincian potongan (bila ada):</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 35%; padding: 4px 0;">PPh Pasal 21 (jika ada)</td><td>Rp 0</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Total diterima bersih</td><td style="font-weight: bold; font-size: 1.1em;">Rp ${totalKeseluruhan.toLocaleString('id-ID')}</td></tr>
          </table>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 30px; text-align: center; font-size: 14px;">
          <div>
            <p style="margin: 0;">Mengetahui / Menyetujui,</p>
            <p style="font-weight: bold; margin: 5px 0 0 0;">${kopType === 'maleo' ? 'Yayasan Maleo Talenta Cendekia' : 'PT Jully Tjindrawan Robotik'}</p>
          </div>
          <div>
            <p style="margin: 0;">Yang Menerima Honor,</p>
            <p style="font-weight: bold; margin: 5px 0 0 0;">Fasilitator</p>
            <br/><br/><br/>
            <p style="font-weight: bold; margin: 0;">${rekap.fasilitator?.namaLengkap}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getKwitansiHtml = (rekap: any, record: any, type: 'HONOR' | 'TRANSPORT', terbilangRupiah: (n: number) => string) => {
  const kopImage = window.location.origin + '/kop-maleo.png';
  const noKwitansi = record.noKwitansi || 'KWT/TEMP';
  const kwitansiDate = record.tanggal ? new Date(record.tanggal) : new Date();
  const dateFormatted = kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const formatBulan = (bulan: string) => {
    if (!bulan) return '-';
    const [year, month] = bulan.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[parseInt(month, 10) - 1] || month;
    return `${monthName} ${year}`;
  };

  const detailTransport = hitungDetailTransportRekap(rekap);
  
  if (type === 'HONOR') {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 0 0 40px 0; min-height: 1123px; page-break-after: always; box-sizing: border-box; background-color: #ffffff;">
        <div style="margin-bottom: 20px;">
          <img src="${kopImage}" style="width: 100%; max-height: 140px; object-fit: fill;" alt="Kop Surat" />
        </div>
        
        <div style="padding: 0 50px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; color: #1e3a8a; font-family: sans-serif;">KWITANSI</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-style: italic;">Tanda Terima Honor Fasilitator</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
            <div>No. Kuitansi : ${noKwitansi}</div>
            <div>Tanggal : ${dateFormatted}</div>
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
                <td style="font-weight: bold;">Rp ${record.nominal.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Terbilang</td>
                <td>:</td>
                <td style="font-style: italic;">${terbilangRupiah(record.nominal)} Rupiah</td>
              </tr>
            </table>
          </div>
          
          <div style="font-size: 14px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Untuk pembayaran :</p>
            <p style="margin-top: 0; margin-bottom: 15px;">Pembayaran honor fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <tr><td style="width: 35%; padding: 6px 0;">Nama fasilitator</td><td style="width: 5%;">:</td><td style="border-bottom: 1px solid #cbd5e1;">${rekap.fasilitator?.namaLengkap || '-'}</td></tr>
              <tr><td style="padding: 6px 0;">No. Identitas (KTP/NPWP)</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">${rekap.fasilitator?.npwpNik || '-'}</td></tr>
              <tr><td style="padding: 6px 0;">Nama program/kegiatan</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">KKA Sekolah Nasional Terintegrasi (SNT)</td></tr>
              <tr><td style="padding: 6px 0;">Periode / sesi honor</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">${formatBulan(rekap.bulan)}</td></tr>
              <tr><td style="padding: 6px 0;">(bulan / tanggal pelaksanaan)</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">${formatBulan(rekap.bulan)}</td></tr>
              <tr><td style="padding: 6px 0;">Jumlah sesi / JP</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">${(rekap.totalJPIntra > 0 && rekap.totalJPEkstra > 0) ? `${rekap.totalJP} JP (Intra: ${rekap.totalJPIntra} JP + Ekstra: ${rekap.totalJPEkstra} JP)` : `${rekap.totalJP} JP`}</td></tr>
              <tr><td style="padding: 6px 0;">Total Honor</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1; font-weight: bold;">Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td></tr>
              <tr><td style="padding: 6px 0;">Lokasi pelaksanaan</td><td>:</td><td style="border-bottom: 1px solid #cbd5e1;">${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT : '-'}</td></tr>
            </table>
            
            <p style="font-weight: bold; margin-bottom: 10px;">Rincian potongan (bila ada):</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #cbd5e1;">
              <tr>
                <td style="padding: 10px; width: 60%; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">PPh Pasal 21 (jika ada)</td>
                <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Rp 0</td>
              </tr>
              <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td style="padding: 10px; border-right: 1px solid #cbd5e1;">Honor diterima bersih</td>
                <td style="padding: 10px;">Rp ${record.nominal.toLocaleString('id-ID')}</td>
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
              <p style="margin: 0; font-weight: bold;">( ${rekap.fasilitator?.namaLengkap || '______________________________'} )</p>
              <p style="margin: 5px 0 0 0; font-style: italic;">Fasilitator</p>
            </div>
          </div>
          
          <div style="margin-top: 40px; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 5px 0; font-weight: bold;">Catatan:</p>
            <p style="margin: 0 0 3px 0;">• Materai Rp10.000 ditempel bila nominal honor di atas Rp5.000.000.</p>
            <p style="margin: 0;">• Sertakan nomor rekening penerima dan bukti transfer sebagai lampiran, jika pembayaran non-tunai.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div style="font-family: sans-serif; padding: 0 0 40px 0; min-height: 1123px; page-break-after: always; box-sizing: border-box; background-color: #ffffff;">
      <div style="margin-bottom: 30px;">
        <img src="${kopImage}" style="width: 100%; max-height: 140px; object-fit: fill;" alt="Kop Surat" />
      </div>
      <div style="padding: 0 50px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2>KWITANSI</h2>
          <p>Tanda Terima ${type === 'HONOR' ? 'Honor' : 'Transport'} Fasilitator</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
          <div>Tanggal : <strong>${dateFormatted}</strong></div>
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
            <td style="padding: 10px 0;">: 
              ${record.perihal}
              <div style="margin-top: 6px; font-size: 13px; color: #475569; font-style: italic;">
                Rincian: ${detailTransport.ringkasanKeterangan}
              </div>
            </td>
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
    </div>
  `;
};
