const fs = require('fs');
let file = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', 'utf8');

const topBlock = `<div style="margin-bottom: 20px; font-size: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="width: 25%; padding: 4px 0;"><strong>Nama Fasilitator</strong></td><td>:</td><td>\${rekap.fasilitator?.namaLengkap}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Lokasi (SNT)</strong></td><td>:</td><td>\${rekap.fasilitator?.lokasiSNT || '-'}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Bulan Laporan</strong></td><td>:</td><td>\${formatBulan(rekap.bulan)}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Total JP (Intra + Ekstra)</strong></td><td>:</td><td>\${rekap.totalJP} JP</td></tr>
          </table>
        </div>`;

file = file.replace(topBlock, '');

const mainTableStart = `<table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
          <tr><td style="width: 30%; padding: 6px 0;">Nama program/kegiatan</td>`;

const newMainTableStart = `<p style="margin-top: 0; margin-bottom: 15px; font-size: 14px;">Pembayaran honor fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
          <tr><td style="width: 30%; padding: 6px 0;">Nama fasilitator</td><td style="width: 5%;">:</td><td style="width: 65%; border-bottom: 1px solid #000;">\${rekap.fasilitator?.namaLengkap || '-'}</td></tr>
          <tr><td style="width: 30%; padding: 6px 0;">Nama program/kegiatan</td>`;

file = file.replace(mainTableStart, newMainTableStart);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/pdf-generator.ts', file);
console.log('PDF updated to remove duplicate info block!');
