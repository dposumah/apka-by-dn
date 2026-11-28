import {
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  DEFAULT_SLIP_KEGIATAN_LABEL,
  resolvePersonnelRoleFromRab,
} from "./snt-brand-kop";
import {
  buildDraftFromDriveMockupPreset,
  buildMonthlyPersonnelDraft,
  DEFAULT_SNT_ADMIN_PROFILE,
  DEFAULT_SNT_KORWIL_PROFILE,
  EvidenceDocType,
  GenericEvidenceDraft,
  getDefaultGenericEvidenceDraft,
  getHonorTimPresetByRabCode,
  SNT_HONOR_MONTH_OPTIONS,
} from "./snt-evidence-docs";
import {
  KopSuratOption,
  SNT_WILAYAH_2_LOCATIONS,
  SntReportProfile,
} from "./snt-report-templates";

export type RabPosCode =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "1a"
  | "1b"
  | "1c"
  | "2a"
  | "2b"
  | "2c"
  | "3a"
  | "3b"
  | "4a"
  | "4b"
  | "4c"
  | "5a"
  | "6a"
  | "6b"
  | "7a"
  | "7b"
  | "7c"
  | "7d";

export interface RabPosDocDefaults {
  includeInvoice: boolean;
  includeTandaTerima: boolean;
  includeSlipGaji: boolean;
  includeKwitansi: boolean;
  includeKontrakSewa?: boolean;
}

export interface RabPosCatalogMeta {
  code: RabPosCode;
  displayCode: string;
  group: "A" | "B";
  shortTitle: string;
  fullTitle: string;
  rabFormula: string;
  rabBudget: number;
  template13Ref: string;
  defaultKop: KopSuratOption;
  defaultDocs: RabPosDocDefaults;
  isMonthlyByDefault: boolean;
  hasTahap1Preset: boolean;
  tahap1Label?: string;
  pdfDocType: EvidenceDocType;
}

export const RAB_POS_CATALOG: RabPosCatalogMeta[] = [
  // ==================== A. BIAYA PERSONEL (5 POS) ====================
  {
    code: "1",
    displayCode: "A.1",
    group: "A",
    shortTitle: "Ketua Tim Pelaksana",
    fullTitle: "Pos A.1 — Honorarium Ketua Tim Pelaksana",
    rabFormula: "4 bln × 4 jam × Rp900.000",
    rabBudget: 14400000,
    template13Ref: "Pos A.1 · SK penugasan, log jam kerja (4 jam/bln), bukti terima / invoice / kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: true,
    hasTahap1Preset: false,
    pdfDocType: "HONOR_TIM",
  },
  {
    code: "2",
    displayCode: "A.2",
    group: "A",
    shortTitle: "Tim Program — Penyusunan Modul",
    fullTitle: "Pos A.2 — Tim Program Koding KA & Robotika (Penyusunan Modul SMP & SMA)",
    rabFormula: "porsi 6/17 × 40 modul × 2 jenjang",
    rabBudget: 141176471,
    template13Ref: "Pos A.2 · SK Tim Program, naskah modul SMP & SMA, BAST, invoice & kwitansi",
    defaultKop: "robotic",
    defaultDocs: { includeInvoice: true, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% = Rp112.941.177",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "3",
    displayCode: "A.3",
    group: "A",
    shortTitle: "Koordinator Wilayah 2",
    fullTitle: "Pos A.3 — Honorarium Koordinator Wilayah 2",
    rabFormula: "1 org × 12 jam × 3,5 bln × Rp900.000",
    rabBudget: 37800000,
    template13Ref: "Pos A.3 · Sep–Nov 12 jam (Rp10,8 jt/bln) + Des 6 jam / 0,5 bln (Rp5,4 jt) · Tanda Terima & Slip Honorarium",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: true, includeKwitansi: false },
    isMonthlyByDefault: true,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I LPD (3 bln = Rp32.018.823)",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "4",
    displayCode: "A.4",
    group: "A",
    shortTitle: "Fasilitator Koding & KA (6 Lokasi)",
    fullTitle: "Pos A.4 — Honorarium Fasilitator Koding, KA & Robotika (6 Lokasi SNT)",
    rabFormula: "6 lokasi × 4 bln × Rp5.729.876",
    rabBudget: 137517024,
    template13Ref: "Pos A.4 · 6 lokasi × Rp5.729.876/bln = Rp34.379.256/bln · Daftar Tanda Terima & Slip Honorarium auto profil fasil",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: true, includeKwitansi: false },
    isMonthlyByDefault: true,
    hasTahap1Preset: false,
    pdfDocType: "HONOR_FASIL_BULANAN",
  },
  {
    code: "5",
    displayCode: "A.5",
    group: "A",
    shortTitle: "Tenaga Administrasi",
    fullTitle: "Pos A.5 — Honorarium Tenaga Administrasi SNT Wilayah 2",
    rabFormula: "1 org × 3,5 bln × Rp5.729.876",
    rabBudget: 20054566,
    template13Ref: "Pos A.5 · Sep–Nov 1 bln (Rp5.729.876) + Des 0,5 bln (Rp2.864.938) · Tanda Terima & Slip Honorarium",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: true, includeKwitansi: false },
    isMonthlyByDefault: true,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I LPD (3 bln = Rp9.987.397)",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },

  // ==================== B. BIAYA NONPERSONEL (18 POS) ====================
  {
    code: "1a",
    displayCode: "B.1a",
    group: "B",
    shortTitle: "Laporan Pendahuluan",
    fullTitle: "Pos B.1a — Penyusunan & Pencetakan Laporan Pendahuluan",
    rabFormula: "1 salinan × Rp200.000",
    rabBudget: 200000,
    template13Ref: "Pos B.1a · Dokumen Laporan Pendahuluan, invoice & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "1b",
    displayCode: "B.1b",
    group: "B",
    shortTitle: "Laporan Bulanan",
    fullTitle: "Pos B.1b — Penyusunan & Pencetakan Laporan Bulanan (6 Lokasi)",
    rabFormula: "6 laporan × 3 kali × Rp200.000",
    rabBudget: 3600000,
    template13Ref: "Pos B.1b · Laporan bulanan per lokasi SNT (Sep, Okt, Nov), invoice & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: true,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% = Rp2.880.000",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "1c",
    displayCode: "B.1c",
    group: "B",
    shortTitle: "Laporan Akhir",
    fullTitle: "Pos B.1c — Penyusunan & Pencetakan Laporan Akhir",
    rabFormula: "1 salinan × Rp200.000",
    rabBudget: 200000,
    template13Ref: "Pos B.1c · Dokumen Laporan Akhir SNT Wilayah 2, invoice & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "2a",
    displayCode: "B.2a",
    group: "B",
    shortTitle: "Perjadin Korwil — Transportasi",
    fullTitle: "Pos B.2a — Perjalanan Dinas Koordinator Wilayah (Transportasi)",
    rabFormula: "6 lokasi × 2 kunjungan × Rp7.500.000",
    rabBudget: 90000000,
    template13Ref: "Pos B.2a · Surat tugas/SPD, tiket & boarding pass, laporan kunjungan, tanda terima & kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Selisih Tahap I = Rp53.567.179",
    pdfDocType: "KORWIL_TRANSPORT",
  },
  {
    code: "2b",
    displayCode: "B.2b",
    group: "B",
    shortTitle: "Perjadin Korwil — Uang Harian",
    fullTitle: "Pos B.2b — Perjalanan Dinas Koordinator Wilayah (Uang Harian)",
    rabFormula: "6 lokasi × 3 hari × 2 kunj × Rp400.000",
    rabBudget: 14400000,
    template13Ref: "Pos B.2b · Daftar uang harian (Rp400.000/hari), tanda terima & kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Selisih Tahap I = Rp10.320.000",
    pdfDocType: "KORWIL_UANG_HARIAN",
  },
  {
    code: "2c",
    displayCode: "B.2c",
    group: "B",
    shortTitle: "Perjadin Korwil — Penginapan",
    fullTitle: "Pos B.2c — Perjalanan Dinas Koordinator Wilayah (Uang Penginapan)",
    rabFormula: "6 lokasi × 2 malam × 2 kunj × Rp600.000",
    rabBudget: 14400000,
    template13Ref: "Pos B.2c · Bill hotel / penginapan (maks. Rp600.000/malam), tanda terima & kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Selisih Tahap I = Rp9.048.285",
    pdfDocType: "KORWIL_PENGINAPAN",
  },
  {
    code: "3a",
    displayCode: "B.3a",
    group: "B",
    shortTitle: "Transport Pindah Fasilitator (PP)",
    fullTitle: "Pos B.3a — Biaya Perjalanan Pindah Fasilitator (Jakarta–SNT PP)",
    rabFormula: "6 org × Rp7.500.000",
    rabBudget: 45000000,
    template13Ref: "Pos B.3a · Tiket/bukti perjalanan pindah 6 lokasi SNT, tanda terima & kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "PINDAH_FASIL",
  },
  {
    code: "3b",
    displayCode: "B.3b",
    group: "B",
    shortTitle: "Bantuan Sewa Rumah Fasilitator",
    fullTitle: "Pos B.3b — Bantuan Sewa Rumah / Kost Fasilitator (Kontrak & Bulanan)",
    rabFormula: "6 org × 4 bln × Rp2.000.000",
    rabBudget: 48000000,
    template13Ref: "Pos B.3b · Surat Perjanjian Kontrak Sewa Rumah/Kost + Kwitansi/Tanda Terima Bulanan",
    defaultKop: "maleo",
    defaultDocs: {
      includeInvoice: false,
      includeTandaTerima: true,
      includeSlipGaji: false,
      includeKwitansi: true,
      includeKontrakSewa: true,
    },
    isMonthlyByDefault: true,
    hasTahap1Preset: false,
    pdfDocType: "SEWA_RUMAH",
  },
  {
    code: "4a",
    displayCode: "B.4a",
    group: "B",
    shortTitle: "Pelatihan In/On Boarding (Narasumber)",
    fullTitle: "Pos B.4a — Pelatihan In/On Boarding oleh Tim Program (Narasumber)",
    rabFormula: "1 org × 106 jam × Rp200.000",
    rabBudget: 21200000,
    template13Ref: "Pos B.4a · Jadwal pelatihan, daftar hadir, invoice & kwitansi narasumber",
    defaultKop: "robotic",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I (88 jam = Rp17.600.000)",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "4b",
    displayCode: "B.4b",
    group: "B",
    shortTitle: "Sertifikasi Internasional STEM.org",
    fullTitle: "Pos B.4b — Biaya Sertifikasi Internasional STEM.org (Master of Trainer)",
    rabFormula: "6 org × Rp4.000.000",
    rabBudget: 24000000,
    template13Ref: "Pos B.4b · Bukti sertifikasi STEM.org, invoice & kwitansi",
    defaultKop: "robotic",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Selisih Tahap I = Rp2.000.000",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "4c",
    displayCode: "B.4c",
    group: "B",
    shortTitle: "Akomodasi Pelatihan / ToT",
    fullTitle: "Pos B.4c — Akomodasi Pelatihan / Training of Trainers (ToT)",
    rabFormula: "6 org × 14 hari × Rp160.000",
    rabBudget: 13440000,
    template13Ref: "Pos B.4c · Daftar hadir 14 hari, rincian akomodasi, tanda terima & kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "AKOMODASI_TOT",
  },
  {
    code: "5a",
    displayCode: "B.5a",
    group: "B",
    shortTitle: "Langganan LMS KKA / Robotika",
    fullTitle: "Pos B.5a — Langganan Platform LMS KKA & Robotika (6 Lokasi × 80 Akun)",
    rabFormula: "6 lokasi × 4 bln × 80 akun × Rp55.000",
    rabBudget: 105600000,
    template13Ref: "Pos B.5a · Daftar akun aktif LMS per lokasi, invoice & kwitansi langganan",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: true,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% = Rp84.480.000",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "6a",
    displayCode: "B.6a",
    group: "B",
    shortTitle: "Pembinaan Kompetisi Coding & Robotika",
    fullTitle: "Pos B.6a — Biaya Pembinaan Kompetisi Coding, KA & Robotika",
    rabFormula: "6 lokasi × 15 pert × 2 lomba × Rp700.000",
    rabBudget: 126000000,
    template13Ref: "Pos B.6a · Jurnal pertemuan, daftar peserta, bukti lomba, daftar tanda terima & kwitansi",
    defaultKop: "robotic",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% (6 lok × 24 pert = Rp100,8 jt)",
    pdfDocType: "PEMBINAAN_KOMPETISI",
  },
  {
    code: "6b",
    displayCode: "B.6b",
    group: "B",
    shortTitle: "Transport Lokal Kompetisi",
    fullTitle: "Pos B.6b — Biaya Transport Lokal Pembinaan Kompetisi",
    rabFormula: "6 lokasi × 15 pert × 2 lomba × Rp150.000",
    rabBudget: 27000000,
    template13Ref: "Pos B.6b · Daftar hadir & tanda terima transport lokal pembinaan kompetisi + kwitansi",
    defaultKop: "maleo",
    defaultDocs: { includeInvoice: false, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% (6 lok × 24 pert = Rp21,6 jt)",
    pdfDocType: "TRANSPORT_KOMPETISI",
  },
  {
    code: "7a",
    displayCode: "B.7a",
    group: "B",
    shortTitle: "ATK & Cetak Buku",
    fullTitle: "Pos B.7a — Pengadaan ATK, Pencetakan Buku & Perlengkapan (6 Lokasi)",
    rabFormula: "6 lokasi × Rp5.055.900",
    rabBudget: 30335400,
    template13Ref: "Pos B.7a · Nota/invoice cetak & ATK, berita acara serah terima, kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: true,
    tahap1Label: "Tahap I 80% = Rp24.268.320",
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "7b",
    displayCode: "B.7b",
    group: "B",
    shortTitle: "Langganan Video Conference",
    fullTitle: "Pos B.7b — Langganan Video Conference (Zoom / Meeting)",
    rabFormula: "porsi 6/17 × 1 akun",
    rabBudget: 1063765,
    template13Ref: "Pos B.7b · Bukti langganan akun video conference, invoice & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "7c",
    displayCode: "B.7c",
    group: "B",
    shortTitle: "Hardisk Eksternal 1 TB (6 Unit)",
    fullTitle: "Pos B.7c — Pengadaan Penyimpanan Hardisk Eksternal 1 TB (6 Lokasi)",
    rabFormula: "6 lokasi × Rp3.000.000",
    rabBudget: 18000000,
    template13Ref: "Pos B.7c · Invoice toko elektronik, BAST 6 unit HDD 1 TB, tanda terima & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: true, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
  {
    code: "7d",
    displayCode: "B.7d",
    group: "B",
    shortTitle: "Penyimpanan Awan (Cloud Storage)",
    fullTitle: "Pos B.7d — Langganan Penyimpanan Awan (Cloud Storage)",
    rabFormula: "porsi 6/17 × 1 akun",
    rabBudget: 1058824,
    template13Ref: "Pos B.7d · Bukti langganan Cloud Storage, invoice & kwitansi",
    defaultKop: "lpd",
    defaultDocs: { includeInvoice: true, includeTandaTerima: false, includeSlipGaji: false, includeKwitansi: true },
    isMonthlyByDefault: false,
    hasTahap1Preset: false,
    pdfDocType: "INVOICE_KUITANSI_MITRA",
  },
];

export function normalizeRabPosCode(rawCode?: string | null): RabPosCode | null {
  const cleaned = String(rawCode || "")
    .trim()
    .toLowerCase()
    .replace(/^[ab]\.?/, "");
  const found = RAB_POS_CATALOG.find((m) => m.code === cleaned);
  return found ? found.code : null;
}

export function getRabPosMeta(code: RabPosCode): RabPosCatalogMeta {
  return RAB_POS_CATALOG.find((m) => m.code === code) || RAB_POS_CATALOG[2]; // fallback A.3
}

function defaultSlipProfileForPos(meta: RabPosCatalogMeta) {
  const isAdmin = meta.code === "5";
  const nama = isAdmin ? DEFAULT_SNT_ADMIN_PROFILE.nama : DEFAULT_SNT_KORWIL_PROFILE.nama;
  const peran =
    meta.code === "3" || meta.code === "4" || meta.code === "5"
      ? resolvePersonnelRoleFromRab(meta.code, meta.fullTitle, "Wilayah 2")
      : `${meta.shortTitle} — SNT Wilayah 2`;
  const npwpNik = isAdmin
    ? DEFAULT_SNT_ADMIN_PROFILE.npwpNik
    : DEFAULT_SNT_KORWIL_PROFILE.npwpNik;
  const bankStr = isAdmin
    ? DEFAULT_SNT_ADMIN_PROFILE.rekening
    : DEFAULT_SNT_KORWIL_PROFILE.rekening;

  return {
    slipNamaPenerima: nama,
    slipPeranJabatan: peran,
    slipKegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
    slipNpwpNik: npwpNik,
    slipRekening: bankStr,
    slipDisiapkanOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
  };
}

/**
 * Membangun draft pelaporan standar berbasis Rincian Pagu RAB untuk setiap Pos RAB (23 pos).
 */
export function buildDefaultRabPosDraft(
  code: RabPosCode,
  profile?: Partial<SntReportProfile>
): GenericEvidenceDraft {
  const meta = getRabPosMeta(code);
  const maleoName = "Yayasan Maleo Talenta Cendekia";
  const signerName = DEFAULT_SNT_KORWIL_PROFILE.nama;
  const slipProfile = defaultSlipProfileForPos(meta);
  const baseFlags = {
    rabCode: meta.code,
    rabCodeLabel: meta.displayCode,
    kopSurat: meta.defaultKop,
    showRabCode: true,
    includeInvoice: meta.defaultDocs.includeInvoice,
    includeDaftarTandaTerima: meta.defaultDocs.includeTandaTerima,
    includeSlipGaji: meta.defaultDocs.includeSlipGaji,
    includeKwitansi: meta.defaultDocs.includeKwitansi,
    tandaTerimaDibayarkanOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
    monthlyPrintFilter: (meta.isMonthlyByDefault ? "SPLIT_EACH_MONTH" : "ALL") as GenericEvidenceDraft["monthlyPrintFilter"],
    ...slipProfile,
  };

  // Tujuan rekening transfer pada Invoice & dokumen lain default menggunakan data Korwil
  // (khusus Pos A.5 Tenaga Administrasi menggunakan data Admin), tetap bisa diedit bebas.
  const defaultBank =
    code === "5"
      ? {
          bankName: "",
          bankAccount: DEFAULT_SNT_ADMIN_PROFILE.rekening,
          bankHolder: DEFAULT_SNT_ADMIN_PROFILE.nama,
        }
      : {
          bankName: profile?.lpdBankName?.trim() || "",
          bankAccount: DEFAULT_SNT_KORWIL_PROFILE.rekening,
          bankHolder: DEFAULT_SNT_KORWIL_PROFILE.nama,
        };

  if (code === "3") {
    const d = buildMonthlyPersonnelDraft("3", "RAB_4_BULAN", profile);
    return { ...d, ...baseFlags, ...defaultBank };
  }

  if (code === "5") {
    const d = buildMonthlyPersonnelDraft("5", "RAB_4_BULAN", profile);
    return { ...d, ...baseFlags, ...defaultBank };
  }

  if (code === "1") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      alamatTagihan: profile?.alamatYayasanMaleo || "",
      upTagihan: profile?.upYayasanMaleo || "",
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      signerName,
      signerTitle: "Ketua Tim Pelaksana",
      recipientMode: "MANUAL",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (4 Bulan)",
      tanggalDokumen: "2026-09-30",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: getHonorTimPresetByRabCode("1").map((it) => ({
        ...it,
        penerima: signerName,
      })),
    };
  }

  if (code === "2") {
    const d = buildDraftFromDriveMockupPreset("TIM_A2", profile);
    return {
      ...d,
      ...baseFlags,
      ...defaultBank,
      signerName,
      periodeLabel: "September – Desember 2026 (Pagu RAB Penuh)",
      items: [
        {
          id: "a2-rab-1",
          tanggal: "2026-11-26",
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Penyusunan Modul Pembelajaran Koding, KA & Robotika Jenjang SMP & SMA (Porsi 6/17 × 40 modul × 2 jenjang)",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 141176471,
          nominal: 141176471,
        },
      ],
    };
  }

  if (code === "1a") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September 2026",
      tanggalDokumen: "2026-09-30",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: [
        {
          id: "b1a-1",
          tanggal: "2026-09-30",
          lokasi: "Wilayah 2",
          uraian: "Penyusunan & pencetakan Laporan Pendahuluan SNT Wilayah 2",
          penerima: signerName,
          volume: 1,
          satuan: "salinan",
          hargaSatuan: 200000,
          nominal: 200000,
        },
      ],
    };
  }

  if (code === "1b") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – November 2026 (3 Kali × 6 Lokasi)",
      tanggalDokumen: "2026-09-30",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_HONOR_MONTH_OPTIONS.slice(0, 3).map((m) => ({
        id: `b1b-${m.key}`,
        tanggal: m.defaultDate,
        lokasi: "Wilayah 2 (6 Lokasi)",
        uraian: `Penyusunan & pencetakan Laporan Bulanan SNT Wilayah 2 — Bulan ${m.label} (6 lokasi × Rp200.000)`,
        penerima: signerName,
        volume: 6,
        satuan: "laporan",
        hargaSatuan: 200000,
        nominal: 1200000,
      })),
    };
  }

  if (code === "1c") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: meta.fullTitle,
      periodeLabel: "Desember 2026",
      tanggalDokumen: "2026-12-20",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: [
        {
          id: "b1c-1",
          tanggal: "2026-12-20",
          lokasi: "Wilayah 2",
          uraian: "Penyusunan & pencetakan Laporan Akhir SNT Wilayah 2",
          penerima: signerName,
          volume: 1,
          satuan: "salinan",
          hargaSatuan: 200000,
          nominal: 200000,
        },
      ],
    };
  }

  if (code === "2a") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Koordinator Wilayah 2",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (2 Putaran Kunjungan)",
      tanggalDokumen: "2026-10-31",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b2a-${idx + 1}`,
        tanggal: "2026-10-31",
        lokasi: loc.label,
        uraian: `Transportasi PP Perjalanan Dinas Monev Korwil — ${loc.label} (2 kunjungan × Rp7.500.000)`,
        penerima: "",
        volume: 2,
        satuan: "kunjungan",
        hargaSatuan: 7500000,
        nominal: 15000000,
      })),
    };
  }

  if (code === "2b") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Koordinator Wilayah 2",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (2 Putaran Kunjungan)",
      tanggalDokumen: "2026-10-31",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b2b-${idx + 1}`,
        tanggal: "2026-10-31",
        lokasi: loc.label,
        uraian: `Uang Harian Perjalanan Dinas Monev Korwil — ${loc.label} (3 hari × 2 kunjungan × Rp400.000)`,
        penerima: "",
        volume: 6,
        satuan: "hari",
        hargaSatuan: 400000,
        nominal: 2400000,
      })),
    };
  }

  if (code === "2c") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Koordinator Wilayah 2",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (2 Putaran Kunjungan)",
      tanggalDokumen: "2026-10-31",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b2c-${idx + 1}`,
        tanggal: "2026-10-31",
        lokasi: loc.label,
        uraian: `Penginapan Hotel Perjalanan Dinas Monev Korwil — ${loc.label} (2 malam × 2 kunjungan × Rp600.000)`,
        penerima: "",
        volume: 4,
        satuan: "malam",
        hargaSatuan: 600000,
        nominal: 2400000,
      })),
    };
  }

  if (code === "3a") {
    const legacy = getDefaultGenericEvidenceDraft("PINDAH_FASIL", maleoName);
    return { ...legacy, ...baseFlags, ...defaultBank, judulDokumen: meta.fullTitle };
  }

  if (code === "3b") {
    const items = SNT_WILAYAH_2_LOCATIONS.flatMap((loc) =>
      SNT_HONOR_MONTH_OPTIONS.map((m) => ({
        id: `b3b-${loc.id}-${m.key}`,
        tanggal: m.defaultDate,
        lokasi: loc.label,
        uraian: `Bantuan Sewa Rumah / Kost Fasilitator ${loc.label} — Bulan ${m.label}`,
        penerima: "",
        volume: 1,
        satuan: "bulan",
        hargaSatuan: 2000000,
        nominal: 2000000,
      }))
    );
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Ketua Tim Pelaksana",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (4 Bulan)",
      tanggalDokumen: "2026-09-30",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items,
    };
  }

  if (code === "4a") {
    const d = buildDraftFromDriveMockupPreset("RE_B4A", profile);
    return {
      ...d,
      ...baseFlags,
      ...defaultBank,
      signerName,
      items: [
        {
          id: "b4a-rab-1",
          tanggal: "2026-09-30",
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Pelatihan In/On Boarding calon fasilitator SNT Wilayah 2 oleh Tim Program (106 jam × Rp200.000)",
          penerima: signerName,
          volume: 106,
          satuan: "jam",
          hargaSatuan: 200000,
          nominal: 21200000,
        },
      ],
    };
  }

  if (code === "4b") {
    const d = buildDraftFromDriveMockupPreset("RE_B4B", profile);
    return {
      ...d,
      ...baseFlags,
      ...defaultBank,
      signerName,
      items: [
        {
          id: "b4b-rab-1",
          tanggal: "2026-10-31",
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Biaya Sertifikasi Internasional STEM.org untuk Fasilitator SNT Wilayah 2 (6 org × Rp4.000.000)",
          penerima: signerName,
          volume: 6,
          satuan: "orang",
          hargaSatuan: 4000000,
          nominal: 24000000,
        },
      ],
    };
  }

  if (code === "4c") {
    const legacy = getDefaultGenericEvidenceDraft("AKOMODASI_TOT", maleoName);
    return { ...legacy, ...baseFlags, ...defaultBank, judulDokumen: meta.fullTitle };
  }

  if (code === "5a") {
    const d = buildDraftFromDriveMockupPreset("MALEO_B5", profile);
    return {
      ...d,
      ...baseFlags,
      ...defaultBank,
      periodeLabel: "September – Desember 2026 (4 Bulan)",
      items: SNT_HONOR_MONTH_OPTIONS.map((m) => ({
        id: `b5a-${m.key}`,
        tanggal: m.defaultDate,
        lokasi: "Wilayah 2 (6 Lokasi)",
        uraian: `Langganan Platform LMS KKA & Robotika — Bulan ${m.label} (6 lokasi × 80 akun × Rp55.000)`,
        penerima: maleoName,
        volume: 480,
        satuan: "akun",
        hargaSatuan: 55000,
        nominal: 26400000,
      })),
    };
  }

  if (code === "6a") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Pembinaan Kompetisi Coding, KA & Robotika — SNT Wilayah 2",
      ppnPct: 0,
      includePphColumn: true,
      pphPct: 0,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (30 Pertemuan / Lokasi)",
      tanggalDokumen: "2026-11-26",
      sudahTerimaDari: "Robotic Explorer (PT Jully Tjindrawan Robotik)",
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b6a-${idx + 1}`,
        tanggal: "2026-11-26",
        lokasi: loc.label,
        uraian: `Biaya Pembinaan Kompetisi Coding & Robotika ${loc.label} (15 pert × 2 lomba = 30 pert × Rp700.000)`,
        penerima: "",
        volume: 30,
        satuan: "pertemuan",
        hargaSatuan: 700000,
        nominal: 21000000,
      })),
    };
  }

  if (code === "6b") {
    return {
      ...baseFlags,
      ...defaultBank,
      ditagihkanKepada: maleoName,
      programLabel: "Transport Lokal Pembinaan Kompetisi — SNT Wilayah 2",
      ppnPct: 0,
      signerName,
      signerTitle: "Koordinator Wilayah 2",
      recipientMode: "BLANK",
      judulDokumen: meta.fullTitle,
      periodeLabel: "September – Desember 2026 (30 Pertemuan / Lokasi)",
      tanggalDokumen: "2026-11-26",
      sudahTerimaDari: maleoName,
      catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b6b-${idx + 1}`,
        tanggal: "2026-11-26",
        lokasi: loc.label,
        uraian: `Transport Lokal Pembinaan Kompetisi ${loc.label} (15 pert × 2 lomba = 30 pert × Rp150.000)`,
        penerima: "",
        volume: 30,
        satuan: "pertemuan",
        hargaSatuan: 150000,
        nominal: 4500000,
      })),
    };
  }

  if (code === "7a") {
    const d = buildDraftFromDriveMockupPreset("B7A_ATK", profile);
    return {
      ...d,
      ...baseFlags,
      ...defaultBank,
      signerName,
      periodeLabel: "September – Desember 2026 (Pagu RAB Penuh)",
      items: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
        id: `b7a-${idx + 1}`,
        tanggal: "2026-11-26",
        lokasi: loc.label,
        uraian: `Pengadaan ATK, Cetak Buku Modul & Perlengkapan — ${loc.label}`,
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 5055900,
        nominal: 5055900,
      })),
    };
  }

  if (code === "7c") {
    const d = buildDraftFromDriveMockupPreset("B7C_HDD", profile);
    return { ...d, ...baseFlags, ...defaultBank, signerName };
  }

  // B.7b (Video Conference) & B.7d (Cloud Storage) & fallback A.4
  return {
    ...baseFlags,
    ...defaultBank,
    ditagihkanKepada: maleoName,
    programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Wilayah 2",
    ppnPct: 0,
    signerName,
    signerTitle: "Direktur",
    recipientMode: "MANUAL",
    judulDokumen: meta.fullTitle,
    periodeLabel: "September – Desember 2026",
    tanggalDokumen: "2026-11-26",
    sudahTerimaDari: maleoName,
    catatan: `Pagu RAB ${meta.displayCode}: ${meta.rabFormula}`,
    items: [
      {
        id: `pos-${code}-1`,
        tanggal: "2026-11-26",
        lokasi: "Wilayah 2 (6 Lokasi)",
        uraian: `${meta.fullTitle} (${meta.rabFormula})`,
        penerima: signerName,
        volume: 1,
        satuan: "paket",
        hargaSatuan: meta.rabBudget,
        nominal: meta.rabBudget,
      },
    ],
  };
}

/**
 * Membangun preset Target Realisasi Tahap I (80%) untuk Pos RAB yang memiliki paket Tahap I.
 */
export function buildTahap1RabPosDraft(
  code: RabPosCode,
  profile?: Partial<SntReportProfile>
): GenericEvidenceDraft | null {
  const meta = getRabPosMeta(code);
  const slipProfile = defaultSlipProfileForPos(meta);
  const bankDefaults =
    code === "5"
      ? {
          bankName: "",
          bankAccount: DEFAULT_SNT_ADMIN_PROFILE.rekening,
          bankHolder: DEFAULT_SNT_ADMIN_PROFILE.nama,
        }
      : {
          bankName: profile?.lpdBankName?.trim() || "",
          bankAccount: DEFAULT_SNT_KORWIL_PROFILE.rekening,
          bankHolder: DEFAULT_SNT_KORWIL_PROFILE.nama,
        };
  const docFlags = {
    includeInvoice: meta.defaultDocs.includeInvoice,
    includeDaftarTandaTerima: meta.defaultDocs.includeTandaTerima,
    includeSlipGaji: meta.defaultDocs.includeSlipGaji,
    includeKwitansi: meta.defaultDocs.includeKwitansi,
    tandaTerimaDibayarkanOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
    ...bankDefaults,
    ...slipProfile,
  };

  if (code === "2") return { ...buildDraftFromDriveMockupPreset("TIM_A2", profile), ...docFlags };
  if (code === "3") return { ...buildMonthlyPersonnelDraft("3", "LPD_3_BULAN", profile), ...docFlags };
  if (code === "5") return { ...buildMonthlyPersonnelDraft("5", "LPD_3_BULAN", profile), ...docFlags };
  if (code === "1b") {
    const d = buildDraftFromDriveMockupPreset("LPD_B1", profile);
    return {
      ...d,
      ...docFlags,
      rabCode: "1b",
      rabCodeLabel: "B.1b",
      items: d.items.filter((it) => it.id === "lpd-b1b"),
    };
  }
  if (code === "2a") return { ...getDefaultGenericEvidenceDraft("KORWIL_TRANSPORT", "Yayasan Maleo Talenta Cendekia"), ...docFlags, kopSurat: meta.defaultKop, rabCodeLabel: "B.2a" };
  if (code === "2b") return { ...getDefaultGenericEvidenceDraft("KORWIL_UANG_HARIAN", "Yayasan Maleo Talenta Cendekia"), ...docFlags, kopSurat: meta.defaultKop, rabCodeLabel: "B.2b" };
  if (code === "2c") return { ...getDefaultGenericEvidenceDraft("KORWIL_PENGINAPAN", "Yayasan Maleo Talenta Cendekia"), ...docFlags, kopSurat: meta.defaultKop, rabCodeLabel: "B.2c" };
  if (code === "4a") return { ...buildDraftFromDriveMockupPreset("RE_B4A", profile), ...docFlags };
  if (code === "4b") return { ...buildDraftFromDriveMockupPreset("RE_B4B", profile), ...docFlags };
  if (code === "5a") return { ...buildDraftFromDriveMockupPreset("MALEO_B5", profile), ...docFlags };
  if (code === "6a") return { ...buildDraftFromDriveMockupPreset("RE_B6A", profile), ...docFlags };
  if (code === "6b") return { ...getDefaultGenericEvidenceDraft("TRANSPORT_KOMPETISI", "Yayasan Maleo Talenta Cendekia"), ...docFlags, kopSurat: meta.defaultKop, rabCodeLabel: "B.6b" };
  if (code === "7a") return { ...buildDraftFromDriveMockupPreset("B7A_ATK", profile), ...docFlags };

  return null;
}
