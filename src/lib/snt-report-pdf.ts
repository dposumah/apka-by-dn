import { formatCurrency, terbilangRupiah } from "./format";
import { getExpenseReceiptUrls, renderReceiptAttachmentPagesHtml } from "./expense-receipts";
import { renderBrandKopHtml, renderModernKuitansiHtml } from "./snt-brand-kop";
import {
  KopSuratOption,
  KwitansiAuditRow,
  LocationActivityRow,
  RabRealizationSummary,
  SNT_PERIOD_OPTIONS,
  SNT_WILAYAH_2_LOCATIONS,
  SntFasilitatorRecord,
  SntLaporanKegiatanRecord,
  SntReportProfile,
  SntTemplateCode,
} from "./snt-report-templates";

export interface SntExportBundleInput {
  selectedTemplates: SntTemplateCode[];
  periodKey: string;
  profile: SntReportProfile;
  rabSummary: RabRealizationSummary;
  auditRows: KwitansiAuditRow[];
  locationStats: LocationActivityRow[];
  fasilitators: SntFasilitatorRecord[];
  laporanKegiatan: SntLaporanKegiatanRecord[];
  drafts: Record<string, Record<string, unknown>>;
  includePpn11: boolean;
  includeExtraCategories: boolean;
  includeKwitansiPages: boolean;
  includeReceiptAttachments: boolean;
}

type DraftMap = Record<string, unknown>;

function asRecord<T = unknown>(val: unknown): Record<string, T> {
  return val && typeof val === "object" ? (val as Record<string, T>) : {};
}

function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(val: unknown): string {
  return esc(val).replace(/\n/g, "<br/>");
}

function formatDateId(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function renderKopSurat(profile: SntReportProfile): string {
  return renderBrandKopHtml(profile.kopSurat, profile);
}

function renderSignatureBlock(
  leftRole: string,
  leftName: string,
  rightRole: string,
  rightName: string,
  profile: SntReportProfile,
  middle?: { role: string; name: string }
): string {
  const tgl = `${esc(profile.kotaPengesahan || "Jakarta")}, ${esc(formatDateId(profile.tanggalLaporan))}`;
  if (middle) {
    return `
      <div class="sign-date">${tgl}</div>
      <table class="sign-table">
        <tr>
          <td style="width:33%">
            <div class="sign-role">${esc(leftRole)}</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(leftName || "(................................)")}</div>
          </td>
          <td style="width:34%">
            <div class="sign-role">${esc(middle.role)}</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(middle.name || "(................................)")}</div>
          </td>
          <td style="width:33%">
            <div class="sign-role">${esc(rightRole)}</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(rightName || "(................................)")}</div>
          </td>
        </tr>
      </table>
    `;
  }
  return `
    <div class="sign-date">${tgl}</div>
    <table class="sign-table">
      <tr>
        <td style="width:50%">
          <div class="sign-role">${esc(leftRole)}</div>
          <div class="sign-space"></div>
          <div class="sign-name">${esc(leftName || "(................................)")}</div>
        </td>
        <td style="width:50%">
          <div class="sign-role">${esc(rightRole)}</div>
          <div class="sign-space"></div>
          <div class="sign-name">${esc(rightName || "(................................)")}</div>
        </td>
      </tr>
    </table>
  `;
}

function renderBudgetGroupTable(
  summary: RabRealizationSummary,
  includePpn11: boolean,
  showPeriodColumn: boolean,
  periodLabel: string
): string {
  const pct = (real: number, pagu: number) => (pagu > 0 ? `${((real / pagu) * 100).toFixed(1)}%` : "0.0%");
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Kelompok Biaya</th>
          <th class="num">Pagu RAB (Rp)</th>
          ${showPeriodColumn ? `<th class="num">Realisasi ${esc(periodLabel)} (Rp)</th>` : ""}
          <th class="num">Realisasi Kumulatif (Rp)</th>
          <th class="num">Sisa (Rp)</th>
          <th class="ctr">Serapan (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>A. Biaya Personel</td>
          <td class="num">${esc(formatCurrency(summary.personelBudget))}</td>
          ${showPeriodColumn ? `<td class="num">${esc(formatCurrency(summary.personelRealizedPeriod))}</td>` : ""}
          <td class="num">${esc(formatCurrency(summary.personelRealizedTotal))}</td>
          <td class="num">${esc(formatCurrency(summary.personelBudget - summary.personelRealizedTotal))}</td>
          <td class="ctr">${pct(summary.personelRealizedTotal, summary.personelBudget)}</td>
        </tr>
        <tr>
          <td>B. Biaya Nonpersonel</td>
          <td class="num">${esc(formatCurrency(summary.nonPersonelBudget))}</td>
          ${showPeriodColumn ? `<td class="num">${esc(formatCurrency(summary.nonPersonelRealizedPeriod))}</td>` : ""}
          <td class="num">${esc(formatCurrency(summary.nonPersonelRealizedTotal))}</td>
          <td class="num">${esc(formatCurrency(summary.nonPersonelBudget - summary.nonPersonelRealizedTotal))}</td>
          <td class="ctr">${pct(summary.nonPersonelRealizedTotal, summary.nonPersonelBudget)}</td>
        </tr>
        ${
          includePpn11
            ? `<tr>
                <td>PPN 11%</td>
                <td class="num">${esc(formatCurrency(summary.ppnBudget))}</td>
                ${showPeriodColumn ? `<td class="num">${esc(formatCurrency(summary.ppnRealizedPeriod))}</td>` : ""}
                <td class="num">${esc(formatCurrency(summary.ppnRealizedTotal))}</td>
                <td class="num">${esc(formatCurrency(summary.ppnBudget - summary.ppnRealizedTotal))}</td>
                <td class="ctr">${pct(summary.ppnRealizedTotal, summary.ppnBudget)}</td>
              </tr>`
            : ""
        }
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="num"><strong>${esc(formatCurrency(summary.grandTotalBudget))}</strong></td>
          ${showPeriodColumn ? `<td class="num"><strong>${esc(formatCurrency(summary.grandTotalRealizedPeriod))}</strong></td>` : ""}
          <td class="num"><strong>${esc(formatCurrency(summary.grandTotalRealizedTotal))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(summary.grandTotalRemaining))}</strong></td>
          <td class="ctr"><strong>${summary.overallSerapanPct.toFixed(1)}%</strong></td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderTemplate13(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, rabSummary, includePpn11, includeExtraCategories } = input;
  const periodMeta = SNT_PERIOD_OPTIONS.find((p) => p.key === input.periodKey) || SNT_PERIOD_OPTIONS[0];
  const evidenceChecks = asRecord<boolean>(draft.checklistBukti);
  const folderLinks = asRecord<string>(draft.folderLinks);

  const checkItems = [
    { key: "sk", label: "Kontrak, SK, dan surat tugas personel lengkap" },
    { key: "absensi", label: "Absensi dan log jam kerja fasilitator/personel" },
    { key: "transfer", label: "Bukti transfer honor dan gaji" },
    { key: "nota", label: "Kuitansi, nota, dan invoice nonpersonel" },
    { key: "perjadin", label: "Bukti perjalanan dinas Korwil (SPD, tiket, bill hotel)" },
    { key: "tot", label: "Daftar hadir pelatihan dan sertifikat ToT STEM.org" },
    { key: "lms", label: "Invoice LMS dan layanan langganan" },
    { key: "pajak", label: "Pajak (PPN, PPh) disetor dan bukti pembayaran tersedia" },
  ];

  const rowsHtml = rabSummary.officialRows
    .map((row) => {
      const link = folderLinks[row.id] || (row.withReceiptCount > 0 ? `${row.withReceiptCount}/${row.txCount} bukti di sistem` : "-");
      const kwtInfo = row.txCount > 0 ? ` (Kwt: ${row.withKwitansiCount}/${row.txCount})` : "";
      return `
        <tr>
          <td class="ctr">${esc(row.code)}</td>
          <td>${esc(row.name)}${row.volume ? `<div class="sub">${esc(row.volume)}</div>` : ""}</td>
          <td class="num">${esc(formatCurrency(row.budget))}</td>
          <td class="num">${esc(formatCurrency(row.realizedPeriod))}</td>
          <td class="num">${esc(formatCurrency(row.realizedTotal))}</td>
          <td class="num">${esc(formatCurrency(row.remaining))}</td>
          <td>${esc(row.requiredEvidence)}<div class="sub">${esc(kwtInfo)}</div></td>
          <td>${esc(link)}</td>
        </tr>
      `;
    })
    .join("");

  const extraSectionHtml =
    includeExtraCategories && rabSummary.extraRows.length > 0
      ? `
        <h3>Lampiran Tambahan: Pengeluaran di Luar RAB Resmi KAK (Kategori C &amp; Pengadaan IoT)</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Kode &amp; Uraian</th>
              <th class="num">Pagu Internal</th>
              <th class="num">Realisasi Total</th>
              <th class="ctr">Transaksi / Bukti</th>
            </tr>
          </thead>
          <tbody>
            ${rabSummary.extraRows
              .filter((r) => r.budget > 0 || r.realizedTotal > 0)
              .map(
                (r) => `
              <tr>
                <td>${esc(r.categoryName)}</td>
                <td>${esc(r.code)} - ${esc(r.name)}</td>
                <td class="num">${esc(formatCurrency(r.budget))}</td>
                <td class="num">${esc(formatCurrency(r.realizedTotal))}</td>
                <td class="ctr">${r.txCount} tx (${r.withReceiptCount} bukti)</td>
              </tr>`
              )
              .join("")}
            <tr class="total-row">
              <td colspan="2"><strong>Subtotal Tambahan (Di Luar RAB KAK A+B)</strong></td>
              <td class="num"><strong>${esc(formatCurrency(rabSummary.extraBudget))}</strong></td>
              <td class="num"><strong>${esc(formatCurrency(rabSummary.extraRealizedTotal))}</strong></td>
              <td class="ctr">-</td>
            </tr>
          </tbody>
        </table>
      `
      : "";

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 13 · KAK BAB XII.B &amp; XIII.4</div>
      <h1>LAPORAN PENGGUNAAN DANA</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <h2>Identitas Laporan</h2>
    <table class="meta-table">
      <tr><td class="meta-k">Periode Pelaporan</td><td>${esc(draft.periodeLabel || periodMeta.label)}</td></tr>
      <tr><td class="meta-k">Pelaksana Swakelola</td><td>${esc(profile.namaYayasan)}</td></tr>
      <tr><td class="meta-k">Pagu RAB Wilayah 2 ${includePpn11 ? "(Termasuk PPN 11%)" : "(Tanpa PPN 11%)"}</td><td><strong>${esc(formatCurrency(rabSummary.grandTotalBudget))}</strong></td></tr>
      <tr><td class="meta-k">Termin I (${profile.termin1Persen}%)</td><td>${esc(formatCurrency(rabSummary.termin1Pagu))}</td></tr>
      <tr><td class="meta-k">Termin II (${profile.termin2Persen}%)</td><td>${esc(formatCurrency(rabSummary.termin2Pagu))}</td></tr>
      <tr><td class="meta-k">Disusun oleh / Tanggal</td><td>${esc(profile.bagianAdministrasi)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
    </table>

    <h2>1. Realisasi per Baris RAB (Wilayah 2 — 6 Lokasi SNT)</h2>
    <table class="data-table compact">
      <thead>
        <tr>
          <th class="ctr" style="width:42px">Kode</th>
          <th>Uraian Item RAB</th>
          <th class="num">Pagu RAB</th>
          <th class="num">Realisasi Periode</th>
          <th class="num">Realisasi Total</th>
          <th class="num">Sisa</th>
          <th>Bukti yang Harus Ada</th>
          <th>Status / Link</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="subtotal-row">
          <td colspan="2"><strong>Subtotal Personel &amp; Nonpersonel (A + B)</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.subtotalOfficialBudget))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.subtotalOfficialRealizedPeriod))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.subtotalOfficialRealizedTotal))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.subtotalOfficialBudget - rabSummary.subtotalOfficialRealizedTotal))}</strong></td>
          <td colspan="2"></td>
        </tr>
        ${
          includePpn11
            ? `<tr>
                <td colspan="2">PPN 11%</td>
                <td class="num">${esc(formatCurrency(rabSummary.ppnBudget))}</td>
                <td class="num">${esc(formatCurrency(rabSummary.ppnRealizedPeriod))}</td>
                <td class="num">${esc(formatCurrency(rabSummary.ppnRealizedTotal))}</td>
                <td class="num">${esc(formatCurrency(rabSummary.ppnBudget - rabSummary.ppnRealizedTotal))}</td>
                <td colspan="2">Faktur pajak / NTPN</td>
              </tr>`
            : ""
        }
        <tr class="total-row">
          <td colspan="2"><strong>TOTAL PENGGUNAAN DANA</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.grandTotalBudget))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.grandTotalRealizedPeriod))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.grandTotalRealizedTotal))}</strong></td>
          <td class="num"><strong>${esc(formatCurrency(rabSummary.grandTotalRemaining))}</strong></td>
          <td colspan="2">Serapan: <strong>${rabSummary.overallSerapanPct.toFixed(1)}%</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>2. Indikator Penyerapan Dana</h2>
    <table class="meta-table">
      <tr><td class="meta-k">Realisasi Periode / Tahap I</td><td>${esc(formatCurrency(rabSummary.grandTotalRealizedPeriod))}</td></tr>
      <tr><td class="meta-k">Penyerapan terhadap Pagu Termin I (${profile.termin1Persen}%)</td><td><strong>${rabSummary.serapanTerhadapTermin1Pct.toFixed(1)}%</strong> ${rabSummary.eligibleForTermin2 ? "(Memenuhi syarat >= 80% Termin II)" : "(Di bawah ambang 80% Termin II)"}</td></tr>
      <tr><td class="meta-k">Realisasi Kumulatif Total</td><td>${esc(formatCurrency(rabSummary.grandTotalRealizedTotal))}</td></tr>
      <tr><td class="meta-k">Penyerapan Total terhadap Pagu (%)</td><td><strong>${rabSummary.overallSerapanPct.toFixed(1)}%</strong></td></tr>
    </table>

    <h2>3. Daftar Periksa Kelengkapan Bukti</h2>
    <ul class="check-list">
      ${checkItems
        .map(
          (c) => `<li>${evidenceChecks[c.key] ? "☑" : "☐"} ${esc(c.label)}</li>`
        )
        .join("")}
    </ul>
    ${draft.catatanTambahan ? `<p class="note-box"><strong>Catatan:</strong> ${nl2br(draft.catatanTambahan)}</p>` : ""}

    ${extraSectionHtml}

    <h2>4. Pernyataan</h2>
    <p>Dengan ini kami menyatakan bahwa dana telah digunakan sesuai RAB dan KAK, dan seluruh bukti pertanggungjawaban disimpan secara tertib untuk keperluan pemeriksaan.</p>
    ${renderSignatureBlock(
      "Disusun oleh,\nBagian Administrasi",
      profile.bagianAdministrasi,
      "Disetujui oleh,\nKetua Tim Pelaksana",
      profile.ketuaTimPelaksana,
      profile,
      { role: "Diterima oleh,\nPejabat Pembuat Komitmen (PPK)", name: profile.namaPpk }
    )}
  `;
}

function renderTemplate01(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, rabSummary, locationStats } = input;
  const cekTermin1 = asRecord<boolean>(draft.lampiranTermin1);
  const statusTotByLocation = asRecord<string>(draft.statusTotByLocation);
  const lampiranItems = [
    { key: "pks", label: "Perjanjian Kerja Sama Swakelola yang telah ditandatangani" },
    { key: "mitra", label: `Bukti kerja sama dengan mitra modul pembelajaran (${profile.namaMitraModul})` },
    { key: "skAhu", label: "SK AHU atau Akta Yayasan (Ketua Tim Pelaksana)" },
    { key: "cv", label: "Surat penugasan dan CV personel beserta bukti kualifikasi" },
    { key: "jadwalTot", label: "Jadwal ToT IN-1 dan daftar calon fasilitator Wilayah 2" },
  ];

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 01 · KAK BAB XII.B &amp; XIII.1 (SYARAT TERMIN I)</div>
      <h1>LAPORAN PENDAHULUAN</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <h2>Identitas Laporan</h2>
    <table class="meta-table">
      <tr><td class="meta-k">Satuan Kerja / PPK</td><td>${esc(profile.satkerPpk)} / ${esc(profile.namaPpk)}</td></tr>
      <tr><td class="meta-k">Pelaksana Swakelola</td><td>${esc(profile.namaYayasan)}</td></tr>
      <tr><td class="meta-k">Perjanjian Kerja Sama (PKS)</td><td>Nomor ${esc(profile.nomorPks || "-")}, tanggal ${esc(profile.tanggalPks)}</td></tr>
      <tr><td class="meta-k">Nilai Kerja Sama (Wilayah 2)</td><td>${esc(formatCurrency(rabSummary.grandTotalBudget))}</td></tr>
      <tr><td class="meta-k">Masa Pelaksanaan</td><td>${esc(profile.masaPelaksanaan)}</td></tr>
      <tr><td class="meta-k">Nomor &amp; Tanggal Laporan</td><td>${esc(draft.nomorLaporan || `${profile.nomorLaporanPrefix}/LP-01`)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
      <tr><td class="meta-k">Disusun oleh</td><td>${esc(profile.ketuaTimPelaksana)}, Ketua Tim Pelaksana</td></tr>
    </table>

    <h2>1. Pendahuluan</h2>
    <p><strong>Latar Belakang:</strong> ${nl2br(draft.latarBelakang || "Program Sekolah Nasional Terintegrasi (SNT) Tahun Ajaran 2026 diselenggarakan guna memastikan ketersediaan fasilitator pembelajaran Koding, Kecerdasan Artifisial (KKA), dan Robotika bagi peserta didik SMP dan SMA secara merata, mengacu pada Permendikdasmen No. 13/2025 dan Kepmendikdasmen No. 127/P/2025.")}</p>
    <p><strong>Maksud &amp; Tujuan:</strong> ${nl2br(draft.maksudTujuan || "Menyediakan fasilitator terlatih, perangkat pembelajaran KKA & Robotika, pembinaan ekstrakurikuler/kompetisi, serta monitoring dan evaluasi berkelanjutan pada 6 lokasi SNT di Wilayah 2.")}</p>
    <p><strong>Dasar Hukum:</strong> ${nl2br(draft.dasarHukum || "KAK Swakelola SNT 2026 Bab II, Perjanjian Kerja Sama Swakelola, serta perjanjian kerja sama mitra penyusunan modul pembelajaran.")}</p>

    <h2>2. Rencana Penempatan Personel &amp; Fasilitator Wilayah 2 (6 Lokasi SNT)</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th class="ctr" style="width:36px">No</th>
          <th>Kabupaten / Kota (Wilayah 2)</th>
          <th>Provinsi</th>
          <th>Nama Fasilitator Terdaftar di Sistem</th>
          <th class="ctr">Status ToT IN-1</th>
        </tr>
      </thead>
      <tbody>
        ${locationStats
          .map(
            (loc, i) => `
          <tr>
            <td class="ctr">${i + 1}</td>
            <td>${esc(loc.label)}</td>
            <td>${esc(loc.province)}</td>
            <td>${esc(loc.fasilitatorNames.length > 0 ? loc.fasilitatorNames.join(", ") : "-")}</td>
            <td class="ctr">${esc(statusTotByLocation[loc.locationId] || "Terjadwal / Lulus")}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2>3. Rencana Jadwal Pelaksanaan (Sep–Des 2026)</h2>
    <table class="data-table compact">
      <thead>
        <tr><th>Kegiatan</th><th class="ctr">Sep</th><th class="ctr">Okt</th><th class="ctr">Nov</th><th class="ctr">Des</th></tr>
      </thead>
      <tbody>
        <tr><td>Penyerahan Laporan Pendahuluan &amp; ToT IN-1</td><td class="ctr">●</td><td class="ctr"></td><td class="ctr"></td><td class="ctr"></td></tr>
        <tr><td>Penempatan Fasilitator di 6 Lokasi SNT Wilayah 2</td><td class="ctr">●</td><td class="ctr"></td><td class="ctr"></td><td class="ctr"></td></tr>
        <tr><td>Pembelajaran Intrakurikuler KKA &amp; Ekstrakurikuler Robotika</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td></tr>
        <tr><td>Kunjungan Monev Koordinator Wilayah (2 kali per lokasi)</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td></tr>
        <tr><td>Penyusunan Modul, Peta Talenta, &amp; Pembinaan Kompetisi</td><td class="ctr"></td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td></tr>
        <tr><td>Laporan Bulanan (Sep, Okt, Nov) &amp; Laporan Akhir</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td><td class="ctr">●</td></tr>
      </tbody>
    </table>

    <h2>4. Checklist Lampiran Syarat Termin I</h2>
    <ul class="check-list">
      ${lampiranItems.map((it) => `<li>${cekTermin1[it.key] ? "☑" : "☐"} ${esc(it.label)}</li>`).join("")}
    </ul>

    ${renderSignatureBlock(
      `Disusun oleh,\nKetua Tim Pelaksana — ${profile.namaYayasan}`,
      profile.ketuaTimPelaksana,
      "Mengetahui,\nPejabat Pembuat Komitmen (PPK)",
      profile.namaPpk,
      profile
    )}
  `;
}

function renderTemplate02(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, rabSummary, locationStats, includePpn11 } = input;
  const periodMeta = SNT_PERIOD_OPTIONS.find((p) => p.key === input.periodKey) || SNT_PERIOD_OPTIONS[0];
  const totalFasil = locationStats.reduce((s, l) => s + l.fasilitatorCount, 0);
  const totalLaporan = locationStats.reduce((s, l) => s + l.laporanCount, 0);
  const totalJpIntra = locationStats.reduce((s, l) => s + l.totalJpIntra, 0);
  const totalJpEkstra = locationStats.reduce((s, l) => s + l.totalJpEkstra, 0);

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 02 · KAK BAB IX &amp; XIII.2</div>
      <h1>LAPORAN BULANAN</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <h2>Identitas Laporan</h2>
    <table class="meta-table">
      <tr><td class="meta-k">Pelaksana Swakelola</td><td>${esc(profile.namaYayasan)}</td></tr>
      <tr><td class="meta-k">Laporan Bulanan ke- / Periode</td><td>${esc(draft.laporanKe || periodMeta.laporanKe)} / ${esc(draft.periodePelaporan || periodMeta.label)}</td></tr>
      <tr><td class="meta-k">Nomor &amp; Tanggal Laporan</td><td>${esc(draft.nomorLaporan || `${profile.nomorLaporanPrefix}/LB-${periodMeta.laporanKe}`)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
      <tr><td class="meta-k">Disusun oleh</td><td>${esc(profile.ketuaTimPelaksana)}, Ketua Tim Pelaksana</td></tr>
    </table>

    <h2>1. Ringkasan dan Indikator Capaian (Wilayah 2)</h2>
    <p>${nl2br(draft.ringkasanCapaian || `Pada periode ${periodMeta.label}, pelaksanaan pendampingan KKA dan Robotika di 6 lokasi SNT Wilayah 2 berjalan dengan ${totalFasil} personel fasilitator terdaftar, mencatat ${totalLaporan} laporan kegiatan (${totalJpIntra} JP intrakurikuler dan ${totalJpEkstra} JP ekstrakurikuler), serta serapan keuangan kumulatif mencapai ${rabSummary.overallSerapanPct.toFixed(1)}%.`)}</p>

    <table class="data-table">
      <thead>
        <tr><th>Indikator</th><th class="ctr">Target Wilayah 2</th><th class="ctr">Realisasi Terdata</th><th>Keterangan</th></tr>
      </thead>
      <tbody>
        <tr><td>SNT Terlayani (Wilayah 2)</td><td class="ctr">6 Lokasi</td><td class="ctr">${locationStats.filter((l) => l.fasilitatorCount > 0).length} Lokasi</td><td>Buton Tengah, Tidore, Kupang, Tebo, Tanjabtim, Minut</td></tr>
        <tr><td>Fasilitator Aktif Bertugas</td><td class="ctr">6–14 Personel</td><td class="ctr">${totalFasil}</td><td>Sesuai data fasilitator sistem</td></tr>
        <tr><td>Laporan Kegiatan &amp; JP Intrakurikuler</td><td class="ctr">Sesuai jadwal</td><td class="ctr">${totalLaporan} lap (${totalJpIntra} JP)</td><td>Tercatat di modul Laporan Mingguan</td></tr>
        <tr><td>JP Ekstrakurikuler Robotika</td><td class="ctr">Sesuai jadwal</td><td class="ctr">${totalJpEkstra} JP</td><td>Tercatat di modul Laporan Mingguan</td></tr>
      </tbody>
    </table>

    <h2>2. Progres per Lokasi SNT Wilayah 2</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Lokasi SNT (Wilayah 2)</th>
          <th class="ctr">Fasilitator</th>
          <th class="ctr">Laporan</th>
          <th class="ctr">JP Intra</th>
          <th class="ctr">JP Ekstra</th>
          <th class="ctr">Dokumentasi Foto</th>
        </tr>
      </thead>
      <tbody>
        ${locationStats
          .map(
            (l) => `
          <tr>
            <td>${esc(l.label)}</td>
            <td class="ctr">${l.fasilitatorCount}</td>
            <td class="ctr">${l.laporanCount}</td>
            <td class="ctr">${l.totalJpIntra}</td>
            <td class="ctr">${l.totalJpEkstra}</td>
            <td class="ctr">${l.dokumentasiCount}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2>3. Kendala, Solusi &amp; Rencana Kerja Bulan Berikutnya</h2>
    <p><strong>Kendala &amp; Solusi:</strong> ${nl2br(draft.kendalaSolusi || "Koordinasi jadwal sekolah, pengiriman perangkat pembelajaran, dan penyesuaian kalender kegiatan diselesaikan bersama Kepala Sekolah dan Koordinator Wilayah.")}</p>
    <p><strong>Rencana Bulan Berikutnya:</strong> ${nl2br(draft.rencanaBulanDepan || "Melanjutkan pendampingan KKA & Robotika, pemantauan target JP bulanan, kunjungan monev Koordinator Wilayah, serta pelengkapan bukti pertanggungjawaban keuangan.")}</p>

    <h2>4. Laporan Penggunaan Dana (Bab 8 Template 02)</h2>
    ${renderBudgetGroupTable(rabSummary, includePpn11, true, periodMeta.laporanKe)}
    <p class="sub">Rincian per baris RAB dan daftar bukti terlampir pada Template 13: Laporan Penggunaan Dana.</p>

    ${renderSignatureBlock(
      `Disusun oleh,\nKetua Tim Pelaksana — ${profile.namaYayasan}`,
      profile.ketuaTimPelaksana,
      "Diterima oleh,\nPPK / Tim Pengawas",
      profile.namaPpk,
      profile
    )}
  `;
}

function renderTemplate03(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, rabSummary, locationStats, includePpn11 } = input;
  const totalLaporan = locationStats.reduce((s, l) => s + l.laporanCount, 0);
  const totalJpIntra = locationStats.reduce((s, l) => s + l.totalJpIntra, 0);
  const totalJpEkstra = locationStats.reduce((s, l) => s + l.totalJpEkstra, 0);

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 03 · KAK BAB XI &amp; XIII.3</div>
      <h1>LAPORAN AKHIR</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <h2>Identitas Laporan</h2>
    <table class="meta-table">
      <tr><td class="meta-k">Pelaksana Swakelola</td><td>${esc(profile.namaYayasan)}</td></tr>
      <tr><td class="meta-k">Perjanjian Kerja Sama</td><td>Nomor ${esc(profile.nomorPks || "-")}, tanggal ${esc(profile.tanggalPks)}</td></tr>
      <tr><td class="meta-k">Masa Pelaksanaan</td><td>${esc(profile.masaPelaksanaan)}</td></tr>
      <tr><td class="meta-k">Nomor &amp; Tanggal Laporan</td><td>${esc(draft.nomorLaporan || `${profile.nomorLaporanPrefix}/LA-FINAL`)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
      <tr><td class="meta-k">Disusun oleh</td><td>${esc(profile.ketuaTimPelaksana)}, Ketua Tim Pelaksana</td></tr>
    </table>

    <h2>Ringkasan Eksekutif</h2>
    <p>${nl2br(draft.ringkasanEksekutif || `Pelaksanaan program KKA & Robotika SNT Wilayah 2 mencakup 6 lokasi SNT dengan total ${totalLaporan} laporan kegiatan (${totalJpIntra} JP intrakurikuler, ${totalJpEkstra} JP ekstrakurikuler) dan realisasi anggaran kumulatif sebesar ${formatCurrency(rabSummary.grandTotalRealizedTotal)} (${rabSummary.overallSerapanPct.toFixed(1)}% dari pagu Wilayah 2).`)}</p>

    <h2>Bab I–II. Narasi Pelaksanaan Pekerjaan</h2>
    <p>${nl2br(draft.narasiPelaksanaan || "Seluruh rangkaian kegiatan meliputi pelatihan dan sertifikasi fasilitator, pembelajaran intrakurikuler KKA, pembinaan ekstrakurikuler Robotika, persiapan kompetisi, serta monitoring dan evaluasi Koordinator Wilayah 2 telah dilaksanakan sesuai ruang lingkup KAK.")}</p>

    <h2>Bab III–V. Capaian Keluaran, Kendala &amp; Rekomendasi Keberlanjutan</h2>
    <p><strong>Capaian Keluaran &amp; Outcome:</strong> ${nl2br(draft.capaianKeluaran || "Fasilitator bertugas di seluruh 6 lokasi SNT Wilayah 2, dokumentasi kegiatan dan rekap honorarium bulanan terdokumentasi di sistem, serta pengadaan perangkat pendukung pembelajaran telah disalurkan.")}</p>
    <p><strong>Kendala, Solusi &amp; Rekomendasi Keberlanjutan:</strong> ${nl2br(draft.rekomendasi || "Disarankan keberlanjutan pendampingan guru lokal serta penguatan sarana praktik IoT/Robotika untuk menjaga kesinambungan program pascakontrak.")}</p>

    <h2>Bab VIII. Laporan Penggunaan Dana</h2>
    ${renderBudgetGroupTable(rabSummary, includePpn11, false, "Akhir")}

    ${renderSignatureBlock(
      `Disusun oleh,\nKetua Tim Pelaksana — ${profile.namaYayasan}`,
      profile.ketuaTimPelaksana,
      "Diterima oleh,\nPejabat Pembuat Komitmen (PPK)",
      profile.namaPpk,
      profile
    )}
  `;
}

function renderTemplate04(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, locationStats, laporanKegiatan } = input;
  const periodMeta = SNT_PERIOD_OPTIONS.find((p) => p.key === input.periodKey) || SNT_PERIOD_OPTIONS[0];
  const totalLap = locationStats.reduce((s, l) => s + l.laporanCount, 0);
  const totalIntra = locationStats.reduce((s, l) => s + l.totalJpIntra, 0);
  const totalEkstra = locationStats.reduce((s, l) => s + l.totalJpEkstra, 0);

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 04 · LAMPIRAN A LAPORAN BULANAN</div>
      <h1>KOMPILASI LAPORAN BULANAN FASILITATOR &amp; DOKUMENTASI</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <table class="meta-table">
      <tr><td class="meta-k">Periode Kompilasi</td><td>${esc(periodMeta.label)}</td></tr>
      <tr><td class="meta-k">Disusun oleh</td><td>${esc(profile.bagianAdministrasi)}</td></tr>
      <tr><td class="meta-k">Total Laporan Kegiatan Terdata</td><td>${totalLap} laporan (${totalIntra} JP Intra · ${totalEkstra} JP Ekstra)</td></tr>
    </table>

    <h2>1. Rekap Penerimaan Laporan &amp; Pelaksanaan per Lokasi SNT Wilayah 2</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th class="ctr" style="width:32px">No</th>
          <th>Lokasi SNT (Wilayah 2)</th>
          <th>Fasilitator Terdaftar</th>
          <th class="ctr">Lap. Kegiatan</th>
          <th class="ctr">Rekap Honor</th>
          <th class="ctr">JP Intra</th>
          <th class="ctr">JP Ekstra</th>
          <th class="ctr">Foto</th>
        </tr>
      </thead>
      <tbody>
        ${locationStats
          .map(
            (l, i) => `
          <tr>
            <td class="ctr">${i + 1}</td>
            <td>${esc(l.label)}</td>
            <td>${esc(l.fasilitatorNames.join(", ") || "-")}</td>
            <td class="ctr">${l.laporanCount}</td>
            <td class="ctr">${l.rekapCount}</td>
            <td class="ctr">${l.totalJpIntra}</td>
            <td class="ctr">${l.totalJpEkstra}</td>
            <td class="ctr">${l.dokumentasiCount}</td>
          </tr>`
          )
          .join("")}
        <tr class="total-row">
          <td colspan="3"><strong>TOTAL WILAYAH 2</strong></td>
          <td class="ctr"><strong>${totalLap}</strong></td>
          <td class="ctr"><strong>${locationStats.reduce((s, l) => s + l.rekapCount, 0)}</strong></td>
          <td class="ctr"><strong>${totalIntra}</strong></td>
          <td class="ctr"><strong>${totalEkstra}</strong></td>
          <td class="ctr"><strong>${locationStats.reduce((s, l) => s + l.dokumentasiCount, 0)}</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>2. Daftar Log Aktivitas &amp; Dokumentasi Fasilitator Terbaru</h2>
    <table class="data-table compact">
      <thead>
        <tr>
          <th class="ctr" style="width:30px">No</th>
          <th>Tanggal</th>
          <th>Fasilitator / Lokasi</th>
          <th>Topik / Kegiatan</th>
          <th class="ctr">JP Intra/Ekstra</th>
          <th class="ctr">Dokumentasi</th>
        </tr>
      </thead>
      <tbody>
        ${
          laporanKegiatan.length === 0
            ? `<tr><td colspan="6" class="ctr">Belum ada catatan laporan kegiatan pada periode ini.</td></tr>`
            : laporanKegiatan
                .slice(0, 40)
                .map(
                  (lap, idx) => `
                <tr>
                  <td class="ctr">${idx + 1}</td>
                  <td>${esc(formatDateId(lap.date))}</td>
                  <td>${esc(lap.fasilitator?.namaLengkap || "-")}<div class="sub">${esc(lap.fasilitator?.lokasiSNT || "")}</div></td>
                  <td>${esc(lap.topic || "-")}</td>
                  <td class="ctr">${lap.jumlahJPIntra || 0} / ${lap.jumlahJPEkstra || 0}</td>
                  <td class="ctr">${lap.foto1 || lap.foto2 ? "Tersedia" : "-"}</td>
                </tr>`
                )
                .join("")
        }
      </tbody>
    </table>
    ${draft.catatanKompilasi ? `<p class="note-box"><strong>Catatan Kompilasi:</strong> ${nl2br(draft.catatanKompilasi)}</p>` : ""}

    ${renderSignatureBlock(
      "Disusun oleh,\nTenaga Administrasi",
      profile.bagianAdministrasi,
      "Diketahui oleh,\nKoordinator Wilayah 2",
      profile.koordinatorWilayah,
      profile
    )}
  `;
}

function renderTemplate11(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, auditRows } = input;
  const periodMeta = SNT_PERIOD_OPTIONS.find((p) => p.key === input.periodKey) || SNT_PERIOD_OPTIONS[0];
  const skorMap = asRecord<{ pemb?: number; hadir?: number; sarana?: number; murid?: number; lomba?: number; catatan?: string }>(draft.skorMonev);
  const perjadinRows = auditRows.filter((r) => ["2a", "2b", "2c"].includes(r.rabCode.toLowerCase()));

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 11 · KAK BAB VII &amp; IX</div>
      <h1>LAPORAN MONITORING &amp; EVALUASI KOORDINATOR WILAYAH 2</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <table class="meta-table">
      <tr><td class="meta-k">Wilayah / Koordinator</td><td>Wilayah 2 / ${esc(profile.koordinatorWilayah)}</td></tr>
      <tr><td class="meta-k">Periode</td><td>${esc(periodMeta.label)}</td></tr>
      <tr><td class="meta-k">Cakupan SNT (6 Lokasi)</td><td>${SNT_WILAYAH_2_LOCATIONS.map((l) => l.label).join(", ")}</td></tr>
    </table>

    <h2>1. Hasil Monitoring &amp; Evaluasi per SNT (Skala 1–4)</h2>
    <table class="data-table compact">
      <thead>
        <tr>
          <th>Lokasi SNT</th>
          <th class="ctr">Pembelajaran</th>
          <th class="ctr">Kehadiran</th>
          <th class="ctr">Sarana</th>
          <th class="ctr">Murid</th>
          <th class="ctr">Kompetisi</th>
          <th class="ctr">Rata-rata</th>
          <th>Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${SNT_WILAYAH_2_LOCATIONS.map((loc) => {
          const s = skorMap[loc.id] || {};
          const vals = [s.pemb, s.hadir, s.sarana, s.murid, s.lomba].filter((v): v is number => typeof v === "number" && v > 0);
          const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "-";
          return `
            <tr>
              <td>${esc(loc.label)}</td>
              <td class="ctr">${s.pemb || "-"}</td>
              <td class="ctr">${s.hadir || "-"}</td>
              <td class="ctr">${s.sarana || "-"}</td>
              <td class="ctr">${s.murid || "-"}</td>
              <td class="ctr">${s.lomba || "-"}</td>
              <td class="ctr"><strong>${avg}</strong></td>
              <td>${esc(s.catatan || "-")}</td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>

    <h2>2. Riwayat Kunjungan Lapangan &amp; Perjalanan Dinas Korwil (Sinkron Data Keuangan)</h2>
    <table class="data-table compact">
      <thead>
        <tr>
          <th class="ctr" style="width:30px">No</th>
          <th>Tanggal</th>
          <th>Pos RAB</th>
          <th>Uraian Kunjungan / Perjadin</th>
          <th class="num">Biaya (Rp)</th>
          <th class="ctr">Bukti / Kwt</th>
        </tr>
      </thead>
      <tbody>
        ${
          perjadinRows.length === 0
            ? `<tr><td colspan="6" class="ctr">Belum ada transaksi perjalanan dinas Korwil tercatat.</td></tr>`
            : perjadinRows
                .map(
                  (r, i) => `
              <tr>
                <td class="ctr">${i + 1}</td>
                <td>${esc(formatDateId(r.date))}</td>
                <td>${esc(r.rabCode)} - ${esc(r.rabName)}</td>
                <td>${esc(r.description)}</td>
                <td class="num">${esc(formatCurrency(r.amount))}</td>
                <td class="ctr">${r.hasReceipt ? "Ada Nota" : "Belum"} / ${r.noKwitansi || "Belum Kwt"}</td>
              </tr>`
                )
                .join("")
        }
      </tbody>
    </table>

    <h2>3. Kesimpulan &amp; Rekomendasi</h2>
    <p>${nl2br(draft.kesimpulanRekomendasi || "Pelaksanaan di 6 lokasi SNT Wilayah 2 berjalan baik; koordinasi rutin bersama kepala sekolah dan fasilitator terus dijaga untuk memastikan target pembelajaran dan administrasi tercapai.")}</p>

    ${renderSignatureBlock(
      "Dibuat oleh,\nKoordinator Wilayah 2",
      profile.koordinatorWilayah,
      "Diketahui oleh,\nKetua Tim Pelaksana",
      profile.ketuaTimPelaksana,
      profile
    )}
  `;
}

function renderTemplate12(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, rabSummary, locationStats, includePpn11 } = input;
  const totalFasil = locationStats.reduce((s, l) => s + l.fasilitatorCount, 0);
  const totalLap = locationStats.reduce((s, l) => s + l.laporanCount, 0);

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 12 · KAK BAB XI &amp; XIII</div>
      <h1>LAPORAN HASIL PEKERJAAN</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <table class="meta-table">
      <tr><td class="meta-k">PPK</td><td>${esc(profile.namaPpk)}</td></tr>
      <tr><td class="meta-k">Periode Pekerjaan</td><td>${esc(profile.masaPelaksanaan)}</td></tr>
      <tr><td class="meta-k">Disusun oleh / Tanggal</td><td>${esc(profile.ketuaTimPelaksana)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
    </table>

    <h2>1. Realisasi Keluaran terhadap Rencana (Wilayah 2)</h2>
    <table class="data-table">
      <thead>
        <tr><th>Keluaran</th><th class="ctr">Target</th><th class="ctr">Realisasi</th><th>Catatan / Bukti</th></tr>
      </thead>
      <tbody>
        <tr><td>Lokasi SNT Wilayah 2 Terlayani</td><td class="ctr">6 Lokasi</td><td class="ctr">${locationStats.filter((l) => l.fasilitatorCount > 0).length} Lokasi</td><td>Buton Tengah, Tidore, Kupang, Tebo, Tanjabtim, Minut</td></tr>
        <tr><td>Personel Fasilitator Bertugas</td><td class="ctr">Sesuai penempatan</td><td class="ctr">${totalFasil} Personel</td><td>Tercatat di sistem KKA SNT</td></tr>
        <tr><td>Laporan Kegiatan &amp; Dokumentasi</td><td class="ctr">Berkala</td><td class="ctr">${totalLap} Laporan</td><td>Dilampirkan di Template 04</td></tr>
        <tr><td>Laporan Pendahuluan, Bulanan &amp; Akhir</td><td class="ctr">Lengkap</td><td class="ctr">${esc(draft.realisasiDokumen || "Tersusun")}</td><td>Template 01, 02, 03, 13</td></tr>
      </tbody>
    </table>

    <h2>2. Penggunaan Dana Ringkas</h2>
    ${renderBudgetGroupTable(rabSummary, includePpn11, false, "Total")}

    <h2>3. Kesimpulan &amp; Keputusan PPK</h2>
    <p>${nl2br(draft.kesimpulan || "Pekerjaan penyediaan fasilitator pembelajaran KKA & Robotika di Wilayah 2 telah dilaksanakan sesuai ketentuan KAK dengan rincian pertanggungjawaban keuangan terlampir pada Template 13.")}</p>
    <ul class="check-list">
      <li>☐ Pekerjaan diterima sesuai KAK</li>
      <li>☐ Pekerjaan diterima dengan catatan perbaikan</li>
      <li>☐ Pekerjaan belum dapat diterima</li>
    </ul>
    <p>Catatan PPK: ________________________________________________________________________</p>

    ${renderSignatureBlock(
      "Diserahkan oleh,\nKetua Tim Pelaksana",
      profile.ketuaTimPelaksana,
      "Diterima oleh,\nPejabat Pembuat Komitmen (PPK)",
      profile.namaPpk,
      profile
    )}
  `;
}

function renderTemplate14(input: SntExportBundleInput, draft: DraftMap): string {
  const { profile, fasilitators, auditRows } = input;
  const totMap = asRecord<{ in1?: string; on?: string; in2?: string; certNo?: string; status?: string }>(draft.matriksTot);
  const stemRows = auditRows.filter((r) => ["4a", "4b", "4c"].includes(r.rabCode.toLowerCase()));

  return `
    ${renderKopSurat(profile)}
    <div class="doc-header">
      <div class="doc-badge">TEMPLATE 14 · KAK BAB III &amp; XI</div>
      <h1>LAPORAN PENYELESAIAN KUALIFIKASI ToT FASILITATOR</h1>
      <p class="doc-subtitle">${esc(profile.paketPekerjaan)}</p>
    </div>

    <table class="meta-table">
      <tr><td class="meta-k">Penyelenggara / Mitra</td><td>${esc(profile.namaMitraModul)}</td></tr>
      <tr><td class="meta-k">Periode Pelatihan</td><td>${esc(draft.periodeTot || "September – Oktober 2026")}</td></tr>
      <tr><td class="meta-k">Disusun oleh / Tanggal</td><td>${esc(profile.timProgram)} / ${esc(formatDateId(profile.tanggalLaporan))}</td></tr>
    </table>

    <h2>1. Matriks Kualifikasi Fasilitator Wilayah 2</h2>
    <table class="data-table compact">
      <thead>
        <tr>
          <th class="ctr" style="width:30px">No</th>
          <th>Nama Fasilitator</th>
          <th>Lokasi SNT</th>
          <th class="ctr">Jam IN-1</th>
          <th class="ctr">Jam ON</th>
          <th class="ctr">Jam IN-2</th>
          <th>No. Sertifikat STEM.org</th>
          <th class="ctr">Status</th>
        </tr>
      </thead>
      <tbody>
        ${fasilitators
          .map((f, idx) => {
            const m = totMap[f.id] || {};
            return `
            <tr>
              <td class="ctr">${idx + 1}</td>
              <td>${esc(f.namaLengkap)}</td>
              <td>${esc(f.lokasiSNT || "-")}</td>
              <td class="ctr">${esc(m.in1 || "-")}</td>
              <td class="ctr">${esc(m.on || "-")}</td>
              <td class="ctr">${esc(m.in2 || "-")}</td>
              <td>${esc(m.certNo || "-")}</td>
              <td class="ctr">${esc(m.status || "Lulus")}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>

    <h2>2. Sinkronisasi Realisasi Biaya Pelatihan &amp; Sertifikasi (Pos 4a/4b/4c)</h2>
    <table class="data-table compact">
      <thead>
        <tr><th>Tanggal</th><th>Pos RAB</th><th>Uraian</th><th class="num">Nominal</th><th class="ctr">Status Bukti</th></tr>
      </thead>
      <tbody>
        ${
          stemRows.length === 0
            ? `<tr><td colspan="5" class="ctr">Belum ada transaksi realisasi di pos 4a/4b/4c.</td></tr>`
            : stemRows
                .map(
                  (r) => `
              <tr>
                <td>${esc(formatDateId(r.date))}</td>
                <td>${esc(r.rabCode)} - ${esc(r.rabName)}</td>
                <td>${esc(r.description)}</td>
                <td class="num">${esc(formatCurrency(r.amount))}</td>
                <td class="ctr">${r.hasReceipt ? "Ada Bukti" : "Belum Ada Bukti"} / ${r.noKwitansi || "Belum Kwt"}</td>
              </tr>`
                )
                .join("")
        }
      </tbody>
    </table>

    <h2>3. Evaluasi &amp; Catatan Pelatihan</h2>
    <p>${nl2br(draft.evaluasiTot || "Pelatihan in-service (IN-1), pendampingan lapangan (ON), dan evaluasi akhir (IN-2) telah dilaksanakan untuk memastikan kesiapan teknis fasilitator KKA & Robotika di 6 lokasi Wilayah 2.")}</p>

    ${renderSignatureBlock(
      "Disusun oleh,\nTim Program Koding, KA & Robotika",
      profile.timProgram,
      "Disetujui oleh,\nKetua Tim Pelaksana",
      profile.ketuaTimPelaksana,
      profile
    )}
  `;
}

function renderKwitansiPages(rows: KwitansiAuditRow[], profile: SntReportProfile): string {
  const withKwt = rows.filter((r) => r.hasKwitansi);
  if (withKwt.length === 0) return "";

  return withKwt
    .map(
      (r, idx) => `
      <div class="page-break">
        ${renderKopSurat(profile)}
        <div class="kwt-box">
          <div class="kwt-header">
            <div>
              <div class="kwt-title">KWITANSI PEMBAYARAN</div>
              <div class="sub">Lampiran Pertanggungjawaban Keuangan SNT Wilayah 2 (${idx + 1}/${withKwt.length})</div>
            </div>
            <div class="kwt-no">No: ${esc(r.noKwitansi)}</div>
          </div>
          <table class="meta-table">
            <tr><td class="meta-k">Sudah Terima Dari</td><td><strong>${esc(profile.namaYayasan)}</strong></td></tr>
            <tr><td class="meta-k">Uang Sejumlah</td><td><em>${esc(terbilangRupiah(r.amount))}</em></td></tr>
            <tr><td class="meta-k">Untuk Pembayaran</td><td>${esc(r.description)}<div class="sub">Pos RAB: ${esc(r.rabCode)} - ${esc(r.rabName)}</div></td></tr>
            <tr><td class="meta-k">Tanggal Transaksi</td><td>${esc(formatDateId(r.date))}</td></tr>
          </table>
          <div class="kwt-footer">
            <div class="kwt-amount-box">Terbilang: ${esc(formatCurrency(r.amount))}</div>
            <div class="kwt-sign">
              <div>${esc(profile.kotaPengesahan || "Jakarta")}, ${esc(formatDateId(r.date))}</div>
              <div class="sign-role">Penerima / Yang Menyerahkan,</div>
              <div class="sign-space"></div>
              <div class="sign-name">${esc(r.penerima)}</div>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function renderAllReceiptPages(rows: KwitansiAuditRow[]): string {
  const chunks: string[] = [];
  for (const r of rows) {
    const urls = getExpenseReceiptUrls(r.rawExpense);
    if (urls.length === 0) continue;
    const html = renderReceiptAttachmentPagesHtml(urls);
    if (html) {
      chunks.push(`
        <div class="receipt-group">
          <div class="page-break receipt-cover">
            <h3>Lampiran Bukti: ${esc(r.rabCode)} - ${esc(r.rabName)}</h3>
            <p>${esc(r.description)} · ${esc(formatDateId(r.date))} · <strong>${esc(formatCurrency(r.amount))}</strong>${r.noKwitansi ? ` · Kwitansi: ${esc(r.noKwitansi)}` : ""}</p>
          </div>
          ${html}
        </div>
      `);
    }
  }
  return chunks.join("");
}

export function renderSntReportBundleHtml(input: SntExportBundleInput): string {
  const sections: string[] = [];

  for (const code of input.selectedTemplates) {
    const draft = input.drafts[code] || {};
    let body = "";
    switch (code) {
      case "01":
        body = renderTemplate01(input, draft);
        break;
      case "02":
        body = renderTemplate02(input, draft);
        break;
      case "03":
        body = renderTemplate03(input, draft);
        break;
      case "04":
        body = renderTemplate04(input, draft);
        break;
      case "11":
        body = renderTemplate11(input, draft);
        break;
      case "12":
        body = renderTemplate12(input, draft);
        break;
      case "13":
        body = renderTemplate13(input, draft);
        break;
      case "14":
        body = renderTemplate14(input, draft);
        break;
    }
    if (body) {
      sections.push(
        `<section class="report-doc${sections.length > 0 ? " page-break" : ""}">${body}</section>`
      );
    }
  }

  if (input.includeKwitansiPages) {
    const kwtHtml = renderKwitansiPages(input.auditRows, input.profile);
    if (kwtHtml) sections.push(kwtHtml);
  }

  if (input.includeReceiptAttachments) {
    const rctHtml = renderAllReceiptPages(input.auditRows);
    if (rctHtml) sections.push(rctHtml);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Paket Laporan SNT Wilayah 2 — Export PDF</title>
  <style>
    @page { size: A4; margin: 15mm 14mm 15mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 16px;
      background: #f8fafc;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .print-toolbar button {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .sheet-container {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
    }
    .page-break { page-break-before: always; break-before: page; }
    .kop-wrap { border-bottom: 3px solid #1e293b; padding-bottom: 8px; margin-bottom: 14px; text-align: center; }
    .kop-img { width: 100%; max-height: 110px; object-fit: contain; }
    .doc-header { text-align: center; margin-bottom: 14px; }
    .doc-badge { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 99px; margin-bottom: 6px; }
    h1 { font-size: 16px; margin: 4px 0; text-transform: uppercase; letter-spacing: 0.02em; }
    .doc-subtitle { font-size: 10px; color: #475569; margin: 0; }
    h2 { font-size: 12px; color: #0f172a; border-left: 3px solid #2563eb; padding-left: 8px; margin: 16px 0 8px 0; }
    h3 { font-size: 11px; color: #1e293b; margin: 14px 0 6px 0; }
    p { margin: 4px 0 8px 0; text-align: justify; }
    .sub { font-size: 9px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .meta-table td { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; }
    .meta-k { width: 32%; background: #f8fafc; font-weight: 600; color: #334155; }
    .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 5px 6px; vertical-align: top; }
    .data-table th { background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: left; }
    .data-table.compact th, .data-table.compact td { font-size: 9.5px; padding: 4px 5px; }
    .num { text-align: right !important; white-space: nowrap; }
    .ctr { text-align: center !important; }
    .subtotal-row td { background: #f1f5f9; }
    .total-row td { background: #dbeafe; }
    .check-list { list-style: none; padding-left: 4px; margin: 6px 0 10px 0; columns: 2; }
    .check-list li { margin-bottom: 4px; font-size: 10.5px; }
    .note-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 6px; }
    .sign-date { text-align: right; margin-top: 18px; margin-bottom: 6px; font-size: 10.5px; }
    .sign-table td { border: none; text-align: center; vertical-align: top; padding: 4px 8px; }
    .sign-role { font-weight: 600; white-space: pre-line; font-size: 10.5px; }
    .sign-space { height: 54px; }
    .sign-name { font-weight: 700; text-decoration: underline; font-size: 11px; }
    .kwt-box { border: 2px solid #1e293b; border-radius: 8px; padding: 16px; }
    .kwt-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 12px; }
    .kwt-title { font-size: 16px; font-weight: 800; letter-spacing: 0.05em; }
    .kwt-no { font-family: monospace; font-size: 12px; font-weight: 700; background: #eff6ff; border: 1px solid #93c5fd; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; }
    .kwt-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; }
    .kwt-amount-box { font-size: 14px; font-weight: 800; background: #f1f5f9; border: 2px solid #0f172a; padding: 8px 14px; border-radius: 6px; }
    .kwt-sign { text-align: center; min-width: 220px; }
    .receipt-cover { padding: 16px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-toolbar { display: none !important; }
      .sheet-container { max-width: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div>
      <strong>Paket Laporan SNT Wilayah 2</strong> — ${input.selectedTemplates.length} template terpilih${input.includeKwitansiPages ? " + Kwitansi" : ""}${input.includeReceiptAttachments ? " + Lampiran Nota" : ""}
    </div>
    <button type="button" onclick="window.print()">Cetak / Simpan sebagai PDF (A4)</button>
  </div>
  <div class="sheet-container">
    ${sections.join("\n")}
  </div>
</body>
</html>`;
}

export interface StandaloneKwitansiPdfItem {
  noKwitansi: string;
  tanggal: string;
  sudahTerimaDari: string;
  perihal: string;
  rabLabel: string;
  penerima: string;
  amount: number;
  receiptUrls?: string[];
}

export function renderStandaloneKwitansiPdfHtml(input: {
  items: StandaloneKwitansiPdfItem[];
  kopSurat: KopSuratOption;
  kotaPengesahan: string;
  includeReceipts: boolean;
  profile?: Partial<SntReportProfile>;
}): string {
  const pagesHtml = input.items
    .map((item, idx) => {
      const receiptsHtml =
        input.includeReceipts && item.receiptUrls && item.receiptUrls.length > 0
          ? renderReceiptAttachmentPagesHtml(item.receiptUrls)
          : "";

      return `
        <section class="kwt-page${idx > 0 ? " page-break" : ""}">
          ${renderModernKuitansiHtml({
            kopSurat: input.kopSurat,
            profile: input.profile,
            noKwitansi: item.noKwitansi,
            sudahTerimaDari: item.sudahTerimaDari,
            amount: item.amount,
            untukPembayaran: item.perihal,
            rabCode: item.rabLabel || undefined,
            showRabCode: Boolean(item.rabLabel),
            kota: input.kotaPengesahan || "Jakarta",
            tanggal: item.tanggal,
            penerimaDisplay: item.penerima,
            penerimaRole: "Yang menerima,",
          })}
          ${receiptsHtml}
        </section>
      `;
    })
    .join("\n");

  const docTitle =
    input.items.length === 1
      ? `Kwitansi ${input.items[0].noKwitansi}`
      : `Kumpulan Kwitansi SNT (${input.items.length} Dokumen)`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${esc(docTitle)}</title>
  <style>
    @page { size: A4; margin: 15mm 14mm 15mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 16px;
      background: #f1f5f9;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      margin: 0 auto 16px auto;
      max-width: 820px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      font-size: 12px;
    }
    .print-toolbar button {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .kwt-container {
      max-width: 820px;
      margin: 0 auto;
    }
    .page-break { page-break-before: always; break-before: page; }
    .kwt-card {
      background: #fff;
      border: 2px solid #000;
      padding: 30px 32px;
      margin-bottom: 20px;
    }
    .kwt-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 22px;
    }
    .kwt-kop-img {
      max-height: 62px;
      max-width: 440px;
      object-fit: contain;
    }
    .kwt-head-right { text-align: right; }
    .kwt-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .kwt-no {
      margin-top: 4px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .kwt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      margin-bottom: 24px;
    }
    .kwt-table td { padding: 7px 0; vertical-align: top; }
    .kwt-label { width: 165px; color: #334155; }
    .kwt-colon { width: 14px; }
    .kwt-terbilang {
      background: #f3f4f6;
      padding: 8px 12px !important;
      font-style: italic;
      font-weight: 600;
      border-radius: 4px;
    }
    .kwt-sub {
      margin-top: 4px;
      font-size: 11px;
      color: #64748b;
    }
    .kwt-foot {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 8px;
    }
    .kwt-amount {
      border: 2px solid #000;
      background: #f8fafc;
      padding: 10px 22px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 19px;
      font-weight: 800;
    }
    .kwt-sign { text-align: center; min-width: 230px; }
    .kwt-sign-date { font-size: 13px; color: #334155; }
    .kwt-sign-space { height: 58px; }
    .kwt-sign-name {
      font-size: 14px;
      font-weight: 700;
      text-decoration: underline;
    }
    .kwt-sign-role {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .print-toolbar { display: none !important; }
      .kwt-container { max-width: none; }
      .kwt-card { margin-bottom: 0; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div><strong>${esc(docTitle)}</strong>${input.includeReceipts ? " · Termasuk Lampiran Bukti Nota" : ""}</div>
    <button type="button" onclick="window.print()">Cetak / Simpan PDF (A4)</button>
  </div>
  <div class="kwt-container">
    ${pagesHtml}
  </div>
</body>
</html>`;
}
