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

export interface MonthlyReportParams {
  bulan: string;
  items: any[];
  kopType: 'maleo' | 'robotic' | 'none';
  tanggalDokumen?: string;
  orientation?: 'landscape' | 'portrait';
  filterStatus?: 'ALL' | 'LUNAS' | 'UNPAID';
}

export const getMonthlyRekapReportHtml = (
  params: MonthlyReportParams,
  terbilangRupiah: (n: number) => string
) => {
  const { bulan, items, kopType, tanggalDokumen, orientation = 'landscape' } = params;
  const isLandscape = orientation === 'landscape';
  const kopImage = window.location.origin + (kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png');

  const formatBulan = (b: string) => {
    if (!b) return '-';
    const [year, month] = b.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[parseInt(month, 10) - 1] || month;
    return `${monthName} ${year}`;
  };

  const labelBulan = formatBulan(bulan);
  const tanggalDoc = tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Totals
  let totalJP = 0;
  let totalJPIntra = 0;
  let totalJPEkstra = 0;
  let totalHonor = 0;
  let totalTransport = 0;
  let grandTotal = 0;
  let lunasCount = 0;
  let unpaidCount = 0;

  const rowsData = items.map((rekap, idx) => {
    const tTrans = hitungTotalTransportRekap(rekap);
    const detailTrans = hitungDetailTransportRekap(rekap);
    const honor = Number(rekap.totalHonor) || 0;
    const totalRow = honor + tTrans;
    const jp = Number(rekap.totalJP) || 0;
    const jpIntra = Number(rekap.totalJPIntra) || 0;
    const jpEkstra = Number(rekap.totalJPEkstra) || 0;

    totalJP += jp;
    totalJPIntra += jpIntra;
    totalJPEkstra += jpEkstra;
    totalHonor += honor;
    totalTransport += tTrans;
    grandTotal += totalRow;

    const hasHonorProof = Boolean(rekap.buktiPembayaranHonor);
    const needsTransProof = tTrans > 0;
    const hasTransProof = Boolean(rekap.buktiPembayaranTransport);
    const isLunas = rekap.status === 'APPROVED' || (hasHonorProof && (!needsTransProof || hasTransProof));

    if (isLunas) lunasCount++;
    else unpaidCount++;

    return {
      no: idx + 1,
      rekap,
      nama: rekap.fasilitator?.namaLengkap || 'Tanpa Nama',
      nikNpwp: rekap.fasilitator?.npwpNik || '',
      lokasi: rekap.fasilitator?.lokasiSNT || '-',
      bankName: rekap.fasilitator?.bankName || '-',
      bankAccount: rekap.fasilitator?.bankAccount || '-',
      bankHolder: rekap.fasilitator?.bankAccountHolder || rekap.fasilitator?.namaLengkap || '-',
      sesi: rekap.jumlahSesi || 4,
      jp,
      jpIntra,
      jpEkstra,
      honor,
      transport: tTrans,
      transportDetail: detailTrans,
      total: totalRow,
      isLunas
    };
  });

  const totalFasilitator = rowsData.length;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: ${isLandscape ? '24px 32px' : '20px'}; width: ${isLandscape ? '1123px' : '794px'}; box-sizing: border-box; background-color: #ffffff; color: #0f172a; font-size: ${isLandscape ? '11.5px' : '10.5px'}; line-height: 1.35;">
      
      <!-- KOP SURAT -->
      ${kopType !== 'none' ? `
        <div style="margin-bottom: 15px; text-align: center;">
          <img src="${kopImage}" style="width: 100%; max-height: ${isLandscape ? '115px' : '135px'}; object-fit: fill;" alt="Kop Surat" />
        </div>
      ` : `
        <div style="text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 10px; margin-bottom: 18px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
            YAYASAN MALEO TALENTA CENDEKIA
          </h1>
          <p style="margin: 3px 0 0 0; font-size: 12px; color: #475569;">
            Program KKA Sekolah Nasional Terintegrasi (SNT) &bull; Tahun Ajaran 2026/2027
          </p>
        </div>
      `}

      <!-- JUDUL LAPORAN -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h2 style="margin: 0; font-size: ${isLandscape ? '17px' : '15px'}; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          LAPORAN REKAPITULASI RINCIAN &amp; KEBUTUHAN BIAYA FASILITATOR
        </h2>
        <div style="margin-top: 4px; font-size: 13px; color: #334155;">
          Periode Kegiatan: <strong>Bulan ${labelBulan}</strong> &bull; Dokumen Tanggal: <strong>${tanggalDoc}</strong>
        </div>
      </div>

      <!-- EXECUTIVE SUMMARY CARDS -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.3px;">Total Fasilitator &amp; Jam</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">
            ${totalFasilitator} Orang &bull; ${totalJP} JP
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Intra: ${totalJPIntra} JP | Ekstra: ${totalJPEkstra} JP
          </div>
        </div>

        <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.3px;">Kebutuhan Honorarium</div>
          <div style="font-size: 15px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">
            Rp ${totalHonor.toLocaleString('id-ID')}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Beban honor sesi mengajar</div>
        </div>

        <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.3px;">Kebutuhan Bantuan Transport</div>
          <div style="font-size: 15px; font-weight: 800; color: #9a3412; margin-top: 2px;">
            Rp ${totalTransport.toLocaleString('id-ID')}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Bantuan BBM / Operasional</div>
        </div>

        <div style="border: 2px solid #059669; background: #ecfdf5; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 10px; color: #065f46; text-transform: uppercase; font-weight: bold; letter-spacing: 0.3px;">Total Kebutuhan Dana (Transfer)</div>
          <div style="font-size: 16px; font-weight: 900; color: #064e3b; margin-top: 2px;">
            Rp ${grandTotal.toLocaleString('id-ID')}
          </div>
          <div style="font-size: 10px; color: #047857; margin-top: 2px; font-weight: 600;">
            ${lunasCount} Lunas &bull; ${unpaidCount} Perlu Pencairan
          </div>
        </div>
      </div>

      <!-- TERBILANG BANNER -->
      <div style="background: #f1f5f9; border-left: 4px solid #0284c7; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; color: #1e293b; border-radius: 0 4px 4px 0;">
        <strong>Terbilang Total Kebutuhan Dana:</strong> <span style="font-style: italic; font-weight: 600; color: #0369a1;">${terbilangRupiah(grandTotal)} Rupiah</span>
      </div>

      <!-- TABEL RINCIAN FASILITATOR -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: ${isLandscape ? '11px' : '10px'};">
        <thead>
          <tr style="background-color: #1e293b; color: #ffffff; text-align: left;">
            <th style="padding: 8px 5px; border: 1px solid #334155; text-align: center; width: 28px;">No</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; width: ${isLandscape ? '160px' : '130px'};">Nama Fasilitator</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; width: ${isLandscape ? '145px' : '115px'};">Lokasi SNT</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; width: ${isLandscape ? '165px' : '125px'};">Rekening Transfer</th>
            <th style="padding: 8px 5px; border: 1px solid #334155; text-align: center; width: ${isLandscape ? '75px' : '65px'};">Sesi / JP</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; text-align: right; width: ${isLandscape ? '105px' : '85px'};">Honorarium</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; text-align: right; width: ${isLandscape ? '120px' : '95px'};">Bantuan Transport</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; text-align: right; width: ${isLandscape ? '115px' : '95px'};">Total Kebutuhan</th>
            <th style="padding: 8px 5px; border: 1px solid #334155; text-align: center; width: 70px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsData.length === 0 ? `
            <tr>
              <td colspan="9" style="padding: 24px; text-align: center; border: 1px solid #cbd5e1; color: #64748b;">
                Tidak ada data rekapitulasi honorarium untuk bulan ini.
              </td>
            </tr>
          ` : rowsData.map((row, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center;">${row.no}</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
                <div style="font-weight: 700; color: #0f172a;">${row.nama}</div>
                ${row.nikNpwp ? `<div style="font-size: 9px; color: #64748b; font-mono: monospace;">NPWP/NIK: ${row.nikNpwp}</div>` : ''}
              </td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1; color: #334155;">
                <div style="font-weight: 600;">${row.lokasi.split(' - ')[0] || row.lokasi}</div>
                ${row.lokasi.split(' - ')[1] ? `<div style="font-size: 9.5px; color: #64748b;">${row.lokasi.split(' - ')[1]}</div>` : ''}
              </td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">
                <div style="font-weight: 600; color: #0f172a;">${row.bankName} - ${row.bankAccount}</div>
                <div style="font-size: 9.5px; color: #64748b;">a.n. ${row.bankHolder}</div>
              </td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center;">
                <div style="font-weight: 700;">${row.sesi} Sesi</div>
                <div style="font-size: 9.5px; color: #475569;">${row.jp} JP ${(row.jpIntra > 0 || row.jpEkstra > 0) ? `(${row.jpIntra}I+${row.jpEkstra}E)` : ''}</div>
              </td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #1e3a8a;">
                Rp ${row.honor.toLocaleString('id-ID')}
              </td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">
                <div style="font-weight: 600; color: #9a3412;">Rp ${row.transport.toLocaleString('id-ID')}</div>
                <div style="font-size: 9px; color: #64748b;">
                  ${row.transport === 0 ? 'Daring (Rp 0)' : (row.rekap.fasilitator?.jarakPPKm ? `${row.rekap.fasilitator.jarakPPKm} km PP` : 'Bantuan Transport')}
                </div>
              </td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: #064e3b; font-size: 1.05em;">
                Rp ${row.total.toLocaleString('id-ID')}
              </td>
              <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center;">
                ${row.isLunas 
                  ? `<span style="background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px;">LUNAS</span>`
                  : `<span style="background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px;">PENDING</span>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: 800; border-top: 2px solid #0f172a; page-break-inside: avoid;">
            <td colspan="4" style="padding: 9px 8px; border: 1px solid #cbd5e1; text-align: right; text-transform: uppercase; font-size: 11px;">
              TOTAL KESELURUHAN (${totalFasilitator} FASILITATOR) :
            </td>
            <td style="padding: 9px 4px; border: 1px solid #cbd5e1; text-align: center; color: #0f172a;">
              ${totalJP} JP
            </td>
            <td style="padding: 9px 8px; border: 1px solid #cbd5e1; text-align: right; color: #1e3a8a;">
              Rp ${totalHonor.toLocaleString('id-ID')}
            </td>
            <td style="padding: 9px 8px; border: 1px solid #cbd5e1; text-align: right; color: #9a3412;">
              Rp ${totalTransport.toLocaleString('id-ID')}
            </td>
            <td style="padding: 9px 8px; border: 1px solid #cbd5e1; text-align: right; color: #064e3b; font-size: 1.15em;">
              Rp ${grandTotal.toLocaleString('id-ID')}
            </td>
            <td style="padding: 9px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px; color: #475569;">
              ${lunasCount}/${totalFasilitator}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- CATATAN DAN TANDA TANGAN -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px; page-break-inside: avoid;">
        <div style="width: 52%; font-size: 10px; color: #64748b; line-height: 1.45;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 3px;">Catatan Pelaksanaan &amp; Verifikasi:</div>
          <div>1. Rekapitulasi di atas dihitung berdasarkan beban jam mengajar (JP) dan verifikasi laporan mingguan kegiatan fasilitator.</div>
          <div>2. Bantuan transportasi dihitung sesuai standar operasional dan rumus konsumsi BBM jarak pulang-pergi (PP). Kegiatan full daring tidak diberikan bantuan transport.</div>
          <div>3. Seluruh pencairan dana honorarium dan transport ditransfer non-tunai langsung ke rekening bank masing-masing fasilitator tertera.</div>
        </div>

        <div style="width: 44%; display: flex; justify-content: space-between; text-align: center; font-size: 11px;">
          <div style="width: 48%;">
            <p style="margin: 0; color: #64748b;">Disiapkan Oleh,</p>
            <p style="margin: 2px 0 0 0; font-weight: bold; color: #1e293b;">Admin Keuangan SNT</p>
            <br/><br/><br/>
            <p style="margin: 0; font-weight: bold; color: #0f172a;">( _____________________ )</p>
            <p style="margin: 2px 0 0 0; font-size: 9.5px; color: #64748b;">Staff Administrasi / Keuangan</p>
          </div>
          <div style="width: 48%;">
            <p style="margin: 0; color: #64748b;">Mengetahui &amp; Menyetujui,</p>
            <p style="margin: 2px 0 0 0; font-weight: bold; color: #1e293b;">${kopType === 'robotic' ? 'PT Jully Tjindrawan Robotik' : 'Yayasan Maleo Talenta Cendekia'}</p>
            <br/><br/><br/>
            <p style="margin: 0; font-weight: bold; color: #0f172a;">( _____________________ )</p>
            <p style="margin: 2px 0 0 0; font-size: 9.5px; color: #64748b;">Pimpinan / Pengurus Yayasan</p>
          </div>
        </div>
      </div>

    </div>
  `;
};
