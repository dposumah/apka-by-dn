import { formatCurrency, terbilangRupiah } from "./format";
import {
  renderBrandKopHtml,
  renderModernInvoiceHtml,
  renderModernKuitansiHtml,
  resolveBrandKopTheme,
} from "./snt-brand-kop";
import {
  EvidenceDocType,
  GenericEvidenceDraft,
  MonthlyHonorReceiptSheet,
  RecipientMode,
  resolveRecipientDisplay,
  SewaRumahContractDraft,
} from "./snt-evidence-docs";
import { KopSuratOption, SntReportProfile } from "./snt-report-templates";

function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateId(dateInput?: string | Date | null): string {
  if (!dateInput) return "............................ 2026";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function renderKop(kop: KopSuratOption, profile?: Partial<SntReportProfile>): string {
  return renderBrandKopHtml(kop, profile);
}

function renderKwitansiSlipHtml(params: {
  kopSurat: KopSuratOption;
  profile?: Partial<SntReportProfile>;
  noKwitansi: string;
  sudahTerimaDari: string;
  amount: number;
  untukPembayaran: string;
  rabCode?: string;
  showRabCode?: boolean;
  subLabel?: string;
  kota: string;
  tanggal: string;
  penerimaDisplay: string;
  penerimaRole: string;
  penerimaJabatan?: string;
}): string {
  return renderModernKuitansiHtml({
    kopSurat: params.kopSurat,
    profile: params.profile,
    noKwitansi: params.noKwitansi,
    sudahTerimaDari: params.sudahTerimaDari,
    amount: params.amount,
    untukPembayaran: params.untukPembayaran,
    rabCode: params.rabCode,
    showRabCode: params.showRabCode,
    subLabel: params.subLabel,
    kota: params.kota,
    tanggal: params.tanggal,
    penerimaDisplay: params.penerimaDisplay,
    penerimaRole: params.penerimaRole,
    penerimaJabatan: params.penerimaJabatan,
  });
}

export function renderMonthlyFacilitatorHonorPdfHtml(input: {
  sheet: MonthlyHonorReceiptSheet;
  profile: SntReportProfile;
  kopSuratOverride?: KopSuratOption;
  includeTransportColumn: boolean;
  recipientMode: RecipientMode;
  tanggalCetak: string;
  includeIndividualKwitansi?: boolean;
}): string {
  const { sheet, profile, includeTransportColumn, recipientMode, tanggalCetak } = input;
  const activeKop = input.kopSuratOverride || profile.kopSurat;
  const theme = resolveBrandKopTheme(activeKop, profile);
  const sudahTerimaDari =
    activeKop === "maleo"
      ? "Yayasan Maleo Talenta Cendekia"
      : activeKop === "lpd"
        ? "LPD Jully Tjindrawan Robotik"
        : activeKop === "robotic"
          ? "Robotic Explorer (PT Jully Tjindrawan Robotik)"
          : profile.namaYayasan;
  const isRabSatuan = sheet.pricingMode === "RAB_SATUAN";

  const bodyRows = sheet.rows
    .map((r, idx) => {
      const displayName = resolveRecipientDisplay(recipientMode, r.nama);
      const ttdZigZag =
        idx % 2 === 0
          ? `<div style="text-align:left;">${idx + 1}. ....................</div>`
          : `<div style="text-align:right;">${idx + 1}. ....................</div>`;
      if (isRabSatuan) {
        return `
        <tr>
          <td class="ctr">${idx + 1}</td>
          <td><strong>${esc(displayName)}</strong></td>
          <td>${esc(r.lokasi)}</td>
          <td class="ctr">1 Bulan</td>
          <td class="num">${esc(formatCurrency(r.hargaSatuanReal))}</td>
          <td class="num"><strong>${esc(formatCurrency(r.totalHonor))}</strong></td>
          ${includeTransportColumn ? `<td class="num">${esc(formatCurrency(r.totalTransport))}</td>` : ""}
          <td class="ttd-cell">${ttdZigZag}</td>
        </tr>`;
      }
      return `
      <tr>
        <td class="ctr">${idx + 1}</td>
        <td><strong>${esc(displayName)}</strong></td>
        <td>${esc(r.lokasi)}</td>
        <td class="ctr">${r.jpIntra}</td>
        <td class="ctr">${r.jpEkstra}</td>
        <td class="ctr"><strong>${r.totalJP}</strong></td>
        <td class="num">${esc(formatCurrency(r.hargaSatuanReal))}</td>
        <td class="num"><strong>${esc(formatCurrency(r.totalHonor))}</strong></td>
        ${includeTransportColumn ? `<td class="num">${esc(formatCurrency(r.totalTransport))}</td>` : ""}
        <td class="ttd-cell">${ttdZigZag}</td>
      </tr>`;
    })
    .join("");

  const kwtPages = input.includeIndividualKwitansi
    ? sheet.rows
        .map(
          (r, idx) => `
        <div class="page-break">
          ${renderKwitansiSlipHtml({
            kopSurat: activeKop,
            profile,
            noKwitansi: `KWT/HONOR/${sheet.monthKey}/${String(idx + 1).padStart(2, "0")}`,
            sudahTerimaDari,
            amount: r.totalHonor,
            untukPembayaran: isRabSatuan
              ? `Honorarium Fasilitator KKA & Robotika Bulan ${sheet.monthLabel} Lokasi SNT ${r.lokasi}`
              : `Honorarium Fasilitator KKA & Robotika Bulan ${sheet.monthLabel} Lokasi SNT ${r.lokasi} (${r.totalJP} JP × ${formatCurrency(r.hargaSatuanReal)}/JP)`,
            showRabCode: false,
            kota: profile.kotaPengesahan || "Jakarta",
            tanggal: tanggalCetak,
            penerimaDisplay: resolveRecipientDisplay(recipientMode, r.nama),
            penerimaRole: "Fasilitator,",
          })}
        </div>`
        )
        .join("")
    : "";

  const headBg = `background:${theme.primaryColor}; color:#fff;`;
  const tableHead = isRabSatuan
    ? `
          <tr style="${headBg}">
            <th class="ctr" style="width:28px; ${headBg}">No</th>
            <th style="${headBg}">Nama Fasilitator</th>
            <th style="${headBg}">Lokasi SNT</th>
            <th class="ctr" style="${headBg}">Satuan</th>
            <th class="num" style="${headBg}">Harga Satuan (Rp)</th>
            <th class="num" style="${headBg}">Jumlah Honor (Rp)</th>
            ${includeTransportColumn ? `<th class="num" style="${headBg}">Info Transport (Rp)</th>` : ""}
            <th class="ctr" style="width:130px; ${headBg}">Tanda Tangan</th>
          </tr>`
    : `
          <tr style="${headBg}">
            <th class="ctr" style="width:28px; ${headBg}">No</th>
            <th style="${headBg}">Nama Fasilitator</th>
            <th style="${headBg}">Lokasi SNT</th>
            <th class="ctr" style="${headBg}">JP Intra</th>
            <th class="ctr" style="${headBg}">JP Ekstra</th>
            <th class="ctr" style="${headBg}">Total JP</th>
            <th class="num" style="${headBg}">Harga Satuan Real / JP</th>
            <th class="num" style="${headBg}">Jumlah Honor (Rp)</th>
            ${includeTransportColumn ? `<th class="num" style="${headBg}">Info Transport (Rp)</th>` : ""}
            <th class="ctr" style="width:130px; ${headBg}">Tanda Tangan</th>
          </tr>`;

  const emptyColSpan = isRabSatuan
    ? includeTransportColumn
      ? 8
      : 7
    : includeTransportColumn
      ? 10
      : 9;

  const totalRowHtml = isRabSatuan
    ? `
          <tr class="total-row">
            <td colspan="5"><strong>TOTAL HONORARIUM FASILITATOR BULAN ${esc(sheet.monthLabel.toUpperCase())} (${sheet.rows.length} LOKASI)</strong></td>
            <td class="num"><strong>${esc(formatCurrency(sheet.totalHonor))}</strong></td>
            ${includeTransportColumn ? `<td class="num"><strong>${esc(formatCurrency(sheet.totalTransport))}</strong></td>` : ""}
            <td></td>
          </tr>`
    : `
          <tr class="total-row">
            <td colspan="3"><strong>TOTAL REALISASI HONOR BULAN ${esc(sheet.monthLabel.toUpperCase())}</strong></td>
            <td class="ctr"><strong>${sheet.totalJpIntra}</strong></td>
            <td class="ctr"><strong>${sheet.totalJpEkstra}</strong></td>
            <td class="ctr"><strong>${sheet.totalJP}</strong></td>
            <td class="num">-</td>
            <td class="num"><strong>${esc(formatCurrency(sheet.totalHonor))}</strong></td>
            ${includeTransportColumn ? `<td class="num"><strong>${esc(formatCurrency(sheet.totalTransport))}</strong></td>` : ""}
            <td></td>
          </tr>`;

  return wrapPrintableHtml(
    `Daftar Tanda Terima Honor Fasilitator — ${sheet.monthLabel}`,
    `
      ${renderKop(activeKop, profile)}
      <div class="doc-head">
        <h1 style="color:${theme.primaryColor};">DAFTAR TANDA TERIMA HONORARIUM FASILITATOR KKA &amp; ROBOTIKA</h1>
        <p class="subtitle">Periode: <strong>${esc(sheet.monthLabel)}</strong> · Wilayah 2 (6 Lokasi SNT)${
          isRabSatuan ? "" : " · Berdasarkan Realisasi Harga Satuan Riil per JP"
        }</p>
      </div>

      <table class="data-table">
        <thead>
          ${tableHead}
        </thead>
        <tbody>
          ${
            sheet.rows.length === 0
              ? `<tr><td colspan="${emptyColSpan}" class="ctr">Belum ada data honorarium pada bulan ini.</td></tr>`
              : bodyRows
          }
          ${totalRowHtml}
        </tbody>
      </table>

      <p class="terbilang-bar">Terbilang: <em>${esc(sheet.totalHonor > 0 ? terbilangRupiah(sheet.totalHonor) : "-")}</em></p>

      <div class="sign-date">${esc(profile.kotaPengesahan || "Jakarta")}, ${esc(formatDateId(tanggalCetak))}</div>
      <table class="sign-table">
        <tr>
          <td style="width:50%">
            <div class="sign-role">Disusun / Dibayarkan oleh,<br/>Bagian Administrasi &amp; Keuangan</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(profile.bagianAdministrasi)}</div>
          </td>
          <td style="width:50%">
            <div class="sign-role">Mengetahui / Menyetujui,<br/>Ketua Tim Pelaksana — ${esc(profile.namaYayasan)}</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(profile.ketuaTimPelaksana)}</div>
          </td>
        </tr>
      </table>

      ${kwtPages}
    `
  );
}

export function renderSewaRumahPdfHtml(input: {
  draft: SewaRumahContractDraft;
  profile: SntReportProfile;
  includeMonthlyKwitansi: boolean;
}): string {
  const { draft, profile, includeMonthlyKwitansi } = input;
  const sudahTerimaDari =
    profile.kopSurat === "maleo" ? "Yayasan Maleo Talenta Cendekia" : profile.namaYayasan;
  const pemilikDisplay = resolveRecipientDisplay(draft.recipientMode, draft.namaPemilik);
  const fasilDisplay = resolveRecipientDisplay(draft.recipientMode, draft.namaFasilitator);
  const totalKontrak = (Number(draft.jumlahBulan) || 0) * (Number(draft.tarifPerBulan) || 0);

  const months =
    draft.daftarBulan && draft.daftarBulan.length > 0
      ? draft.daftarBulan.slice(0, Math.max(1, draft.jumlahBulan))
      : Array.from({ length: Math.max(1, draft.jumlahBulan) }, (_, i) => `Bulan ke-${i + 1}`);

  const monthlySlips = includeMonthlyKwitansi
    ? months
        .map(
          (bulanLabel, idx) => `
        <div class="page-break">
          ${renderKwitansiSlipHtml({
            kopSurat: profile.kopSurat,
            profile,
            noKwitansi: `${draft.nomorKontrak || "KWT-SEWA"}/BLN-${String(idx + 1).padStart(2, "0")}`,
            sudahTerimaDari,
            amount: draft.tarifPerBulan,
            untukPembayaran: `Pembayaran Bantuan Sewa Rumah/Kost Fasilitator SNT (${draft.lokasiSnt}) — Periode ${bulanLabel}`,
            subLabel: `Alamat Sewa: ${draft.alamatRumahSewa || "................................"} · Penghuni: ${fasilDisplay}`,
            kota: draft.lokasiSnt || profile.kotaPengesahan || "Jakarta",
            tanggal: "",
            penerimaDisplay: pemilikDisplay,
            penerimaRole: "Pemilik / Pengelola Rumah (Penerima),",
          })}
        </div>`
        )
        .join("")
    : "";

  return wrapPrintableHtml(
    `Kontrak Sewa & Kwitansi Bulanan — ${draft.lokasiSnt}`,
    `
      ${renderKop(profile.kopSurat, profile)}
      <div class="doc-head">
        <div class="badge">POS RAB B.3b · TEMPLATE 13 BUKTI WAJIB</div>
        <h1>SURAT PERJANJIAN SEWA MENYEWA RUMAH / KOST</h1>
        <p class="subtitle">Nomor: ${esc(draft.nomorKontrak || "................................")}</p>
      </div>

      <p>Pada hari ini, tanggal ${esc(formatDateId(draft.tanggalKontrak))}, kami yang bertanda tangan di bawah ini:</p>
      <table class="meta-table">
        <tr><td class="meta-k"><strong>PIHAK PERTAMA (Pemilik/Pengelola)</strong></td><td>Nama: <strong>${esc(pemilikDisplay)}</strong><br/>NIK: ${esc(draft.nikPemilik || "................................")}<br/>Alamat: ${esc(draft.alamatPemilik || "................................................................")}</td></tr>
        <tr><td class="meta-k"><strong>PIHAK KEDUA (Penyewa / Pelaksana)</strong></td><td>Instansi: <strong>${esc(profile.namaYayasan)}</strong><br/>Diwakili oleh / Fasilitator: ${esc(fasilDisplay)}<br/>Lokasi Penugasan: ${esc(draft.lokasiSnt)}</td></tr>
      </table>

      <p>Kedua belah pihak sepakat mengadakan perjanjian sewa menyewa tempat tinggal (rumah/kost) untuk menunjang pelaksanaan tugas Fasilitator Program KKA &amp; Robotika SNT Tahun 2026 dengan ketentuan sebagai berikut:</p>
      <ol class="clause-list">
        <li><strong>Objek Sewa:</strong> Rumah / kamar kost berlokasi di ${esc(draft.alamatRumahSewa || "................................................................")} (${esc(draft.lokasiSnt)}).</li>
        <li><strong>Jangka Waktu:</strong> Selama <strong>${draft.jumlahBulan} (${draft.jumlahBulan}) bulan</strong>, mulai ${esc(draft.periodeMulai || "September 2026")} (${esc(months.join(", "))}).</li>
        <li><strong>Nilai Sewa &amp; Pembayaran:</strong> Biaya sewa disepakati sebesar <strong>${esc(formatCurrency(draft.tarifPerBulan))} / bulan</strong> (Total: <strong>${esc(formatCurrency(totalKontrak))}</strong> — <em>${esc(totalKontrak > 0 ? terbilangRupiah(totalKontrak) : "-")}</em>), dibayarkan secara bulanan disertai tanda bukti kwitansi resmi.</li>
        <li><strong>Kewajiban &amp; Pemeliharaan:</strong> Pihak Kedua menjaga kebersihan dan ketertiban objek sewa, serta Pihak Pertama menjamin ketersediaan hunian layak selama masa sewa.</li>
      </ol>

      <div class="sign-date">${esc(draft.lokasiSnt || profile.kotaPengesahan)}, ${esc(formatDateId(draft.tanggalKontrak))}</div>
      <table class="sign-table">
        <tr>
          <td style="width:50%">
            <div class="sign-role">PIHAK PERTAMA,<br/>Pemilik / Pengelola Rumah</div>
            <div class="sign-space"><em>(Meterai Rp10.000)</em></div>
            <div class="sign-name">${esc(pemilikDisplay)}</div>
          </td>
          <td style="width:50%">
            <div class="sign-role">PIHAK KEDUA,<br/>${esc(profile.namaYayasan)} / Fasilitator</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(fasilDisplay)}</div>
          </td>
        </tr>
      </table>

      ${monthlySlips}
    `
  );
}

export function renderGenericEvidencePdfHtml(input: {
  type: EvidenceDocType;
  draft: GenericEvidenceDraft;
  profile: SntReportProfile;
  includeKwitansiSlips: boolean;
}): string {
  const { type, draft, profile, includeKwitansiSlips } = input;
  const activeKop: KopSuratOption = draft.kopSurat || profile.kopSurat;
  const theme = resolveBrandKopTheme(activeKop, profile);
  const showRabCode = draft.showRabCode ?? true;
  const rabLabel = draft.rabCodeLabel || draft.rabCode.toUpperCase();
  const includeInvoice = Boolean(draft.includeInvoice);
  const includeDaftar = draft.includeDaftarTandaTerima ?? !includeInvoice;
  const includePph = Boolean(draft.includePphColumn);
  const pphPct = Number(draft.pphPct) || 0;

  const totalNominal = draft.items.reduce((s, it) => s + (Number(it.nominal) || 0), 0);
  const totalPph = includePph ? Math.round((totalNominal * pphPct) / 100) : 0;
  const totalNeto = totalNominal - totalPph;
  const isBillHotel = type === "KORWIL_PENGINAPAN";

  const pages: string[] = [];

  // 1. Halaman INVOICE Resmi (opsional — sesuai Mockup LPD & Robotic Explorer)
  if (includeInvoice) {
    pages.push(
      renderModernInvoiceHtml({
        kopSurat: activeKop,
        profile,
        noInvoice:
          draft.invoiceNo ||
          `INV/${activeKop === "lpd" ? "LPD" : activeKop === "robotic" ? "RE" : "MTC"}/SNT-W2/001/XI/2026`,
        tanggal: draft.tanggalDokumen,
        jatuhTempo: draft.jatuhTempo,
        ditagihkanKepada: draft.ditagihkanKepada || draft.sudahTerimaDari || "Yayasan Maleo Talenta Cendekia",
        alamatTagihan: draft.alamatTagihan,
        upTagihan: draft.upTagihan,
        program: draft.programLabel || "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
        rabCode: rabLabel,
        showRabCode,
        items: draft.items.map((it) => ({
          uraian: it.uraian,
          qty: Number(it.volume) || 1,
          satuan: it.satuan || "paket",
          hargaSatuan: Number(it.hargaSatuan) || 0,
          jumlah: Number(it.nominal) || 0,
        })),
        ppnPct: Number(draft.ppnPct) || 0,
        bankName: draft.bankName,
        bankAccount: draft.bankAccount,
        bankHolder: draft.bankHolder,
        catatan: draft.catatanInvoice || draft.catatan || "Mohon cantumkan No. Invoice pada berita transfer.",
        kota: profile.kotaPengesahan || "Jakarta",
        signerName: draft.signerName || theme.defaultSignerName,
        signerTitle: "Direktur",
      })
    );
  }

  // 2. Halaman DAFTAR TANDA TERIMA (modern dengan opsi kolom PPh % / Neto & TTD zig-zag)
  if (includeDaftar) {
    const headBg = `background:${theme.primaryColor}; color:#fff;`;
    const rowsHtml = draft.items
      .map((it, idx) => {
        const recDisplay = resolveRecipientDisplay(draft.recipientMode, it.penerima);
        const bruto = Number(it.nominal) || 0;
        const pphRow = includePph ? Math.round((bruto * pphPct) / 100) : 0;
        const netoRow = bruto - pphRow;
        const ttdZigZag =
          idx % 2 === 0
            ? `<div style="text-align:left;">${idx + 1}.</div>`
            : `<div style="text-align:right;">${idx + 1}.</div>`;

        if (includePph) {
          return `
            <tr>
              <td class="ctr">${idx + 1}</td>
              <td style="color:#1e3a8a; font-weight:600;">${esc(recDisplay)}</td>
              <td style="color:#1e3a8a;">${esc(it.lokasi || "-")}</td>
              <td class="ctr" style="color:#1e3a8a;">${it.volume}</td>
              <td class="ctr" style="color:#1e3a8a;">${esc(it.satuan)}</td>
              <td class="num" style="color:#1e3a8a;">${esc(formatCurrency(it.hargaSatuan))}</td>
              <td class="num">${esc(formatCurrency(bruto))}</td>
              <td class="ctr" style="color:#1e3a8a;">${pphPct}%</td>
              <td class="num">${pphRow > 0 ? esc(formatCurrency(pphRow)) : "-"}</td>
              <td class="num"><strong>${esc(formatCurrency(netoRow))}</strong></td>
              <td class="ttd-cell">${ttdZigZag}</td>
            </tr>`;
        }

        return `
          <tr>
            <td class="ctr">${idx + 1}</td>
            <td>${esc(formatDateId(it.tanggal))}</td>
            <td>${esc(it.lokasi || "-")}</td>
            <td>${esc(it.uraian)}</td>
            <td>${esc(recDisplay)}</td>
            <td class="ctr">${it.volume} ${esc(it.satuan)}</td>
            <td class="num">${esc(formatCurrency(it.hargaSatuan))}</td>
            <td class="num"><strong>${esc(formatCurrency(bruto))}</strong></td>
            <td class="ttd-cell">${ttdZigZag}</td>
          </tr>`;
      })
      .join("");

    const daftarHtml = `
      ${renderKop(activeKop, profile)}
      <div class="doc-head">
        <h1 style="color:${theme.primaryColor};">${esc(includePph ? "DAFTAR TANDA TERIMA HONORARIUM" : draft.judulDokumen)}</h1>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:11px; margin-bottom:10px;">
        <tr>
          <td style="width:110px; border:none; padding:2px 0; font-weight:700;">Kegiatan</td>
          <td style="border:none; padding:2px 0; color:#1e3a8a;">${esc(draft.judulDokumen)}</td>
        </tr>
        ${
          showRabCode
            ? `<tr>
                <td style="border:none; padding:2px 0; font-weight:700;">Kode RAB</td>
                <td style="border:none; padding:2px 0; color:#1e3a8a; font-weight:600;">${esc(rabLabel)}</td>
              </tr>`
            : ""
        }
        <tr>
          <td style="border:none; padding:2px 0; font-weight:700;">Periode</td>
          <td style="border:none; padding:2px 0; color:#1e3a8a;">${esc(draft.periodeLabel)}</td>
        </tr>
      </table>

      ${
        isBillHotel
          ? `<p class="note-box"><strong>Keterangan Bill / Rincian Penginapan:</strong> Dokumen ini digunakan sebagai rincian bill &amp; bukti pertanggungjawaban biaya penginapan Perjalanan Dinas Koordinator Wilayah 2.</p>`
          : ""
      }

      <table class="data-table">
        <thead>
          ${
            includePph
              ? `<tr style="${headBg}">
                  <th class="ctr" style="width:26px; ${headBg}">No</th>
                  <th style="${headBg}">Nama</th>
                  <th style="${headBg}">Jabatan / Lokasi SNT</th>
                  <th class="ctr" style="${headBg}">Volume</th>
                  <th class="ctr" style="${headBg}">Satuan</th>
                  <th class="num" style="${headBg}">Tarif</th>
                  <th class="num" style="${headBg}">Bruto</th>
                  <th class="ctr" style="${headBg}">PPh %</th>
                  <th class="num" style="${headBg}">PPh</th>
                  <th class="num" style="${headBg}">Diterima (Neto)</th>
                  <th class="ctr" style="width:95px; ${headBg}">Tanda Tangan</th>
                </tr>`
              : `<tr style="${headBg}">
                  <th class="ctr" style="width:28px; ${headBg}">No</th>
                  <th style="${headBg}">Tanggal</th>
                  <th style="${headBg}">Lokasi / SNT</th>
                  <th style="${headBg}">Uraian / Rincian Kegiatan</th>
                  <th style="${headBg}">Nama Penerima</th>
                  <th class="ctr" style="${headBg}">Vol</th>
                  <th class="num" style="${headBg}">Harga Satuan</th>
                  <th class="num" style="${headBg}">Jumlah (Rp)</th>
                  <th class="ctr" style="width:100px; ${headBg}">Tanda Tangan</th>
                </tr>`
          }
        </thead>
        <tbody>
          ${
            draft.items.length === 0
              ? `<tr><td colspan="${includePph ? 11 : 9}" class="ctr">Belum ada baris rincian.</td></tr>`
              : rowsHtml
          }
          ${
            includePph
              ? `<tr class="total-row">
                  <td colspan="6" class="num"><strong>JUMLAH</strong></td>
                  <td class="num"><strong>${esc(formatCurrency(totalNominal))}</strong></td>
                  <td></td>
                  <td class="num"><strong>${totalPph > 0 ? esc(formatCurrency(totalPph)) : "-"}</strong></td>
                  <td class="num"><strong>${esc(formatCurrency(totalNeto))}</strong></td>
                  <td></td>
                </tr>`
              : `<tr class="total-row">
                  <td colspan="7"><strong>TOTAL PEMBAYARAN</strong></td>
                  <td class="num"><strong>${esc(formatCurrency(totalNominal))}</strong></td>
                  <td></td>
                </tr>`
          }
        </tbody>
      </table>

      <p class="terbilang-bar">Terbilang: <em># ${esc((includePph ? totalNeto : totalNominal) > 0 ? terbilangRupiah(includePph ? totalNeto : totalNominal) : "-")} #</em></p>
      ${draft.catatan ? `<p class="note-box"><strong>Catatan:</strong> ${esc(draft.catatan)}</p>` : ""}

      <div class="sign-date">${esc(profile.kotaPengesahan || "Jakarta")}, ${esc(formatDateId(draft.tanggalDokumen))}</div>
      <table class="sign-table">
        <tr>
          <td style="width:50%">
            <div class="sign-role">Mengetahui,</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(profile.bagianAdministrasi)}</div>
          </td>
          <td style="width:50%">
            <div class="sign-role">Yang membayarkan,</div>
            <div class="sign-space"></div>
            <div class="sign-name">${esc(draft.signerName || theme.defaultSignerName)}</div>
            <div style="font-size:10px; color:#1d4ed8; margin-top:2px;">${esc(draft.signerTitle || "Direktur")}</div>
          </td>
        </tr>
      </table>
    `;

    pages.push(daftarHtml);
  }

  // 3. Lembar KUITANSI (jika mode Invoice gabungan, cetak 1 Kuitansi gabungan sesuai total Invoice;
  //    jika mode Daftar per penerima, cetak 1 Kuitansi per baris penerima!)
  if (includeKwitansiSlips) {
    if (includeInvoice && !includeDaftar && draft.items.length > 0) {
      const ppnPct = Number(draft.ppnPct) || 0;
      const grandTotal = totalNominal + Math.round((totalNominal * ppnPct) / 100);
      const firstRec = resolveRecipientDisplay(draft.recipientMode, draft.signerName || draft.items[0]?.penerima);
      const invRef = draft.invoiceNo ? ` sesuai Invoice No. ${draft.invoiceNo}` : "";
      const kwtUntuk =
        draft.items.length === 1
          ? `${draft.items[0].uraian}${showRabCode ? ` (Kode RAB ${rabLabel})` : ""}${invRef}`
          : `${draft.judulDokumen}${showRabCode ? ` (Kode RAB ${rabLabel})` : ""}${invRef}`;
      pages.push(
        renderKwitansiSlipHtml({
          kopSurat: activeKop,
          profile,
          noKwitansi: draft.kuitansiNoPrefix || draft.items[0]?.noDokumen || `KW/${rabLabel}/001`,
          sudahTerimaDari: draft.sudahTerimaDari || draft.ditagihkanKepada || "Yayasan Maleo Talenta Cendekia",
          amount: grandTotal,
          untukPembayaran: kwtUntuk,
          rabCode: rabLabel,
          showRabCode,
          kota: profile.kotaPengesahan || "Jakarta",
          tanggal: draft.tanggalDokumen,
          penerimaDisplay: firstRec,
          penerimaRole: "Yang menerima,",
          penerimaJabatan: draft.signerTitle || theme.defaultSignerTitle,
        })
      );
    } else {
      draft.items.forEach((it, idx) => {
        const recDisplay = resolveRecipientDisplay(draft.recipientMode, it.penerima);
        const amountItem = includePph
          ? (Number(it.nominal) || 0) - Math.round(((Number(it.nominal) || 0) * pphPct) / 100)
          : Number(it.nominal) || 0;
        pages.push(
          renderKwitansiSlipHtml({
            kopSurat: activeKop,
            profile,
            noKwitansi:
              it.noDokumen ||
              (draft.kuitansiNoPrefix
                ? `${draft.kuitansiNoPrefix}/${String(idx + 1).padStart(3, "0")}/XI/2026`
                : `KWT/${draft.rabCode.toUpperCase()}/${String(idx + 1).padStart(3, "0")}`),
            sudahTerimaDari: draft.sudahTerimaDari || profile.namaYayasan,
            amount: amountItem,
            untukPembayaran: it.uraian,
            rabCode: rabLabel,
            showRabCode,
            kota: profile.kotaPengesahan || "Jakarta",
            tanggal: it.tanggal || draft.tanggalDokumen,
            penerimaDisplay: recDisplay,
            penerimaRole: isBillHotel ? "Pengelola Hotel / Penginapan," : "Yang menerima,",
            penerimaJabatan: it.catatan || undefined,
          })
        );
      });
    }
  }

  const combinedHtml = pages
    .map((p, idx) => (idx === 0 ? p : `<div class="page-break">${p}</div>`))
    .join("\n");

  return wrapPrintableHtml(`${draft.judulDokumen}`, combinedHtml);
}

function wrapPrintableHtml(title: string, innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    @page { size: A4; margin: 14mm 13mm 14mm 13mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 10.5px;
      line-height: 1.45;
      margin: 0;
      padding: 16px;
      background: #f1f5f9;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 40;
      max-width: 210mm;
      margin: 0 auto 14px auto;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      font-size: 12px;
    }
    .toolbar button {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .sheet {
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      padding: 20px 22px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
    }
    .page-break { page-break-before: always; break-before: page; padding-top: 8px; }
    .kop-wrap { border-bottom: 3px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; text-align: center; }
    .kop-img { width: 100%; max-height: 95px; object-fit: contain; }
    .doc-head { text-align: center; margin-bottom: 14px; }
    .badge { display: inline-block; font-size: 9px; font-weight: 700; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 99px; margin-bottom: 5px; }
    h1 { font-size: 15px; margin: 2px 0 4px 0; text-transform: uppercase; }
    .subtitle { font-size: 10px; color: #475569; margin: 0; }
    .sub { font-size: 9px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .meta-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
    .meta-k { width: 32%; background: #f8fafc; }
    .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 5px 6px; vertical-align: top; font-size: 9.5px; }
    .data-table th { background: #e2e8f0; font-weight: 700; text-align: left; }
    .num { text-align: right !important; white-space: nowrap; }
    .ctr { text-align: center !important; }
    .ttd-cell { height: 34px; vertical-align: bottom !important; color: #475569; }
    .total-row td { background: #dbeafe; }
    .terbilang-bar { background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; border-radius: 4px; font-size: 10.5px; }
    .note-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 6px; margin-bottom: 10px; }
    .clause-list { padding-left: 18px; margin: 8px 0 14px 0; }
    .clause-list li { margin-bottom: 6px; text-align: justify; }
    .sign-date { text-align: right; margin-top: 16px; margin-bottom: 6px; font-size: 10.5px; }
    .sign-table td { border: none; text-align: center; vertical-align: top; padding: 4px 8px; }
    .sign-role { font-weight: 600; font-size: 10px; }
    .sign-space { height: 54px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 9.5px; }
    .sign-name { font-weight: 700; text-decoration: underline; font-size: 10.5px; }
    .kwt-card { border: 2px solid #000; padding: 22px 24px; background: #fff; }
    .kwt-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .kwt-kop { max-height: 54px; max-width: 380px; object-fit: contain; }
    .kwt-head-right { text-align: right; }
    .kwt-title { font-size: 19px; font-weight: 800; letter-spacing: 1px; }
    .kwt-no { font-family: monospace; font-size: 11.5px; font-weight: 700; margin-top: 2px; }
    .kwt-table td { padding: 6px 0; vertical-align: top; font-size: 12px; }
    .kwt-label { width: 150px; color: #334155; }
    .kwt-colon { width: 12px; }
    .kwt-terbilang { background: #f3f4f6; padding: 7px 10px !important; font-style: italic; font-weight: 600; border-radius: 4px; }
    .kwt-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 22px; }
    .kwt-amount { border: 2px solid #000; background: #f8fafc; padding: 8px 18px; font-family: monospace; font-size: 16px; font-weight: 800; border-radius: 4px; }
    .kwt-sign { text-align: center; min-width: 220px; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { max-width: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>${esc(title)}</strong>
    <button type="button" onclick="window.print()">Cetak / Simpan PDF (A4)</button>
  </div>
  <div class="sheet">${innerHtml}</div>
</body>
</html>`;
}
