import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { getStandardItemKemasanAndSatuan, isLikelyVendorName } from '@/lib/iot-constants'

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
          ${items.map((it, idx) => {
            const std = getStandardItemKemasanAndSatuan(it.namaBarang)
            const displayKemasan = (!it.kemasan || it.kemasan === '–' || isLikelyVendorName(it.kemasan)) ? std.kemasan : it.kemasan
            const isNumericSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())
            const displaySatuan = isNumericSatuan ? std.satuan : it.satuan
            return `
            <tr>
              <td class="text-center font-mono">${idx + 1}</td>
              <td style="font-weight: 500;">${it.namaBarang}</td>
              <td class="text-center">${it.volume} ${displaySatuan !== 'Unit' ? displaySatuan : ''}</td>
              <td class="text-right font-mono">${new Intl.NumberFormat('id-ID').format(it.totalReal || (it.volume * it.hargaSatuanReal))}</td>
              <td class="text-center">${displayKemasan || '–'}</td>
              <td class="text-center" style="font-weight: bold; color: ${it.diterima !== false ? '#047857' : '#b91c1c'};">
                ${it.diterima !== false ? '&#10003;' : '&#10007;'}
              </td>
              <td style="font-size: 8pt; color: #374151;">${it.kondisiCatatan || ''}</td>
            </tr>
          `}).join('')}
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

  const isManualDate = paket.kosongkanTanggalBAST !== false

  const hariDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 85px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${hariStr}</strong>`

  const tglDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 45px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${tglStr}</strong>`

  const blnDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 105px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${blnStr}</strong>`

  const thnDisplay = isManualDate ? (thnStr || '2026') : thnStr

  // Opsi Nama Manual (Titik-Titik untuk ditulis pulpen di lapangan)
  const isManualNama = paket.kosongkanNamaBAST !== false
  const isPenerimaGeneric = !lokasiData.penerimaNama 
    || /^(fasilitator|koordinator|penanggung\s*jawab|pic|wilayah)/i.test(lokasiData.penerimaNama.trim())
    || lokasiData.penerimaNama.trim() === '–'
    || lokasiData.penerimaNama.trim() === '-'
  const showManualPenerima = isManualNama || isPenerimaGeneric

  const isMengetahuiGeneric = !paket.mengetahuiNama 
    || /^(pemberi\s*kerja|ppk|pejabat|pengawas|kepala)/i.test(paket.mengetahuiNama.trim())
  const showManualMengetahui = isManualNama || isMengetahuiGeneric

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
          size: A4 portrait;
          margin: 6mm 10mm 6mm 10mm;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 8.5pt;
          line-height: 1.35;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .kop-container {
          border-bottom: 2px solid #1e3a8a;
          padding-top: 0;
          padding-bottom: 4px;
          margin-top: 0;
          margin-bottom: 8px;
          text-align: center;
        }
        .kop-company {
          font-size: 13pt;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .kop-sub {
          font-size: 8.5pt;
          font-weight: 600;
          color: #374151;
          margin: 0 0 2px 0;
        }
        .kop-address {
          font-size: 7.5pt;
          color: #6b7280;
          line-height: 1.25;
        }
        .doc-title {
          text-align: center;
          margin: 6px 0 8px 0;
        }
        .doc-title h1 {
          font-size: 11pt;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 0 2px 0;
          letter-spacing: 0.5px;
        }
        .doc-title p {
          font-size: 8.5pt;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
        }
        .party-block {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 8px;
          margin-bottom: 5px;
        }
        .party-title {
          font-weight: bold;
          font-size: 8pt;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 2px;
          margin-bottom: 3px;
        }
        table.meta-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.5pt;
        }
        table.meta-table td {
          padding: 1.5px 0;
          vertical-align: top;
          border: none;
        }
        .alokasi-box {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          padding: 4px 8px;
          margin-bottom: 6px;
          font-size: 8pt;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0 8px 0;
          font-size: 7.5pt;
          page-break-inside: auto;
        }
        .items-table thead {
          display: table-header-group;
        }
        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        .items-table th, .items-table td {
          border: 1px solid #9ca3af;
          padding: 2.5px 5px;
          line-height: 1.25;
        }
        .items-table th {
          background-color: #1e3a8a;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
          font-size: 7.5pt;
        }
        .cat-row {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #1e293b;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .signature-section {
          margin-top: 10px;
          page-break-inside: avoid;
        }
        .sig-row-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sig-col {
          text-align: center;
          width: 250px;
        }
        .sig-space {
          height: 48px;
        }
        .sig-bottom {
          text-align: center;
          margin: 0 auto;
          width: 320px;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }
          html, body {
            padding: 0;
            margin: 0;
          }
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

      <p style="margin: 4px 0 8px 0; font-size: 8pt;">
        Pada hari ini, ${hariDisplay}, tanggal ${tglDisplay} bulan ${blnDisplay} tahun <strong>${thnDisplay}</strong> bertempat di <strong>${lokasiData.namaLokasi}</strong>, yang bertanda tangan di bawah ini:
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
            <td>
              ${showManualPenerima 
                ? '<span style="display: inline-block; width: 220px; border-bottom: 1px dotted #374151;">&nbsp;</span> <span style="font-size: 7.5pt; color: #6b7280; font-weight: normal;">(diisi nama penanggung jawab penerima)</span>'
                : `<strong>${lokasiData.penerimaNama}</strong>`
              }
            </td>
          </tr>
          <tr>
            <td>Jabatan / Peran</td>
            <td>:</td>
            <td>Penanggung Jawab / Koordinator Lapangan Wilayah ${lokasiData.namaLokasi}</td>
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

      <p style="margin: 6px 0 4px 0; font-size: 8pt;">
        PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima dalam keadaan <strong>lengkap, baru, dan berfungsi baik</strong> paket peralatan sebagai berikut:
      </p>
      <div class="alokasi-box">
        <strong>Alokasi Paket yang Diserahterimakan:</strong>
        <ul style="margin: 3px 0 0 16px; padding: 0;">
          <li><strong>${lokasiData.alokasiKit} Unit Starter Kit IoT Lengkap</strong> (Rincian komponen di bawah, masing-masing dikemas dalam Kontainer EZ Box 15L berpengunci)</li>
          <li><strong>${lokasiData.alokasiCharger || 1} Unit Charger Baterai 18650 4-Slot USB</strong> (Perlengkapan pengisian daya baterai wilayah)</li>
        </ul>
      </div>

      <p style="font-size: 8pt; font-weight: bold; margin: 6px 0 3px 0;">
        Rincian Komponen per 1 Kit (Total Diterima = Qty &times; ${lokasiData.alokasiKit} Kit):
      </p>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 28px;">No</th>
            <th>Nama Komponen / Modul</th>
            <th style="width: 50px;">Qty/Kit</th>
            <th style="width: 45px;">Satuan</th>
            <th style="width: 75px;">Total Diterima</th>
            <th style="width: 60px;">Kondisi</th>
            <th style="width: 80px;">Keterangan</th>
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
              <td class="text-center">&#10003; Baik</td>
              <td class="text-center"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TANDA TANGAN -->
      <div class="signature-section">
        <p style="font-size: 8pt; margin-bottom: 10px;">
          Demikian Berita Acara Serah Terima (BAST) ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
        </p>

        <div class="sig-row-top">
          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK PERTAMA</p>
            <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">Yang Menyerahkan</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7.5pt;">${paket.pihakPertamaJabatan || 'Direktur Utama'}</p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #4b5563;">${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik'}</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK KEDUA</p>
            <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">Yang Menerima</p>
            <div class="sig-space"></div>
            ${showManualPenerima ? `
              <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
                ( .................................................... )
              </p>
              <p style="margin: 3px 0 0 0; font-size: 8pt; font-weight: 600; color: #1f2937;">Penanggung Jawab ${lokasiData.namaLokasi}</p>
              <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #4b5563;">NIP / Kontak: ...........................................</p>
            ` : `
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">
                ${lokasiData.penerimaNama}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 8pt;">Penanggung Jawab ${lokasiData.namaLokasi}</p>
            `}
          </div>
        </div>

        <div class="sig-bottom">
          <p style="margin: 0; font-weight: bold;">Mengetahui,</p>
          <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">
            Pejabat Pembuat Komitmen (PPK) / Pengawas Program
          </p>
          <div class="sig-space"></div>
          ${showManualMengetahui ? `
            <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
              ( .................................................... )
            </p>
            <p style="margin: 3px 0 0 0; font-size: 7.5pt; color: #4b5563;">
              NIP. ....................................................
            </p>
          ` : `
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              (${paket.mengetahuiNama})
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #4b5563;">
              NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
            </p>
          `}
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateBastSntHtml(paket: any, items: any[]): string {
  const d = paket.tanggalSurat ? new Date(paket.tanggalSurat) : new Date()
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const hariStr = namaHari[d.getDay()]
  const tglStr = d.getDate()
  const blnStr = namaBulan[d.getMonth()]
  const thnStr = d.getFullYear()

  const isManualDate = paket.kosongkanTanggalBAST !== false

  const hariDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 85px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${hariStr}</strong>`

  const tglDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 45px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${tglStr}</strong>`

  const blnDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 105px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${blnStr}</strong>`

  const thnDisplay = isManualDate ? (thnStr || '2026') : thnStr

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>BAST Pengadaan Alat dan Bahan - ${paket.lokasiSNT}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm 12mm 8mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 8.5pt;
          line-height: 1.35;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .kop-container {
          border-bottom: 2.5px solid #1e3a8a;
          padding-top: 0;
          padding-bottom: 6px;
          margin-top: 0;
          margin-bottom: 10px;
          text-align: center;
        }
        .kop-company {
          font-size: 13pt;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .kop-sub {
          font-size: 8.5pt;
          font-weight: 600;
          color: #374151;
          margin: 0 0 3px 0;
        }
        .kop-address {
          font-size: 7.5pt;
          color: #6b7280;
          line-height: 1.3;
        }
        .doc-title {
          text-align: center;
          margin: 10px 0 14px 0;
        }
        .doc-title h1 {
          font-size: 11.5pt;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 0 3px 0;
          letter-spacing: 0.5px;
          color: #111827;
        }
        .doc-title p {
          font-size: 9pt;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          color: #1f2937;
        }
        .party-block {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 7px 12px;
          margin-bottom: 8px;
        }
        .party-title {
          font-weight: bold;
          font-size: 8.5pt;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 3px;
          margin-bottom: 5px;
          letter-spacing: 0.3px;
        }
        table.meta-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        table.meta-table td {
          padding: 2px 0;
          vertical-align: top;
          border: none;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 8pt;
          page-break-inside: auto;
        }
        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        .items-table thead {
          display: table-header-group;
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
          font-size: 8pt;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .signature-section {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .sig-row-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .sig-col {
          text-align: center;
          width: 250px;
        }
        .sig-space {
          height: 55px;
        }
        .sig-bottom {
          text-align: center;
          margin: 0 auto;
          width: 320px;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 12mm 8mm 12mm;
          }
          html, body {
            padding: 0;
            margin: 0;
          }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <!-- KOP RESMI -->
      <div class="kop-container">
        <h2 class="kop-company">PT JULLY TJINDRAWAN ROBOTIK (ROBOTIC EXPLORER)</h2>
        <div class="kop-sub">Koordinator Wilayah 2 &middot; Program Sekolah Nasional Terintegrasi (SNT) Tahun 2026</div>
        <div class="kop-address">Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510 &middot; info@worldroboticexplorer.com &middot; 0822-9898-4848</div>
      </div>

      <!-- JUDUL SURAT -->
      <div class="doc-title">
        <h1>BERITA ACARA SERAH TERIMA (BAST) ALAT DAN BAHAN</h1>
        <p>Nomor: ${paket.nomorSurat || '01/RE/SNT-K2/X/2026'}</p>
      </div>

      <p style="margin: 6px 0 8px 0; font-size: 8.5pt;">
        Pada hari ini, ${hariDisplay}, tanggal ${tglDisplay} bulan ${blnDisplay} tahun <strong>${thnDisplay}</strong> bertempat di <strong>${paket.lokasiSNT}</strong>, yang bertanda tangan di bawah ini:
      </p>

      <!-- PIHAK PERTAMA -->
      <div class="party-block">
        <div class="party-title">PIHAK PERTAMA (Yang Menyerahkan)</div>
        <table class="meta-table">
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
            <td>Instansi / Perusahaan</td>
            <td>:</td>
            <td>${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td>Greenville Blok AL no 1A-B, Duri Kepa, Kebon Jeruk, Jakarta Barat 11510</td>
          </tr>
        </table>
      </div>

      <!-- PIHAK KEDUA -->
      <div class="party-block">
        <div class="party-title">PIHAK KEDUA (Yang Menerima)</div>
        <table class="meta-table">
          <tr>
            <td style="width: 140px;">Nama</td>
            <td style="width: 15px;">:</td>
            <td>
              ${(paket.kosongkanNamaBAST !== false || !paket.pihakKeduaNama || /^(fasilitator|koordinator|penanggung\s*jawab|pic)/i.test(String(paket.pihakKeduaNama).trim()))
                ? '<span style="display: inline-block; width: 220px; border-bottom: 1px dotted #374151;">&nbsp;</span> <span style="font-size: 7.5pt; color: #6b7280; font-weight: normal;">(diisi nama penanggung jawab penerima)</span>'
                : `<strong>${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || 'Penanggung Jawab Fasilitator')}</strong>`
              }
            </td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td>${paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika'}</td>
          </tr>
          <tr>
            <td>Satuan Pendidikan / Lokasi</td>
            <td>:</td>
            <td><strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong></td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td>${paket.pihakKeduaAlamat || (paket.fasilitator?.alamat || '–')}</td>
          </tr>
          <tr>
            <td>Peruntukan Proyek</td>
            <td>:</td>
            <td>Pengadaan Alat dan Bahan Robotika — ${paket.lokasiSNT} (${paket.lingkupProyek || 'Rover, Smart Lamp & Smart Garden IoT'})</td>
          </tr>
        </table>
      </div>

      <p style="margin: 8px 0 6px 0; font-size: 8.5pt;">
        PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima dalam keadaan <strong>lengkap, baru, dan berfungsi baik</strong> paket peralatan dan bahan robotika sebagai berikut:
      </p>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 6px 12px; margin-bottom: 8px; font-size: 8.5pt;">
        <strong>Alokasi Paket yang Diserahterimakan:</strong>
        <ul style="margin: 3px 0 0 16px; padding: 0;">
          <li><strong>1 Paket Pengadaan Alat &amp; Bahan Robotika IoT Lengkap (${items.length} Item Terdaftar)</strong> untuk operasional pembelajaran ekstrakurikuler Koding, Kecerdasan Artifisial, dan Robotika di <strong>${paket.lokasiSNT}</strong>.</li>
        </ul>
      </div>

      <!-- TABEL RINCIAN KOMPONEN -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 26px;">No</th>
            <th style="width: 120px;">Kelompok / Kategori</th>
            <th>Nama Alat dan Bahan</th>
            <th style="width: 45px;">Volume</th>
            <th style="width: 45px;">Satuan</th>
            <th style="width: 65px;">Kondisi</th>
            <th style="width: 90px;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const std = getStandardItemKemasanAndSatuan(it.namaBarang)
            const displayKemasan = (!it.kemasan || it.kemasan === '–' || isLikelyVendorName(it.kemasan)) ? std.kemasan : it.kemasan
            const isNumericSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())
            const displaySatuan = isNumericSatuan ? std.satuan : it.satuan
            return `
            <tr>
              <td class="text-center font-mono">${idx + 1}</td>
              <td style="font-size: 7.5pt; color: #4b5563;">${it.kategori || '–'}</td>
              <td style="font-weight: 600; color: #0f172a;">${it.namaBarang}</td>
              <td class="text-center font-bold">${it.volume}</td>
              <td class="text-center">${displaySatuan || 'Unit'}</td>
              <td class="text-center" style="font-weight: bold; color: ${it.diterima !== false ? '#047857' : '#b91c1c'};">
                ${it.diterima !== false ? '&#10003; Baik' : '&#10007; Kurang/Rusak'}
              </td>
              <td></td>
            </tr>
          `}).join('')}
        </tbody>
      </table>

      <!-- KLAUSUL & PENUTUP -->
      <p style="font-size: 8pt; line-height: 1.4; margin: 8px 0 4px 0;">
        PIHAK KEDUA telah memeriksa seluruh rincian alat dan bahan tersebut dan menyatakan menerimanya dalam jumlah serta kondisi baik. Sejak tanggal penandatanganan Berita Acara Serah Terima ini, barang operasional tersebut menjadi tanggung jawab PIHAK KEDUA untuk dipergunakan, dirawat, dan dimanfaatkan sebaik-baiknya dalam mendukung program pembelajaran Koding, Kecerdasan Artifisial, dan Robotika di <strong>${paket.lokasiSNT}</strong>.
      </p>
      <p style="font-size: 8pt; margin: 4px 0 14px 0;">
        Demikian Berita Acara Serah Terima (BAST) ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
      </p>

      <!-- BLOK TANDA TANGAN -->
      <div class="signature-section">
        <div class="sig-row-top">
          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK PERTAMA</p>
            <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">Yang Menyerahkan</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7.5pt;">${paket.pihakPertamaJabatan || 'Koordinator Wilayah 2, Program SNT'}</p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #4b5563;">${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik'}</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">PIHAK KEDUA</p>
            <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">Yang Menerima</p>
            <div class="sig-space"></div>
            ${(paket.kosongkanNamaBAST !== false || !paket.pihakKeduaNama || /^(fasilitator|koordinator|penanggung\s*jawab|pic)/i.test(String(paket.pihakKeduaNama).trim())) ? `
              <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
                ( .................................................... )
              </p>
              <p style="margin: 3px 0 0 0; font-size: 7.5pt;">${paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika'}</p>
              <p style="margin: 1px 0 0 0; font-size: 7pt; color: #4b5563;">${paket.pihakKeduaSekolah || paket.lokasiSNT}</p>
            ` : `
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">
                ${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || 'Penanggung Jawab Fasilitator')}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 7.5pt;">${paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika'}</p>
              <p style="margin: 1px 0 0 0; font-size: 7pt; color: #4b5563;">${paket.pihakKeduaSekolah || paket.lokasiSNT}</p>
            `}
          </div>
        </div>

        <div class="sig-bottom">
          <p style="margin: 0; font-weight: bold;">Mengetahui,</p>
          <p style="margin: 2px 0 0 0; font-size: 8pt; color: #4b5563;">
            Kepala Sekolah / Penanggung Jawab Satuan Pendidikan
          </p>
          <div class="sig-space"></div>
          ${(paket.kosongkanNamaBAST !== false || !paket.mengetahuiNama || /^(pemberi\s*kerja|ppk|pejabat|pengawas|kepala)/i.test(String(paket.mengetahuiNama).trim())) ? `
            <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
              ( .................................................... )
            </p>
            <p style="margin: 3px 0 0 0; font-size: 7.5pt; color: #4b5563;">
              NIP. ....................................................
            </p>
          ` : `
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              (${paket.mengetahuiNama ? paket.mengetahuiNama : (paket.pihakKeduaSekolah ? 'Kepala ' + paket.pihakKeduaSekolah : 'Kepala Sekolah SNT')})
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #4b5563;">
              NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
            </p>
          `}
        </div>
      </div>
    </body>
    </html>
  `
}


/**
 * GENERATE LAPORAN LENGKAP PENGADAAN IOT (ALL-IN-ONE BUNDLE)
 * 1. Narasi Laporan Pertanggungjawaban & Ringkasan Eksekutif Finansial
 * 2. Dokumen RAB Rencana (8 Kategori Belanja + Cadangan Tak Terduga)
 * 3. Dokumen Realisasi Belanja Aktual & Rekapitulasi per Toko/Vendor
 * 4. Berita Acara Serah Terima (BAST Resmi 3 Pihak)
 * 5. Lampiran Bukti Transaksi (Galeri Foto Nota, Invoices & Lembar Pengesahan)
 */
export function generateLaporanLengkapIotHtml(paket: any, items: any[]): string {
  const is100Kit = paket.tipeProgram === 'STARTER_KIT_100'

  // Perhitungan Keuangan
  const subtotalRAB = items.reduce((sum, it) => sum + (it.volume * (it.hargaSatuanRAB || 0)), 0)
  const persenCadangan = paket.persenCadangan !== undefined ? paket.persenCadangan : (is100Kit ? 0 : 10)
  const nominalCadangan = Math.round(subtotalRAB * (persenCadangan / 100))
  const totalPaguRAB = subtotalRAB + nominalCadangan
  const totalRealisasi = items.reduce((sum, it) => sum + (it.volume * (it.hargaSatuanReal || 0)), 0)
  const selisih = totalPaguRAB - totalRealisasi
  const persenRealisasi = totalPaguRAB > 0 ? ((totalRealisasi / totalPaguRAB) * 100).toFixed(1) : '0'

  // Kategori Items untuk RAB
  const groupedCategories: { [key: string]: any[] } = {}
  items.forEach(it => {
    const cat = it.kategori || 'Lain-lain'
    if (!groupedCategories[cat]) groupedCategories[cat] = []
    groupedCategories[cat].push(it)
  })

  // Rekap per Vendor / Toko
  const vendorMap: { [key: string]: { count: number; total: number } } = {}
  items.forEach(it => {
    let v = it.vendor && it.vendor.trim() !== '–' && it.vendor.trim() !== '' ? it.vendor.trim() : ''
    if (!v) {
      if (it.kemasan && isLikelyVendorName(it.kemasan)) {
        v = it.kemasan.trim()
      } else {
        v = 'Toko Rekanan / Pasar Elektronik'
      }
    }
    if (!vendorMap[v]) vendorMap[v] = { count: 0, total: 0 }
    vendorMap[v].count += 1
    vendorMap[v].total += (it.volume * (it.hargaSatuanReal || 0))
  })
  const vendorList = Object.entries(vendorMap).map(([name, data]) => ({ name, ...data }))
  vendorList.sort((a, b) => b.total - a.total)

  // Tanggal
  const d = paket.tanggalSurat ? new Date(paket.tanggalSurat) : new Date()
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const tglStr = d.getDate()
  const blnStr = namaBulan[d.getMonth()]
  const thnStr = d.getFullYear()
  const hariStr = namaHari[d.getDay()]

  const isManualDate = paket.kosongkanTanggalBAST !== false
  const hariDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 85px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${hariStr}</strong>`
  const tglDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 45px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${tglStr}</strong>`
  const blnDisplay = isManualDate 
    ? '<span style="display: inline-block; width: 105px; border-bottom: 1px dotted #374151; margin: 0 2px;">&nbsp;</span>' 
    : `<strong>${blnStr}</strong>`
  const thnDisplay = isManualDate ? (thnStr || '2026') : thnStr

  // Default Narasi Laporan
  const defaultNarasi = `Dalam rangka mendukung percepatan penguasaan teknologi tingkat dasar dan menengah pada Program Sekolah Nasional Terintegrasi (SNT) Tahun 2026, PT Jully Tjindrawan Robotik (Robotic Explorer) selaku Koordinator Wilayah 2 telah melaksanakan pengadaan dan pendistribusian paket alat dan bahan robotika berbasis Internet of Things (IoT) untuk lokasi ${paket.lokasiSNT}.\n\nPengadaan ini mencakup penyediaan komponen inti mikrokontroler (ESP32), sensor ultrasonik, servo, modul daya, aktuator, serta peralatan kerja dan mekanik penunjang untuk 3 proyek utama: ${paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT'}.\n\nTotal pagu anggaran rencana yang dialokasikan adalah sebesar ${formatCurrency(totalPaguRAB)}, dengan total realisasi belanja aktual sebesar ${formatCurrency(totalRealisasi)} (terdapat ${selisih >= 0 ? 'efisiensi/sisa anggaran sebesar ' + formatCurrency(selisih) : 'defisit anggaran sebesar ' + formatCurrency(Math.abs(selisih))}).\n\nSeluruh barang telah diperiksa kelayakan fisiknya, diserahterimakan kepada pihak fasilitator dan satuan pendidikan dalam kondisi baik, lengkap, dan siap digunakan untuk proses belajar mengajar serta kegiatan ekstrakurikuler.`
  const narasiText = (paket.narasiLaporan && paket.narasiLaporan.trim()) ? paket.narasiLaporan.trim() : defaultNarasi
  const narasiParagraphs = narasiText.split(/\n\s*\n/).filter(Boolean)

  // Parsing Lampiran Bukti
  function parseLampiran(val?: string | null): { name: string; url: string; uploadedAt?: string }[] {
    if (!val || !val.trim()) return []
    if (val.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) return parsed
      } catch (e) {}
    }
    return [{ name: 'Bukti Nota Pembelian', url: val, uploadedAt: new Date().toISOString() }]
  }

  const lampiranList = parseLampiran(paket.lampiranNotaUrl)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']
  const imageLampiran = lampiranList.filter(l => {
    const lower = (l.url || l.name || '').toLowerCase()
    return imageExtensions.some(ext => lower.includes(ext))
  })
  const nonImageLampiran = lampiranList.filter(l => !imageLampiran.includes(l))

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>Laporan Lengkap Pengadaan IoT - ${paket.lokasiSNT}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 8.5pt;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-break {
          page-break-before: always;
        }
        .no-break {
          page-break-inside: avoid;
        }

        /* KOP SURAT */
        .kop-container {
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 6px;
          margin-bottom: 12px;
          text-align: center;
        }
        .kop-company {
          font-size: 13pt;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .kop-brand {
          font-size: 10pt;
          font-weight: 700;
          color: #2563eb;
          margin: 0 0 2px 0;
          letter-spacing: 1px;
        }
        .kop-sub {
          font-size: 8.5pt;
          font-weight: 600;
          color: #374151;
          margin: 0 0 3px 0;
        }
        .kop-address {
          font-size: 7.5pt;
          color: #6b7280;
          line-height: 1.3;
        }

        /* HEADER DOKUMEN */
        .doc-title {
          text-align: center;
          margin: 12px 0 16px 0;
        }
        .doc-title h1 {
          font-size: 12pt;
          font-weight: 800;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-transform: uppercase;
        }
        .doc-title h2 {
          font-size: 10pt;
          font-weight: 700;
          color: #1e40af;
          margin: 0 0 4px 0;
        }
        .doc-title p {
          font-size: 8.5pt;
          color: #4b5563;
          margin: 0;
        }

        /* BAB & SECTION HEADERS */
        .bab-header {
          background-color: #1e3a8a;
          color: white;
          padding: 6px 10px;
          font-size: 9.5pt;
          font-weight: bold;
          border-radius: 4px;
          margin: 16px 0 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bab-header.green {
          background-color: #065f46;
        }
        .bab-header.purple {
          background-color: #5b21b6;
        }
        .bab-header.slate {
          background-color: #334155;
        }

        /* KPI METRIC CARDS */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          background-color: #f8fafc;
          border-radius: 6px;
          padding: 8px 10px;
          text-align: center;
        }
        .kpi-label {
          font-size: 7.5pt;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .kpi-value {
          font-size: 11pt;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 7pt;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* TABLES */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 8pt;
        }
        th, td {
          border: 1px solid #94a3b8;
          padding: 4.5px 6px;
          vertical-align: middle;
        }
        th {
          background-color: #e2e8f0;
          color: #0f172a;
          font-weight: 700;
          text-align: left;
        }
        .table-primary th {
          background-color: #dbeafe;
          color: #1e3a8a;
        }
        .table-emerald th {
          background-color: #d1fae5;
          color: #065f46;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .font-bold { font-weight: bold; }
        .bg-total {
          background-color: #f1f5f9;
          font-weight: bold;
        }

        /* NARASI PARAGRAPH */
        .narasi-box {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #2563eb;
          border-radius: 4px;
          padding: 12px 14px;
          margin-bottom: 14px;
        }
        .narasi-p {
          font-size: 8.5pt;
          line-height: 1.5;
          color: #1e293b;
          margin: 0 0 8px 0;
          text-align: justify;
        }
        .narasi-p:last-child {
          margin-bottom: 0;
        }

        /* SIGNATURE BOXES */
        .sig-container {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .sig-col {
          flex: 1;
          text-align: center;
          font-size: 8pt;
          page-break-inside: avoid;
        }
        .sig-space {
          height: 60px;
        }

        /* GALLERY NOTA */
        .receipt-gallery {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 10px;
        }
        .receipt-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          background-color: #ffffff;
          page-break-inside: avoid;
          text-align: center;
        }
        .receipt-img {
          max-width: 100%;
          max-height: 380px;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }
        .receipt-caption {
          font-size: 7.5pt;
          color: #475569;
          font-weight: 600;
          margin-top: 6px;
        }
      </style>
    </head>
    <body>

      <!-- ========================================== -->
      <!-- COVER / HALAMAN 1: NARASI & EKSEKUTIF     -->
      <!-- ========================================== -->
      <div class="kop-container">
        <div class="kop-company">PT JULLY TJINDRAWAN ROBOTIK</div>
        <div class="kop-brand">ROBOTIC EXPLORER</div>
        <div class="kop-sub">Koordinator Wilayah 2 — Program Sekolah Nasional Terintegrasi (SNT) 2026</div>
        <div class="kop-address">
          Sekretariat &amp; Workshop: Jakarta &bull; Email: snt.korwil2@roboticexplorer.id &bull; Dokumen Resmi Terverifikasi
        </div>
      </div>

      <div class="doc-title">
        <h1>LAPORAN PERTANGGUNGJAWABAN &amp; REALISASI PENGADAAN</h1>
        <h2>PAKET ALAT DAN BAHAN ROBOTIKA BERBASIS INTERNET OF THINGS (IOT)</h2>
        <p>
          Satuan Pendidikan: <strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong> &bull; Wilayah: <strong>${paket.lokasiSNT}</strong> &bull; Nomor Dokumen: <strong>${paket.nomorSurat || '–'}</strong>
        </p>
      </div>

      <!-- KPI FINANSIAL & FISIK -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Pagu Anggaran Rencana (RAB)</div>
          <div class="kpi-value" style="color: #1e3a8a;">${formatCurrency(totalPaguRAB)}</div>
          <div class="kpi-sub">Termasuk cadangan ${persenCadangan}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Realisasi Belanja Aktual</div>
          <div class="kpi-value" style="color: #065f46;">${formatCurrency(totalRealisasi)}</div>
          <div class="kpi-sub">${persenRealisasi}% dari pagu rencana</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">${selisih >= 0 ? 'Efisiensi / Sisa Dana' : 'Defisit Belanja'}</div>
          <div class="kpi-value" style="color: ${selisih >= 0 ? '#047857' : '#b91c1c'};">
            ${selisih >= 0 ? '+' : '-'}${formatCurrency(Math.abs(selisih))}
          </div>
          <div class="kpi-sub">${selisih >= 0 ? 'Hemat Anggaran' : 'Kelebihan Realisasi'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Fisik Komponen IoT</div>
          <div class="kpi-value" style="color: #6b21a8;">${items.length} Item</div>
          <div class="kpi-sub">100% Baru &amp; Berfungsi Baik</div>
        </div>
      </div>

      <!-- BAB I: NARASI & PENDAHULUAN -->
      <div class="bab-header">
        <span>BAB I. PENDAHULUAN &amp; NARASI PERTANGGUNGJAWABAN</span>
        <span style="font-size: 8pt; font-weight: normal;">Ringkasan Eksekutif Pengadaan</span>
      </div>

      <div class="narasi-box">
        ${narasiParagraphs.map((p: string) => `<p class="narasi-p">${p}</p>`).join('')}
      </div>

      <!-- INFORMASI PROYEK & DISTRIBUSI -->
      <table style="margin-bottom: 14px;">
        <tr style="background-color: #f8fafc;">
          <th style="width: 25%; font-size: 7.5pt;">Lingkup / Output Proyek</th>
          <td style="font-size: 8pt;"><strong>${paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT'}</strong></td>
        </tr>
        <tr>
          <th style="font-size: 7.5pt;">Koordinator Wilayah (Pihak I)</th>
          <td style="font-size: 8pt;">${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'} (${paket.pihakPertamaJabatan || 'Korwil 2 Program SNT'} — ${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik'})</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="font-size: 7.5pt;">Fasilitator Lapangan (Pihak II)</th>
          <td style="font-size: 8pt;">${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || 'Penanggung Jawab Fasilitator')} (${paket.pihakKeduaJabatan || 'Fasilitator Robotika & IoT'})</td>
        </tr>
        <tr>
          <th style="font-size: 7.5pt;">Satuan Pendidikan &amp; Alamat</th>
          <td style="font-size: 8pt;"><strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong> — ${paket.pihakKeduaAlamat || '–'}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="font-size: 7.5pt;">Penanggung Jawab Sekolah</th>
          <td style="font-size: 8pt;">${paket.mengetahuiNama ? paket.mengetahuiNama : (paket.pihakKeduaSekolah ? 'Kepala ' + paket.pihakKeduaSekolah : 'Kepala Sekolah SNT')} ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? `(NIP. ${paket.mengetahuiNip})` : ''}</td>
        </tr>
      </table>

      <!-- ========================================== -->
      <!-- BAB II: DOKUMEN RENCANA ANGGARAN BIAYA (RAB)-->
      <!-- ========================================== -->
      <div class="page-break"></div>

      <div class="bab-header">
        <span>BAB II. DOKUMEN RENCANA ANGGARAN BIAYA (RAB)</span>
        <span style="font-size: 8pt; font-weight: normal;">Pagu Total: ${formatCurrency(totalPaguRAB)}</span>
      </div>

      <p style="font-size: 8pt; color: #475569; margin: 4px 0 8px 0;">
        Rencana Anggaran Biaya (RAB) disusun berdasarkan 8 kategori komponen standar untuk menunjang modul praktikum siswa:
      </p>

      <!-- TABEL REKAP 8 KATEGORI -->
      <table class="table-primary" style="margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 32px;" class="text-center">No</th>
            <th>Kategori / Kelompok Komponen</th>
            <th style="width: 70px;" class="text-center">Jumlah Item</th>
            <th style="width: 120px;" class="text-right">Subtotal RAB</th>
            <th style="width: 60px;" class="text-right">Porsi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(groupedCategories).map(([catName, catItems], idx) => {
            const catSubtotal = catItems.reduce((sum, it) => sum + (it.volume * (it.hargaSatuanRAB || 0)), 0)
            const catPct = subtotalRAB > 0 ? ((catSubtotal / subtotalRAB) * 100).toFixed(1) : '0'
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${catName}</td>
                <td class="text-center">${catItems.length} item</td>
                <td class="text-right font-mono">${formatCurrency(catSubtotal)}</td>
                <td class="text-right font-mono">${catPct}%</td>
              </tr>
            `
          }).join('')}
          <tr class="bg-total">
            <td colspan="3" class="text-right">SUBTOTAL BIAYA KOMPONEN (A) :</td>
            <td class="text-right font-mono">${formatCurrency(subtotalRAB)}</td>
            <td class="text-right font-mono">100.0%</td>
          </tr>
          ${persenCadangan > 0 ? `
            <tr style="background-color: #eff6ff;">
              <td colspan="3" class="text-right font-bold" style="color: #1e3a8a;">
                CADANGAN BIAYA TAK TERDUGA (${persenCadangan}%) (B) :
              </td>
              <td class="text-right font-mono font-bold" style="color: #1e3a8a;">${formatCurrency(nominalCadangan)}</td>
              <td class="text-right font-mono">${persenCadangan}%</td>
            </tr>
          ` : ''}
          <tr style="background-color: #dbeafe; font-weight: bold; font-size: 8.5pt;">
            <td colspan="3" class="text-right" style="color: #1e3a8a;">TOTAL PAGU ANGGARAN RENCANA (A + B) :</td>
            <td class="text-right font-mono" style="color: #1e3a8a;">${formatCurrency(totalPaguRAB)}</td>
            <td class="text-right font-mono">-</td>
          </tr>
        </tbody>
      </table>

      <!-- TABEL RINCIAN ITEM RAB -->
      <table class="table-primary">
        <thead>
          <tr>
            <th style="width: 26px;" class="text-center">No</th>
            <th style="width: 95px;">Kategori</th>
            <th>Nama Alat dan Bahan</th>
            <th style="width: 40px;" class="text-center">Vol</th>
            <th style="width: 45px;" class="text-center">Satuan</th>
            <th style="width: 80px;" class="text-right">Harga Satuan</th>
            <th style="width: 90px;" class="text-right">Total RAB</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const std = getStandardItemKemasanAndSatuan(it.namaBarang)
            const isNumericSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())
            const displaySatuan = isNumericSatuan ? std.satuan : it.satuan
            const totalItemRAB = it.volume * (it.hargaSatuanRAB || 0)
            return `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                <td style="font-size: 7.5pt; color: #4b5563;">${it.kategori || '–'}</td>
                <td style="font-weight: 600;">${it.namaBarang}</td>
                <td class="text-center font-bold">${it.volume}</td>
                <td class="text-center">${displaySatuan || 'Unit'}</td>
                <td class="text-right font-mono">${formatCurrency(it.hargaSatuanRAB || 0)}</td>
                <td class="text-right font-mono font-bold">${formatCurrency(totalItemRAB)}</td>
              </tr>
            `
          }).join('')}
          <tr class="bg-total">
            <td colspan="6" class="text-right">TOTAL PAGU RAB RENCANA :</td>
            <td class="text-right font-mono font-bold" style="color: #1e3a8a;">${formatCurrency(totalPaguRAB)}</td>
          </tr>
        </tbody>
      </table>

      <!-- ========================================== -->
      <!-- BAB III: REALISASI BELANJA & REKAP VENDOR -->
      <!-- ========================================== -->
      <div class="page-break"></div>

      <div class="bab-header green">
        <span>BAB III. DOKUMEN REALISASI BELANJA AKTUAL &amp; AUDIT VENDOR</span>
        <span style="font-size: 8pt; font-weight: normal;">Total Realisasi: ${formatCurrency(totalRealisasi)}</span>
      </div>

      <p style="font-size: 8pt; color: #475569; margin: 4px 0 8px 0;">
        Realisasi pembelanjaan aktual diperoleh dari transaksi langsung di toko rekanan terpercaya serta marketplace resmi:
      </p>

      <!-- TABEL REKAP TOKO / VENDOR -->
      <table class="table-emerald" style="margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 32px;" class="text-center">No</th>
            <th>Toko / Platform Belanja</th>
            <th style="width: 80px;" class="text-center">Jumlah Item</th>
            <th style="width: 120px;" class="text-right">Total Belanja (Rp)</th>
            <th style="width: 70px;" class="text-right">Porsi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${vendorList.map((v, idx) => {
            const pct = totalRealisasi > 0 ? ((v.total / totalRealisasi) * 100).toFixed(1) : '0'
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${v.name}</td>
                <td class="text-center">${v.count} item</td>
                <td class="text-right font-mono font-bold">${formatCurrency(v.total)}</td>
                <td class="text-right font-mono">${pct}%</td>
              </tr>
            `
          }).join('')}
          <tr class="bg-total" style="background-color: #ecfdf5;">
            <td colspan="3" class="text-right">TOTAL REALISASI BELANJA AKTUAL :</td>
            <td class="text-right font-mono font-bold" style="color: #065f46;">${formatCurrency(totalRealisasi)}</td>
            <td class="text-right font-mono">100.0%</td>
          </tr>
        </tbody>
      </table>

      <!-- TABEL RINCIAN REALISASI PER ITEM -->
      <table class="table-emerald">
        <thead>
          <tr>
            <th style="width: 26px;" class="text-center">No</th>
            <th>Nama Alat dan Bahan</th>
            <th style="width: 35px;" class="text-center">Vol</th>
            <th style="width: 40px;" class="text-center">Sat</th>
            <th style="width: 75px;" class="text-right">Harga Real</th>
            <th style="width: 85px;" class="text-right">Total Real</th>
            <th style="width: 120px;">Toko / Vendor</th>
            <th style="width: 55px;" class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const std = getStandardItemKemasanAndSatuan(it.namaBarang)
            const isNumericSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())
            const displaySatuan = isNumericSatuan ? std.satuan : it.satuan
            let vendorDisplay = it.vendor && it.vendor.trim() !== '–' && it.vendor.trim() !== '' ? it.vendor.trim() : ''
            if (!vendorDisplay && it.kemasan && isLikelyVendorName(it.kemasan)) {
              vendorDisplay = it.kemasan.trim()
            }
            if (!vendorDisplay) vendorDisplay = 'Toko Lokal / Online'

            const totalItemReal = it.volume * (it.hargaSatuanReal || 0)
            return `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                <td style="font-weight: 600;">${it.namaBarang}</td>
                <td class="text-center font-bold">${it.volume}</td>
                <td class="text-center">${displaySatuan || 'Unit'}</td>
                <td class="text-right font-mono">${formatCurrency(it.hargaSatuanReal || 0)}</td>
                <td class="text-right font-mono font-bold">${formatCurrency(totalItemReal)}</td>
                <td style="font-size: 7.5pt; color: #374151;">${vendorDisplay}</td>
                <td class="text-center" style="font-size: 7.5pt; font-weight: bold; color: #047857;">&#10003; Lunas</td>
              </tr>
            `
          }).join('')}
          <tr class="bg-total" style="background-color: #ecfdf5; font-size: 8.5pt;">
            <td colspan="5" class="text-right" style="color: #065f46;">TOTAL REALISASI BELANJA :</td>
            <td class="text-right font-mono font-bold" style="color: #065f46;">${formatCurrency(totalRealisasi)}</td>
            <td colspan="2" style="font-size: 7.5pt; color: #065f46;">
              ${selisih >= 0 ? `Efisiensi: ${formatCurrency(selisih)}` : `Defisit: ${formatCurrency(Math.abs(selisih))}`}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ========================================== -->
      <!-- BAB IV: BERITA ACARA SERAH TERIMA (BAST)   -->
      <!-- ========================================== -->
      <div class="page-break"></div>

      <div class="kop-container">
        <div class="kop-company">PT JULLY TJINDRAWAN ROBOTIK</div>
        <div class="kop-brand">ROBOTIC EXPLORER</div>
        <div class="kop-sub">Koordinator Wilayah 2 — Program Sekolah Nasional Terintegrasi (SNT) 2026</div>
        <div class="kop-address">
          Sekretariat: Jakarta &bull; Email: snt.korwil2@roboticexplorer.id &bull; Dokumen Resmi Penyerahan Barang
        </div>
      </div>

      <div class="doc-title" style="margin-bottom: 10px;">
        <h1 style="font-size: 11pt; text-decoration: underline;">BERITA ACARA SERAH TERIMA (BAST)</h1>
        <p style="font-size: 8pt; margin-top: 2px;">
          Nomor: <strong>${paket.nomorSurat || '……/BAST/RE-K2/SNT/2026'}</strong>
        </p>
      </div>

      <p style="font-size: 8pt; line-height: 1.4; margin: 0 0 8px 0;">
        Pada hari ini, ${hariDisplay}, tanggal ${tglDisplay}, bulan ${blnDisplay}, tahun <strong>${thnDisplay}</strong>, bertempat di <strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong>, kami yang bertanda tangan di bawah ini:
      </p>

      <!-- PIHAK PERTAMA -->
      <table style="margin-bottom: 6px;">
        <tr style="background-color: #eff6ff;">
          <td colspan="3" style="font-weight: bold; color: #1e3a8a; font-size: 8pt;">PIHAK PERTAMA (Yang Menyerahkan):</td>
        </tr>
        <tr>
          <td style="width: 130px;">Nama</td>
          <td style="width: 10px;">:</td>
          <td><strong>${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}</strong></td>
        </tr>
        <tr>
          <td>Jabatan</td>
          <td>:</td>
          <td>${paket.pihakPertamaJabatan || 'Koordinator Wilayah 2, Program SNT'}</td>
        </tr>
        <tr>
          <td>Instansi / Lembaga</td>
          <td>:</td>
          <td><strong>${paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)'}</strong></td>
        </tr>
      </table>

      <!-- PIHAK KEDUA -->
      <table style="margin-bottom: 8px;">
        <tr style="background-color: #ecfdf5;">
          <td colspan="3" style="font-weight: bold; color: #065f46; font-size: 8pt;">PIHAK KEDUA (Yang Menerima):</td>
        </tr>
        <tr>
          <td style="width: 130px;">Nama</td>
          <td style="width: 10px;">:</td>
          <td><strong>${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || 'Penanggung Jawab Fasilitator')}</strong></td>
        </tr>
        <tr>
          <td>Jabatan</td>
          <td>:</td>
          <td>${paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika'}</td>
        </tr>
        <tr>
          <td>Satuan Pendidikan / Lokasi</td>
          <td>:</td>
          <td><strong>${paket.pihakKeduaSekolah || paket.lokasiSNT}</strong></td>
        </tr>
      </table>

      <p style="font-size: 8pt; margin: 4px 0 8px 0;">
        PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA telah memeriksa serta menerima barang berikut dalam kondisi <strong>lengkap, baru, dan berfungsi baik</strong>:
      </p>

      <!-- TABEL FISIK BAST -->
      <table>
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="width: 26px;" class="text-center">No</th>
            <th>Nama Alat dan Bahan</th>
            <th style="width: 40px;" class="text-center">Vol</th>
            <th style="width: 45px;" class="text-center">Sat</th>
            <th style="width: 65px;" class="text-center">Kondisi</th>
            <th style="width: 80px;" class="text-center">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const std = getStandardItemKemasanAndSatuan(it.namaBarang)
            const displayKemasan = (!it.kemasan || it.kemasan === '–' || isLikelyVendorName(it.kemasan)) ? std.kemasan : it.kemasan
            const isNumericSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())
            const displaySatuan = isNumericSatuan ? std.satuan : it.satuan
            return `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                <td style="font-weight: 600;">${it.namaBarang}</td>
                <td class="text-center font-bold">${it.volume}</td>
                <td class="text-center">${displaySatuan || 'Unit'}</td>
                <td class="text-center" style="font-weight: bold; color: ${it.diterima !== false ? '#047857' : '#b91c1c'};">
                  ${it.diterima !== false ? '&#10003; Baik' : '&#10007; Rusak'}
                </td>
                <td class="text-center"></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- KLAUSUL & TANDA TANGAN BAST -->
      <p style="font-size: 7.8pt; line-height: 1.35; margin: 6px 0;">
        Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya bagi kelancaran operasional pembelajaran SNT.
      </p>

      <div class="sig-container">
        <div class="sig-col">
          <p style="margin: 0; font-weight: bold;">PIHAK PERTAMA</p>
          <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Yang Menyerahkan,</p>
          <div class="sig-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            ${paket.pihakPertamaNama || 'Jully Tjindrawan, MBA'}
          </p>
          <p style="margin: 1px 0 0 0; font-size: 7pt;">${paket.pihakPertamaJabatan || 'Korwil 2 Program SNT'}</p>
        </div>

        <div class="sig-col">
          <p style="margin: 0; font-weight: bold;">PIHAK KEDUA</p>
          <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Yang Menerima,</p>
          <div class="sig-space"></div>
          ${(paket.kosongkanNamaBAST !== false || !paket.pihakKeduaNama || /^(fasilitator|koordinator|penanggung\s*jawab|pic)/i.test(String(paket.pihakKeduaNama).trim())) ? `
            <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
              ( .................................................... )
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7pt;">${paket.pihakKeduaJabatan || 'Fasilitator SNT'}</p>
          ` : `
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              ${paket.pihakKeduaNama || (paket.fasilitator?.namaLengkap || 'Penanggung Jawab Fasilitator')}
            </p>
            <p style="margin: 1px 0 0 0; font-size: 7pt;">${paket.pihakKeduaJabatan || 'Fasilitator SNT'}</p>
          `}
        </div>

        <div class="sig-col">
          <p style="margin: 0; font-weight: bold;">MENGETAHUI,</p>
          <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Kepala Satuan Pendidikan SNT,</p>
          <div class="sig-space"></div>
          ${(paket.kosongkanNamaBAST !== false || !paket.mengetahuiNama || /^(pemberi\s*kerja|ppk|pejabat|pengawas|kepala)/i.test(String(paket.mengetahuiNama).trim())) ? `
            <p style="margin: 0; font-weight: bold; letter-spacing: 0.5px;">
              ( .................................................... )
            </p>
            <p style="margin: 2px 0 0 0; font-size: 7pt; color: #64748b;">
              NIP. ....................................................
            </p>
          ` : `
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              (${paket.mengetahuiNama ? paket.mengetahuiNama : (paket.pihakKeduaSekolah ? 'Kepala ' + paket.pihakKeduaSekolah : 'Kepala Sekolah SNT')})
            </p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b;">
              NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
            </p>
          `}
        </div>
      </div>

      <!-- ========================================== -->
      <!-- BAB V: LAMPIRAN BUKTI TRANSAKSI & NOTA    -->
      <!-- ========================================== -->
      <div class="page-break"></div>

      <div class="bab-header purple">
        <span>BAB V. LAMPIRAN BUKTI TRANSAKSI, NOTA, DAN INVOICE BELANJA</span>
        <span style="font-size: 8pt; font-weight: normal;">Arsip Administrasi Terverifikasi</span>
      </div>

      <p style="font-size: 8pt; color: #475569; margin: 4px 0 10px 0;">
        Berikut adalah dokumentasi fisik bukti pembayaran, nota toko, invoice marketplace, dan kwitansi pembelanjaan alat dan bahan IoT yang sah:
      </p>

      ${imageLampiran.length > 0 ? `
        <div class="receipt-gallery">
          ${imageLampiran.map((img, idx) => `
            <div class="receipt-card">
              <img src="${img.url}" alt="${img.name}" class="receipt-img" />
              <div class="receipt-caption">
                Lampiran ${idx + 1}: ${img.name}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 8.5pt; color: #64748b;">
            Belum ada berkas scan gambar nota yang diunggah secara digital ke dalam sistem paket ini.
          </p>
          <p style="margin: 4px 0 0 0; font-size: 7.5pt; color: #94a3b8;">
            (Arsip fisik asli nota / invoice tersimpan dalam map administrasi pengadaan Korwil 2).
          </p>
        </div>
      `}

      ${nonImageLampiran.length > 0 ? `
        <div style="margin-top: 14px;">
          <p style="font-weight: bold; font-size: 8pt; margin: 0 0 6px 0; color: #334155;">Berkas Dokumen Pendukung (PDF / Digital Document):</p>
          <table>
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="width: 30px;" class="text-center">No</th>
                <th>Nama Berkas Dokumen</th>
                <th style="width: 140px;">Waktu Unggah</th>
                <th style="width: 80px;" class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${nonImageLampiran.map((doc, idx) => `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td class="font-bold">${doc.name}</td>
                  <td style="font-size: 7.5pt; color: #64748b;">${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('id-ID') : '–'}</td>
                  <td class="text-center" style="font-weight: bold; color: #047857;">&#10003; Sah</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- LEMBAR PENGESAHAN LAPORAN LENGKAP -->
      <div style="margin-top: 30px; page-break-inside: avoid; border-top: 1.5px solid #cbd5e1; padding-top: 14px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <p style="font-weight: bold; font-size: 9pt; margin: 0; text-transform: uppercase;">
            LEMBAR PENGESAHAN LAPORAN PERTANGGUNGJAWABAN PENGADAAN IOT
          </p>
          <p style="font-size: 7.5pt; color: #64748b; margin: 2px 0 0 0;">
            Program Sekolah Nasional Terintegrasi (SNT) — Koordinator Wilayah 2 Tahun Anggaran 2026
          </p>
        </div>

        <div class="sig-container" style="margin-top: 16px;">
          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">Disusun Oleh:</p>
            <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Tim Logistik &amp; Pengadaan Korwil 2</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              Tim Pengadaan IoT Korwil 2
            </p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b;">PT Jully Tjindrawan Robotik</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">Diperiksa &amp; Disahkan Oleh:</p>
            <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Koordinator Wilayah 2 SNT,</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              Jully Tjindrawan, MBA
            </p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b;">Direktur Utama</p>
          </div>

          <div class="sig-col">
            <p style="margin: 0; font-weight: bold;">Diterima &amp; Diverifikasi Oleh:</p>
            <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b;">Penanggung Jawab Sekolah / SNT,</p>
            <div class="sig-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">
              (${paket.mengetahuiNama ? paket.mengetahuiNama : (paket.pihakKeduaSekolah ? 'Kepala ' + paket.pihakKeduaSekolah : 'Kepala Sekolah SNT')})
            </p>
            <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b;">
              NIP. ${paket.mengetahuiNip && paket.mengetahuiNip !== '–' ? paket.mengetahuiNip : '……………………………………'}
            </p>
          </div>
        </div>
      </div>

    </body>
    </html>
  `
}
