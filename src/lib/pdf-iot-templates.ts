import { formatCurrency, terbilangRupiah } from '@/lib/format'

export function generateRabIotHtml(paket: any, items: any[]): string {
  // Kelompokkan items berdasarkan kategori
  const groupedCategories: { [key: string]: any[] } = {}
  items.forEach(it => {
    const cat = it.kategori || 'Lain-lain'
    if (!groupedCategories[cat]) groupedCategories[cat] = []
    groupedCategories[cat].push(it)
  })

  const subtotal = items.reduce((sum, it) => sum + (it.volume * it.hargaSatuanRAB), 0)
  const persenCadangan = paket.persenCadangan !== undefined ? paket.persenCadangan : 10
  const nominalCadangan = Math.round(subtotal * (persenCadangan / 100))
  const totalRAB = subtotal + nominalCadangan

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>RAB Alat dan Bahan Robotika - ${paket.lokasiSNT}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 11pt;
          line-height: 1.4;
          margin: 0;
          padding: 24px 32px;
        }
        .header-title {
          text-align: center;
          margin-bottom: 24px;
        }
        .header-title h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
        }
        .header-title h2 {
          font-size: 12pt;
          font-weight: normal;
          margin: 0 0 6px 0;
        }
        .header-title p {
          font-size: 10pt;
          color: #4b5563;
          margin: 0;
          font-style: italic;
        }
        .section-title {
          font-size: 13pt;
          font-weight: bold;
          margin: 20px 0 10px 0;
        }
        .cat-title {
          font-size: 10.5pt;
          font-weight: bold;
          margin: 14px 0 6px 0;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 9.5pt;
        }
        th, td {
          border: 1px solid #9ca3af;
          padding: 6px 8px;
        }
        th {
          background-color: #dbeafe;
          color: #1e3a8a;
          font-weight: bold;
          text-align: left;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .rekap-table th {
          background-color: #e0e7ff;
        }
        .total-row {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .catatan-list {
          font-size: 9pt;
          line-height: 1.5;
          padding-left: 20px;
          margin: 6px 0 20px 0;
        }
        .signature-container {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-box {
          text-align: center;
          width: 250px;
        }
        .sig-space {
          height: 65px;
        }
        @media print {
          body { padding: 12mm 15mm; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header-title">
        <h1>RENCANA ANGGARAN BIAYA (RAB)</h1>
        <h2>Pengadaan Alat dan Bahan Robotika – ${paket.lokasiSNT}</h2>
        <p>Lingkup kebutuhan: ${paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT'}</p>
      </div>

      <div class="section-title">A. Rincian Anggaran</div>

      ${Object.keys(groupedCategories).map(catName => `
        <div class="cat-title">${catName}</div>
        <table>
          <thead>
            <tr>
              <th>Nama alat dan bahan</th>
              <th style="width: 75px;" class="text-center">Satuan</th>
              <th style="width: 65px;" class="text-center">Volume</th>
              <th style="width: 120px;" class="text-right">Harga satuan (Rp)</th>
              <th style="width: 125px;" class="text-right">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${groupedCategories[catName].map(item => `
              <tr>
                <td>${item.namaBarang}</td>
                <td class="text-center">${item.satuan || 'Unit'}</td>
                <td class="text-center">${item.volume}</td>
                <td class="text-right">${formatCurrency(item.hargaSatuanRAB).replace('Rp ', 'Rp ')}</td>
                <td class="text-right font-medium">${formatCurrency(item.volume * item.hargaSatuanRAB).replace('Rp ', 'Rp ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}

      <div class="section-title" style="margin-top: 24px;">B. Rekapitulasi Anggaran</div>
      <table class="rekap-table">
        <thead>
          <tr>
            <th>Uraian</th>
            <th style="width: 190px;" class="text-right">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Subtotal kebutuhan alat dan bahan</td>
            <td class="text-right font-semibold">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td>Cadangan biaya ${persenCadangan}% (estimasi untuk selisih harga/ongkir kecil)</td>
            <td class="text-right font-semibold">${formatCurrency(nominalCadangan)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL RENCANA ANGGARAN</td>
            <td class="text-right font-bold" style="font-size: 11pt; color: #1e3a8a;">${formatCurrency(totalRAB)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title" style="margin-top: 24px;">C. Catatan dan Asumsi</div>
      <ol class="catatan-list">
        <li>Nama barang dan volume mengacu pada dokumen daftar alat dan bahan yang disepakati untuk proyek robotika IoT.</li>
        <li>Harga satuan merupakan estimasi perencanaan, bukan penawaran resmi vendor. Harga aktual dapat berbeda berdasarkan merek, spesifikasi, ketersediaan, dan lokasi pembelian.</li>
        <li>Cadangan ${persenCadangan}% ditampilkan terpisah sebagai antisipasi perubahan harga dan selisih operasional kecil; belum merupakan biaya pengiriman resmi.</li>
        <li>Baut spacer dihitung 40 pcs (20 pcs ukuran 6 mm dan 20 pcs ukuran 10 mm). Kabel jumper dihitung 3 set tipe M-M, M-F, dan F-F, masing-masing 40 pcs. Push button dihitung 8 pcs untuk dua warna, masing-masing 4 pcs.</li>
        <li>Sebelum pengadaan, pastikan kembali spesifikasi tempat sampah otomatis, tipe ESP32, kapasitas baterai/charger, ukuran box, serta kecocokan adaptor dan komponen dengan rancangan proyek.</li>
      </ol>

      <div class="signature-container">
        <div class="sig-box">
          <p style="margin: 0;">Disusun oleh,</p>
          <p style="margin: 4px 0 0 0; font-weight: bold;">Pengelola / Tim Robotika</p>
          <div class="sig-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">(________________________)</p>
        </div>
        <div class="sig-box">
          <p style="margin: 0;">Mengetahui,</p>
          <p style="margin: 4px 0 0 0; font-weight: bold;">${paket.mengetahuiJabatan || 'Kepala SNT'} ${paket.lokasiSNT}</p>
          <div class="sig-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            (${paket.mengetahuiNama ? paket.mengetahuiNama : '________________________'})
          </p>
          ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? `<p style="margin: 2px 0 0 0; font-size: 9pt;">NIP. ${paket.mengetahuiNip}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateTandaTerimaIotHtml(paket: any, items: any[]): string {
  const d = paket.tanggalSurat ? new Date(paket.tanggalSurat) : new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const hariStr = days[d.getDay()]
  const tglStr = d.getDate().toString()
  const blnStr = months[d.getMonth()]
  const thnStr = d.getFullYear().toString()
  const kotaStr = paket.lokasiSNT.replace(/SNT\s*\d*\s*/i, '').trim() || 'Kupang'

  const totalRealisasi = items.reduce((sum, it) => sum + (it.volume * (it.hargaSatuanReal || 0)), 0)

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>Surat Tanda Terima Alat dan Bahan - ${paket.lokasiSNT}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 10pt;
          line-height: 1.4;
          margin: 0;
          padding: 24px 32px;
        }
        .kop-container {
          border-bottom: 2.5px solid #000;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        .kop-company {
          font-size: 13pt;
          font-weight: bold;
          margin: 0;
          letter-spacing: 0.5px;
          color: #0b2545;
        }
        .kop-sub {
          font-size: 10pt;
          font-weight: bold;
          margin: 2px 0 4px 0;
          color: #374151;
        }
        .kop-address {
          font-size: 8.5pt;
          color: #4b5563;
          margin: 0;
        }
        .doc-title {
          text-align: center;
          margin: 18px 0 20px 0;
        }
        .doc-title h1 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 4px 0;
          letter-spacing: 1px;
          color: #0b2545;
        }
        .doc-title p {
          font-size: 10pt;
          margin: 0;
          font-family: monospace;
          color: #374151;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          font-size: 9.5pt;
        }
        .meta-table td {
          border: none;
          padding: 2px 0;
          vertical-align: top;
        }
        .meta-label { width: 150px; font-weight: normal; }
        .meta-sep { width: 15px; }

        .party-block {
          margin-bottom: 12px;
          font-size: 9.5pt;
        }
        .party-title {
          font-weight: bold;
          margin-bottom: 4px;
          text-decoration: underline;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0 10px 0;
          font-size: 8.5pt;
        }
        .items-table th, .items-table td {
          border: 1px solid #6b7280;
          padding: 4.5px 6px;
        }
        .items-table th {
          background-color: #0b2545;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .clause-text {
          font-size: 9pt;
          line-height: 1.45;
          margin: 10px 0;
          text-align: justify;
        }

        .signature-section {
          margin-top: 28px;
          page-break-inside: avoid;
        }
        .sig-row-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .sig-col {
          text-align: center;
          width: 260px;
        }
        .sig-space {
          height: 60px;
        }
        .sig-bottom {
          text-align: center;
          margin: 0 auto;
          width: 300px;
        }
        @media print {
          body { padding: 10mm 14mm; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <!-- KOP RESMI -->
      <div class="kop-container">
        <h2 class="kop-company">${paket.pihakPertamaInstansi || 'PT JULLY TJINDRAWAN ROBOTIK (ROBOTIC EXPLORER)'}</h2>
        <div class="kop-sub">${paket.pihakPertamaJabatan || 'Koordinator Wilayah 2 — Program Sekolah Nasional Terintegrasi (SNT)'}</div>
        <div class="kop-address">Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 &middot; www.worldroboticexplorer.com &middot; 0822-9898-4848</div>
      </div>

      <!-- JUDUL SURAT -->
      <div class="doc-title">
        <h1>SURAT TANDA TERIMA ALAT DAN BAHAN</h1>
        <p>Nomor: ${paket.nomorSurat || '……/RE/SNT-K2/X/2026'}</p>
      </div>

      <!-- META -->
      <table class="meta-table">
        <tr>
          <td class="meta-label">Perihal</td>
          <td class="meta-sep">:</td>
          <td><strong>Serah Terima Alat dan Bahan Proyek IoT</strong></td>
        </tr>
        <tr>
          <td class="meta-label">Lampiran</td>
          <td class="meta-sep">:</td>
          <td>1 berkas (Daftar Rincian Alat dan Bahan)</td>
        </tr>
      </table>

      <p style="margin: 8px 0 12px 0; font-size: 9.5pt;">
        Pada hari ini, <strong>${hariStr}</strong>, tanggal <strong>${tglStr}</strong> bulan <strong>${blnStr}</strong> tahun <strong>${thnStr}</strong>, yang bertanda tangan di bawah ini:
      </p>

      <!-- PIHAK PERTAMA -->
      <div class="party-block">
        <div class="party-title">PIHAK PERTAMA (Yang Menyerahkan)</div>
        <table class="meta-table" style="margin-bottom: 0;">
          <tr>
            <td style="width: 140px;">Nama</td>
            <td style="width: 15px;">:</td>
            <td><strong>${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}</strong></td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td>${paket.pihakPertamaJabatan || 'Koordinator Wilayah 2, Program SNT'}</td>
          </tr>
          <tr>
            <td>Instansi</td>
            <td>:</td>
            <td>${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)'}</td>
          </tr>
        </table>
      </div>

      <!-- PIHAK KEDUA -->
      <div class="party-block">
        <div class="party-title">PIHAK KEDUA (Yang Menerima)</div>
        <table class="meta-table" style="margin-bottom: 0;">
          <tr>
            <td style="width: 140px;">Nama</td>
            <td style="width: 15px;">:</td>
            <td><strong>${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || '-')}</strong></td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td>${paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika'}</td>
          </tr>
          <tr>
            <td>Satuan Pendidikan</td>
            <td>:</td>
            <td><strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong></td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td>${paket.pihakKeduaAlamat || (paket.fasilitator?.alamat || '-')}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 12px 0 8px 0; font-size: 9.5pt;">
        PIHAK PERTAMA menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menerima dari PIHAK PERTAMA, alat dan bahan untuk proyek <strong>${paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT'}</strong> dengan rincian sebagai berikut:
      </p>

      <!-- TABEL DAFTAR ALAT & BAHAN -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 32px;">No</th>
            <th>Nama Alat dan Bahan</th>
            <th style="width: 60px;">Jumlah</th>
            <th style="width: 85px;" class="text-right">Harga (Rp)</th>
            <th style="width: 85px;">Kemasan</th>
            <th style="width: 55px;">Diterima</th>
            <th style="width: 120px;">Kondisi / Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr>
              <td class="text-center font-mono">${idx + 1}</td>
              <td style="font-weight: 500;">${it.namaBarang}</td>
              <td class="text-center">${it.volume} ${it.satuan !== 'Unit' ? it.satuan : ''}</td>
              <td class="text-right font-mono">${new Intl.NumberFormat('id-ID').format(it.totalReal || (it.volume * it.hargaSatuanReal))}</td>
              <td class="text-center">${it.kemasan || '–'}</td>
              <td class="text-center" style="font-weight: bold; color: ${it.diterima !== false ? '#047857' : '#b91c1c'};">
                ${it.diterima !== false ? '&#10003;' : '&#10007;'}
              </td>
              <td style="font-size: 8pt; color: #374151;">${it.kondisiCatatan || ''}</td>
            </tr>
          `).join('')}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" class="text-right" style="font-size: 9pt;">TOTAL :</td>
            <td class="text-right font-mono" style="font-size: 9.5pt; color: #0b2545;">
              ${new Intl.NumberFormat('id-ID').format(totalRealisasi)}
            </td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>

      <div style="font-size: 9pt; margin-bottom: 12px; font-style: italic;">
        Terbilang: <strong>${terbilangRupiah(totalRealisasi).toLowerCase()}</strong>.
      </div>

      <!-- KLAUSUL PENERIMAAN -->
      <div class="clause-text">
        PIHAK KEDUA telah memeriksa barang tersebut dan menyatakan menerimanya dalam jumlah dan kondisi sebagaimana tercatat pada tabel di atas. Barang yang kurang atau rusak dicatat pada kolom Kondisi / Catatan dan dilaporkan kepada PIHAK PERTAMA paling lambat 3 (tiga) hari setelah penerimaan.
      </div>
      <div class="clause-text">
        Sejak tanggal penerimaan, alat dan bahan tersebut menjadi tanggung jawab PIHAK KEDUA untuk digunakan dalam kegiatan pembelajaran Koding, KA &amp; Robotika di <strong>${paket.lokasiSNT}</strong>.
      </div>
      <div class="clause-text">
        Demikian surat tanda terima ini dibuat rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.
      </div>

      <!-- BLOK TANDA TANGAN -->
      <div class="signature-section">
        <div style="text-align: right; margin-bottom: 14px; font-size: 9.5pt;">
          ${kotaStr}, ${tglStr} ${blnStr} ${thnStr}
        </div>

        <div class="sig-row-top">
          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK PERTAMA</p>
            <p style="margin: 2px 0 0 0; font-size: 9pt; color: #4b5563;">Yang Menyerahkan</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5pt;">${paket.pihakPertamaJabatan || 'Koordinator Wilayah 2'}</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK KEDUA</p>
            <p style="margin: 2px 0 0 0; font-size: 9pt; color: #4b5563;">Yang Menerima</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || '________________________')}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 8.5pt;">${paket.pihakKeduaJabatan || 'Fasilitator SNT'}</p>
          </div>
        </div>

        <div class="sig-bottom">
          <p style="margin: 0; font-weight: bold;">Mengetahui,</p>
          <p style="margin: 2px 0 0 0; font-size: 9pt; color: #4b5563;">${paket.mengetahuiJabatan || 'Kepala'} ${paket.lokasiSNT}</p>
          <div class="sig-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            (${paket.mengetahuiNama ? paket.mengetahuiNama : '________________________'})
          </p>
          <p style="margin: 2px 0 0 0; font-size: 8.5pt; color: #4b5563;">
            NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateBast100KitHtml(paket: any, lokasiData: any, items: any[]): string {
  const d = lokasiData.tanggalKirim ? new Date(lokasiData.tanggalKirim) : new Date()
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const hariStr = namaHari[d.getDay()]
  const tglStr = d.getDate()
  const blnStr = namaBulan[d.getMonth()]
  const thnStr = d.getFullYear()

  // Saring items: item yang per kit (A, B, C) vs item tambahan lokasi (charger)
  const kitItems = items.filter(it => !it.kategori?.includes('TAMBAHAN'))
  const extraItems = items.filter(it => it.kategori?.includes('TAMBAHAN'))

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>BAST Pengadaan Starter Kit IoT - ${lokasiData.namaLokasi}</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 9pt;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        .kop-container {
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 10px;
          margin-bottom: 14px;
          text-align: center;
        }
        .kop-company {
          font-size: 14pt;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .kop-sub {
          font-size: 9pt;
          font-weight: 600;
          color: #374151;
          margin: 0 0 4px 0;
        }
        .kop-address {
          font-size: 7.5pt;
          color: #6b7280;
          line-height: 1.3;
        }
        .doc-title {
          text-align: center;
          margin: 12px 0 16px 0;
        }
        .doc-title h1 {
          font-size: 12pt;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
        }
        .doc-title p {
          font-size: 9.5pt;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
        }
        .party-block {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 10px;
        }
        .party-title {
          font-weight: bold;
          font-size: 9pt;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        table.meta-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
        }
        table.meta-table td {
          padding: 2px 0;
          vertical-align: top;
          border: none;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 8pt;
        }
        .items-table th, .items-table td {
          border: 1px solid #9ca3af;
          padding: 4px 6px;
        }
        .items-table th {
          background-color: #1e3a8a;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
        }
        .cat-row {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #1e293b;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .signature-section {
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .sig-row-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .sig-col {
          text-align: center;
          width: 250px;
        }
        .sig-space {
          height: 60px;
        }
        .sig-bottom {
          text-align: center;
          margin: 0 auto;
          width: 300px;
        }
        @media print {
          body { padding: 0; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <!-- KOP RESMI -->
      <div class="kop-container">
        <h2 class="kop-company">PT JULLY TJINDRAWAN ROBOTIK (ROBOTIC EXPLORER)</h2>
        <div class="kop-sub">Divisi Pengadaan & Distribusi Starter Kit IoT — Program Pendidikan Teknologi Nasional</div>
        <div class="kop-address">Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 &middot; info@worldroboticexplorer.com &middot; 0822-9898-4848</div>
      </div>

      <!-- JUDUL SURAT -->
      <div class="doc-title">
        <h1>BERITA ACARA SERAH TERIMA (BAST) ALAT DAN BAHAN</h1>
        <p>Nomor: ${lokasiData.nomorSurat || '……/BAST/KIT-IOT/X/2026'}</p>
      </div>

      <p style="margin: 6px 0 10px 0; font-size: 8.5pt;">
        Pada hari ini, <strong>${hariStr}</strong>, tanggal <strong>${tglStr}</strong> bulan <strong>${blnStr}</strong> tahun <strong>${thnStr}</strong> bertempat di <strong>${lokasiData.namaLokasi}</strong>, yang bertanda tangan di bawah ini:
      </p>

      <!-- PIHAK PERTAMA -->
      <div class="party-block">
        <div class="party-title">PIHAK PERTAMA (Yang Menyerahkan)</div>
        <table class="meta-table">
          <tr>
            <td style="width: 130px;">Nama</td>
            <td style="width: 15px;">:</td>
            <td><strong>${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}</strong></td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td>${paket.pihakPertamaJabatan || 'Direktur Utama'}</td>
          </tr>
          <tr>
            <td>Instansi / Perusahaan</td>
            <td>:</td>
            <td>${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)'}</td>
          </tr>
        </table>
      </div>

      <!-- PIHAK KEDUA -->
      <div class="party-block">
        <div class="party-title">PIHAK KEDUA (Yang Menerima)</div>
        <table class="meta-table">
          <tr>
            <td style="width: 130px;">Nama</td>
            <td style="width: 15px;">:</td>
            <td><strong>${lokasiData.penerimaNama || 'Penanggung Jawab Wilayah'}</strong></td>
          </tr>
          <tr>
            <td>Satuan / Wilayah</td>
            <td>:</td>
            <td><strong>${lokasiData.sekolahTujuan || lokasiData.namaLokasi}</strong></td>
          </tr>
          <tr>
            <td>Peruntukan Proyek</td>
            <td>:</td>
            <td>Pengadaan Starter Kit IoT — Alokasi Wilayah ${lokasiData.namaLokasi}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 10px 0 6px 0; font-size: 8.5pt;">
        PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima dalam keadaan <strong>lengkap, baru, dan berfungsi baik</strong> paket peralatan sebagai berikut:
      </p>
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 6px 12px; margin-bottom: 8px; font-size: 9pt;">
        <strong>Alokasi Paket yang Diserahterimakan:</strong>
        <ul style="margin: 4px 0 0 16px; padding: 0;">
          <li><strong>${lokasiData.alokasiKit} Unit Starter Kit IoT Lengkap</strong> (Rincian komponen di bawah, masing-masing dikemas dalam Kontainer EZ Box 15L berpengunci)</li>
          <li><strong>${lokasiData.alokasiCharger} Unit Charger Baterai 18650 4-Slot USB</strong> (Perlengkapan pengisian daya baterai wilayah)</li>
        </ul>
      </div>

      <div class="page-break"></div>

      <p style="font-size: 8.5pt; font-weight: bold; margin-bottom: 4px;">Rincian Komponen per 1 Kit (Total Diterima = Qty &times; ${lokasiData.alokasiKit} Kit):</p>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 28px;">No</th>
            <th>Nama Komponen / Modul</th>
            <th style="width: 55px;">Qty/Kit</th>
            <th style="width: 45px;">Satuan</th>
            <th style="width: 70px;">Total Diterima</th>
            <th style="width: 90px;">Kemasan</th>
            <th style="width: 50px;">Kondisi</th>
          </tr>
        </thead>
        <tbody>
          ${kitItems.map((it, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${it.namaBarang}</strong></td>
              <td class="text-center">${it.qtyPerKit || 1}</td>
              <td class="text-center">${it.satuan || 'pcs'}</td>
              <td class="text-center font-bold" style="background-color: #f8fafc;">
                ${(it.qtyPerKit || 1) * lokasiData.alokasiKit} ${it.satuan || 'pcs'}
              </td>
              <td>${it.kemasan || '–'}</td>
              <td class="text-center">&#10003; Baik</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TANDA TANGAN -->
      <div class="signature-section">
        <p style="font-size: 8.5pt; margin-bottom: 14px;">
          Demikian Berita Acara Serah Terima (BAST) ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
        </p>

        <div class="sig-row-top">
          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK PERTAMA</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5pt; color: #4b5563;">Yang Menyerahkan</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 8pt;">${paket.pihakPertamaJabatan || 'Direktur Utama'}</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK KEDUA</p>
            <p style="margin: 2px 0 0 0; font-size: 8.5pt; color: #4b5563;">Yang Menerima</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${lokasiData.penerimaNama || '________________________'}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 8pt;">Penanggung Jawab ${lokasiData.namaLokasi}</p>
          </div>
        </div>

        <div class="sig-bottom">
          <p style="margin: 0; font-weight: bold;">Mengetahui,</p>
          <p style="margin: 2px 0 0 0; font-size: 8.5pt; color: #4b5563;">Pejabat Pembuat Komitmen (PPK) / Pengawas Program</p>
          <div class="sig-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            (${paket.mengetahuiNama ? paket.mengetahuiNama : '________________________'})
          </p>
          <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">
            NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
