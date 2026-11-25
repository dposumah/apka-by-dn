import { getExpenseReceiptUrls } from "./expense-receipts";

export type SntTemplateCode = "01" | "02" | "03" | "04" | "11" | "12" | "13" | "14";

export type KopSuratOption = "maleo" | "robotic" | "none";

export interface SntTemplateMeta {
  code: SntTemplateCode;
  shortTitle: string;
  fullTitle: string;
  dasarKak: string;
  waktu: string;
  group: "KEUANGAN" | "OPERASIONAL";
  hasPeriodSelector?: boolean;
  description: string;
}

export const SNT_WILAYAH_2_LOCATIONS = [
  { id: "buton-tengah", label: "Kab. Buton Tengah", province: "Sulawesi Tenggara", keywords: ["buton tengah", "bau-bau", "baubau"] },
  { id: "tidore", label: "Kota Tidore Kepulauan", province: "Maluku Utara", keywords: ["tidore"] },
  { id: "kupang", label: "Kab. Kupang", province: "Nusa Tenggara Timur", keywords: ["kupang"] },
  { id: "tebo", label: "Kab. Tebo", province: "Jambi", keywords: ["tebo"] },
  { id: "tanjabtim", label: "Kab. Tanjung Jabung Timur", province: "Jambi", keywords: ["tanjung jabung timur", "tanjab"] },
  { id: "minahasa-utara", label: "Kab. Minahasa Utara", province: "Sulawesi Utara", keywords: ["minahasa utara", "minut"] },
] as const;

export const SNT_REPORT_TEMPLATES: SntTemplateMeta[] = [
  {
    code: "13",
    shortTitle: "13. Laporan Penggunaan Dana",
    fullTitle: "Laporan Penggunaan Dana (Wilayah 2)",
    dasarKak: "XII.B, XIII.4",
    waktu: "Tahap I & Akhir",
    group: "KEUANGAN",
    hasPeriodSelector: true,
    description: "Realisasi per baris RAB A & B, persentase serapan Termin I (syarat >= 80%), checklist bukti, dan lampiran opsional.",
  },
  {
    code: "02",
    shortTitle: "02. Laporan Bulanan",
    fullTitle: "Laporan Bulanan Pelaksanaan Program SNT",
    dasarKak: "IX, XIII.2",
    waktu: "Tiap bulan (Sep–Des)",
    group: "KEUANGAN",
    hasPeriodSelector: true,
    description: "Capaian bulanan Wilayah 2, progres per ruang lingkup, kendala/solusi, dan Bab 8 Laporan Penggunaan Dana.",
  },
  {
    code: "03",
    shortTitle: "03. Laporan Akhir",
    fullTitle: "Laporan Akhir Pelaksanaan Pekerjaan SNT",
    dasarKak: "XI, XIII.3",
    waktu: "Akhir pekerjaan",
    group: "KEUANGAN",
    description: "Ringkasan eksekutif, narasi pelaksanaan Bab I–X, capaian keluaran, outcome, dan Bab VIII Penggunaan Dana.",
  },
  {
    code: "12",
    shortTitle: "12. Laporan Hasil Pekerjaan",
    fullTitle: "Laporan Hasil Pekerjaan (Dasar Keputusan PPK)",
    dasarKak: "XI, XIII",
    waktu: "Akhir pekerjaan",
    group: "KEUANGAN",
    description: "Realisasi keluaran terhadap target, kinerja tim, konsolidasi Wilayah 2, penggunaan dana ringkas, dan keputusan PPK.",
  },
  {
    code: "01",
    shortTitle: "01. Laporan Pendahuluan",
    fullTitle: "Laporan Pendahuluan (Syarat Termin I)",
    dasarKak: "XII.B, XIII.1",
    waktu: "10 September 2026",
    group: "OPERASIONAL",
    description: "Identitas PKS, ruang lingkup, jadwal Sep–Des 2026, penempatan personel & fasilitator 6 lokasi Wilayah 2, lampiran Termin I.",
  },
  {
    code: "04",
    shortTitle: "04. Kompilasi Fasilitator",
    fullTitle: "Kompilasi Laporan Bulanan Fasilitator & Dokumentasi",
    dasarKak: "IX, XI.A, XIII.2",
    waktu: "Tiap bulan",
    group: "OPERASIONAL",
    hasPeriodSelector: true,
    description: "Status penerimaan laporan individu fasilitator Wilayah 2, rekap JP & pertemuan intra/ekstra, dan dokumentasi foto.",
  },
  {
    code: "11",
    shortTitle: "11. Laporan Monev Korwil",
    fullTitle: "Laporan Monitoring & Evaluasi Koordinator Wilayah 2",
    dasarKak: "VII, IX",
    waktu: "Tiap bulan / kunjungan",
    group: "OPERASIONAL",
    hasPeriodSelector: true,
    description: "Koordinasi sekolah/pemda, skor monev 6 lokasi SNT (skala 1–4), daftar kunjungan lapangan Korwil, dan tindak lanjut.",
  },
  {
    code: "14",
    shortTitle: "14. Laporan Kualifikasi ToT",
    fullTitle: "Laporan Penyelesaian Kualifikasi ToT Fasilitator",
    dasarKak: "III, XI",
    waktu: "Setelah pelatihan ToT",
    group: "OPERASIONAL",
    description: "Matriks jam IN-1/ON/IN-2 & nomor sertifikat STEM.org fasilitator Wilayah 2, evaluasi pelatihan, dan checklist bukti.",
  },
];

export const SNT_PERIOD_OPTIONS = [
  { key: "ALL", label: "Keseluruhan / Akhir (Sep–Des 2026)", monthPrefix: undefined, laporanKe: "Akhir" },
  { key: "2026-09", label: "Bulan ke-1 — September 2026", monthPrefix: "2026-09", laporanKe: "1" },
  { key: "2026-10", label: "Bulan ke-2 — Oktober 2026", monthPrefix: "2026-10", laporanKe: "2" },
  { key: "2026-11", label: "Bulan ke-3 — November 2026", monthPrefix: "2026-11", laporanKe: "3" },
  { key: "2026-12", label: "Bulan ke-4 — Desember 2026", monthPrefix: "2026-12", laporanKe: "4" },
  { key: "TAHAP_1", label: "Tahap I (Syarat Termin II)", monthPrefix: undefined, laporanKe: "Tahap I" },
] as const;

export interface SntReportProfile {
  namaYayasan: string;
  paketPekerjaan: string;
  satkerPpk: string;
  namaPpk: string;
  nomorPks: string;
  tanggalPks: string;
  masaPelaksanaan: string;
  ketuaTimPelaksana: string;
  koordinatorWilayah: string;
  bagianAdministrasi: string;
  timProgram: string;
  kopSurat: KopSuratOption;
  kotaPengesahan: string;
  tanggalLaporan: string;
  nomorLaporanPrefix: string;
  customPaguKontrak: number; // 0 = otomatis dari jumlah pagu A+B (+ PPN bila aktif)
  termin1Persen: number; // default 70
  termin2Persen: number; // default 30
  namaMitraModul: string;
}

export function getDefaultSntReportProfile(): SntReportProfile {
  return {
    namaYayasan: "Yayasan Maleo / PT Jully Tjindrawan Robotik (Robotic Explorer)",
    paketPekerjaan:
      "Penyediaan Fasilitator Pembelajaran Koding, Kecerdasan Artifisial (KKA) & Robotika bagi Peserta Didik Jenjang SMP dan SMA pada Program Sekolah Nasional Terintegrasi (SNT) Tahun Ajaran 2026 — Wilayah 2 (6 Lokasi)",
    satkerPpk: "Sekretariat Ditjen PAUD, Dikdas, dan Dikmen, Kemendikdasmen",
    namaPpk: "Nandana Aditya Bhaswara, S.ST., M.M",
    nomorPks: "",
    tanggalPks: "1 September 2026",
    masaPelaksanaan: "1 September – 31 Desember 2026",
    ketuaTimPelaksana: "Jully Tjindrawan, MBA",
    koordinatorWilayah: "Jully Tjindrawan, MBA",
    bagianAdministrasi: "Tim Administrasi & Keuangan SNT Wilayah 2",
    timProgram: "Tim Program Koding, KA & Robotika",
    kopSurat: "maleo",
    kotaPengesahan: "Jakarta",
    tanggalLaporan: new Date().toISOString().slice(0, 10),
    nomorLaporanPrefix: "LAP/SNT-W2/2026",
    customPaguKontrak: 0,
    termin1Persen: 70,
    termin2Persen: 30,
    namaMitraModul: "PT Jully Tjindrawan Robotik (Robotic Explorer)",
  };
}

export interface SntExpenseRecord {
  id: string;
  rabItemId: string;
  amount: number;
  description: string;
  date: string | Date;
  createdAt?: string | Date;
  status: string;
  receiptUrl?: string | null;
  receiptUrls?: string[] | null;
  paymentReceiptUrl?: string | null;
  fasilitator?: { id?: string; namaLengkap: string; lokasiSNT?: string | null } | null;
  createdBy?: { name?: string | null } | null;
  rabItem?: { id?: string; code?: string; name?: string; category?: { name?: string } | null } | null;
  kwitansiRecord?:
    | { id: string; noKwitansi: string; tanggal?: string | Date; perihal?: string; nominal?: number; owner?: string }
    | Array<{ id: string; noKwitansi: string; tanggal?: string | Date; perihal?: string; nominal?: number; owner?: string }>
    | null;
  invoiceRecord?:
    | { id: string; noInvoice: string }
    | Array<{ id: string; noInvoice: string }>
    | null;
}

export interface SntRabItemRecord {
  id: string;
  code: string;
  name: string;
  volume?: string | null;
  totalBudget: number;
  expenses?: SntExpenseRecord[];
}

export interface SntRabCategoryRecord {
  id: string;
  name: string;
  items: SntRabItemRecord[];
}

export interface SntFasilitatorRecord {
  id: string;
  namaLengkap: string;
  lokasiSNT?: string | null;
  jabatan?: string | null;
  instansi?: string | null;
  pendidikan?: string | null;
  jenisTugas?: string | null;
  ktpUrl?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
}

export interface SntLaporanKegiatanRecord {
  id: string;
  date: string | Date;
  topic?: string | null;
  attendance?: number | null;
  jumlahJPIntra?: number | null;
  jumlahJPEkstra?: number | null;
  tingkatSekolah?: string | null;
  foto1?: string | null;
  foto2?: string | null;
  fileLaporanFisik?: string | null;
  fasilitatorId: string;
  fasilitator?: { namaLengkap: string; lokasiSNT?: string | null } | null;
}

export interface SntRekapRecord {
  id: string;
  bulan: string;
  status: string;
  totalHonor: number;
  totalTransport: number;
  totalJP: number;
  totalJPIntra: number;
  totalJPEkstra: number;
  jumlahSesi: number;
  buktiPembayaranHonor?: string | null;
  buktiPembayaranTransport?: string | null;
  fasilitatorId: string;
  fasilitator?: { namaLengkap: string; lokasiSNT?: string | null } | null;
  kwitansiRecord?: { noKwitansi: string } | Array<{ noKwitansi: string }> | null;
}

export interface SntAkomodasiRecord {
  id: string;
  tipe: string;
  fasilitatorId: string;
  periodeSewa?: string | null;
  namaPenginapan?: string | null;
  namaKegiatan?: string | null;
  totalNominal: number;
  expenseId?: string | null;
  fasilitator?: { namaLengkap: string; lokasiSNT?: string | null } | null;
}

/**
 * Mengembalikan true jika kategori termasuk pos RAB resmi KAK (A. Biaya Personel / B. Biaya Nonpersonel).
 * Kategori C (Unbudgeted) dan D/E/F (Biaya IoT) dianggap kategori tambahan terpisah.
 */
export function isOfficialRabCategory(categoryName: string): boolean {
  const upper = (categoryName || "").trim().toUpperCase();
  return upper.startsWith("A.") || upper.startsWith("B.") || upper.includes("PERSONEL");
}

export function isPersonelCategory(categoryName: string): boolean {
  const upper = (categoryName || "").trim().toUpperCase();
  return upper.startsWith("A.") || (upper.includes("PERSONEL") && !upper.includes("NONPERSONEL") && !upper.includes("NON PERSONEL"));
}

/**
 * Daftar bukti wajib sesuai Template 13 (Laporan Penggunaan Dana) KAK SNT 2026.
 */
export function getRequiredEvidenceForRabItem(code: string, name: string): string {
  const c = (code || "").trim().toLowerCase();
  const n = (name || "").toLowerCase();

  if (c === "1" || n.includes("ketua tim")) return "SK/penugasan, log jam kerja, bukti terima honor";
  if (c === "2" || n.includes("tim program")) return "SK tim, naskah modul SMP & SMA, berita acara serah terima, bukti honor";
  if (c === "3" || (n.includes("koordinator wilayah") && !n.includes("perjalanan"))) return "SK/penugasan, log jam kerja, bukti terima honor";
  if (c === "4" || n.includes("fasilitator koding")) return "Kontrak/SK penempatan, absensi/rekap JP, bukti transfer, kwitansi honor";
  if (c === "5" || n.includes("tenaga administrasi")) return "Kontrak/SK, absensi, bukti transfer, surat keterangan pegawai tetap";
  if (c === "1a" || n.includes("laporan pendahuluan")) return "Nota cetak/jilid, bukti serah terima ke PPK";
  if (c === "1b" || n.includes("laporan bulanan")) return "Nota cetak/jilid, bukti serah terima ke PPK";
  if (c === "1c" || n.includes("laporan akhir")) return "Nota cetak/jilid, bukti serah terima ke PPK";
  if (c === "2a" || (n.includes("korwil") && n.includes("transport"))) return "Surat tugas/SPD, tiket & boarding pass, laporan kunjungan, kwitansi";
  if (c === "2b" || (n.includes("korwil") && n.includes("uang harian"))) return "Daftar uang harian, tanda terima / kwitansi";
  if (c === "2c" || (n.includes("korwil") && n.includes("penginapan"))) return "Bill hotel / kuitansi penginapan";
  if (c === "3a" || n.includes("perjalanan pindah")) return "Tiket/bukti perjalanan per fasilitator, daftar penerima, kwitansi";
  if (c === "3b" || n.includes("sewa rumah")) return "Kontrak sewa/kost, kuitansi bulanan, bukti transfer";
  if (c === "4a" || n.includes("pelatihan in")) return "Jadwal & materi pelatihan, daftar hadir, log jam, bukti honor";
  if (c === "4b" || n.includes("stem.org") || n.includes("sertifikasi")) return "Sertifikat per fasilitator, invoice/bukti bayar sertifikasi";
  if (c === "4c" || n.includes("akomodasi pelatihan")) return "Kuitansi akomodasi, daftar hadir 14 hari";
  if (c === "5a" || n.includes("lms")) return "Invoice/bukti langganan, daftar akun aktif per lokasi";
  if (c === "6a" || n.includes("pembinaan kompetisi")) return "Jurnal 15 pertemuan, daftar peserta, bukti partisipasi lomba, bukti biaya";
  if (c === "6b" || n.includes("transport lokal")) return "Kuitansi / daftar transport lokal pembinaan kompetisi";
  if (c === "7a" || c === "7b" || n.includes("atk")) return "Nota pembelian ATK & kwitansi";
  if (c === "7c" || n.includes("hdd") || n.includes("hardisk")) return "Nota pembelian, bukti serah terima unit HDD 1 TB";
  if (c === "7d" || n.includes("video conference") || n.includes("cloud")) return "Invoice langganan layanan";

  return "Nota / invoice pembelian, bukti transfer, dan kwitansi";
}

export function getPrimaryKwitansiRecord(
  rec?: SntExpenseRecord["kwitansiRecord"]
): { id: string; noKwitansi: string; tanggal?: string | Date; perihal?: string; nominal?: number; owner?: string } | null {
  if (!rec) return null;
  const list = Array.isArray(rec) ? rec : [rec];
  const valid = list.find(
    (item) => item && item.noKwitansi && !String(item.noKwitansi).includes("TEMP")
  );
  return valid || null;
}

export function hasValidKwitansi(expense: Pick<SntExpenseRecord, "kwitansiRecord">): boolean {
  return Boolean(getPrimaryKwitansiRecord(expense.kwitansiRecord));
}

export function getValidKwitansiNumber(expense: Pick<SntExpenseRecord, "kwitansiRecord">): string | null {
  return getPrimaryKwitansiRecord(expense.kwitansiRecord)?.noKwitansi || null;
}

export function formatKwitansiNumber(dateInput: Date | string, noUrut: number): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const yyyy = safeDate.getFullYear();
  const mm = String(safeDate.getMonth() + 1).padStart(2, "0");
  const dd = String(safeDate.getDate()).padStart(2, "0");
  const seq = String(Math.max(1, Math.floor(noUrut))).padStart(3, "0");
  return `KWC/MTC/${yyyy}.${mm}.${dd}.${seq}`;
}

export function getExpenseMonthKey(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface RabItemComputedRow {
  id: string;
  categoryId: string;
  categoryName: string;
  isOfficial: boolean;
  isPersonel: boolean;
  code: string;
  name: string;
  volume: string;
  budget: number;
  realizedPeriod: number;
  realizedTotal: number;
  remaining: number;
  serapanPct: number;
  requiredEvidence: string;
  txCount: number;
  withReceiptCount: number;
  withKwitansiCount: number;
  expenses: SntExpenseRecord[];
}

export interface RabRealizationSummary {
  officialRows: RabItemComputedRow[];
  extraRows: RabItemComputedRow[];
  personelBudget: number;
  personelRealizedPeriod: number;
  personelRealizedTotal: number;
  nonPersonelBudget: number;
  nonPersonelRealizedPeriod: number;
  nonPersonelRealizedTotal: number;
  subtotalOfficialBudget: number;
  subtotalOfficialRealizedPeriod: number;
  subtotalOfficialRealizedTotal: number;
  ppnBudget: number;
  ppnRealizedPeriod: number;
  ppnRealizedTotal: number;
  grandTotalBudget: number;
  grandTotalRealizedPeriod: number;
  grandTotalRealizedTotal: number;
  grandTotalRemaining: number;
  overallSerapanPct: number;
  termin1Pagu: number;
  termin2Pagu: number;
  serapanTerhadapTermin1Pct: number;
  eligibleForTermin2: boolean;
  extraBudget: number;
  extraRealizedPeriod: number;
  extraRealizedTotal: number;
}

export function computeRabRealizationSummary(
  categories: SntRabCategoryRecord[],
  options: {
    monthKey?: string;
    includePpn11: boolean;
    termin1Persen?: number;
    termin2Persen?: number;
    customPaguKontrak?: number;
  }
): RabRealizationSummary {
  const officialRows: RabItemComputedRow[] = [];
  const extraRows: RabItemComputedRow[] = [];

  let personelBudget = 0;
  let personelRealizedPeriod = 0;
  let personelRealizedTotal = 0;

  let nonPersonelBudget = 0;
  let nonPersonelRealizedPeriod = 0;
  let nonPersonelRealizedTotal = 0;

  let extraBudget = 0;
  let extraRealizedPeriod = 0;
  let extraRealizedTotal = 0;

  const targetMonth = options.monthKey && /^\d{4}-\d{2}$/.test(options.monthKey)
    ? options.monthKey
    : undefined;

  for (const cat of categories || []) {
    const isOfficial = isOfficialRabCategory(cat.name);
    const isPersonel = isOfficial && isPersonelCategory(cat.name);

    for (const item of cat.items || []) {
      const approvedExpenses = (item.expenses || []).filter(
        (e) => !e.status || e.status === "APPROVED"
      );

      const realizedTotal = approvedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const realizedPeriod = targetMonth
        ? approvedExpenses
            .filter((e) => getExpenseMonthKey(e.date || e.createdAt) === targetMonth)
            .reduce((s, e) => s + (Number(e.amount) || 0), 0)
        : realizedTotal;

      const budget = Number(item.totalBudget) || 0;
      const remaining = budget - realizedTotal;
      const serapanPct = budget > 0 ? (realizedTotal / budget) * 100 : 0;

      const withReceiptCount = approvedExpenses.filter(
        (e) => getExpenseReceiptUrls(e).length > 0
      ).length;
      const withKwitansiCount = approvedExpenses.filter((e) => hasValidKwitansi(e)).length;

      const row: RabItemComputedRow = {
        id: item.id,
        categoryId: cat.id,
        categoryName: cat.name,
        isOfficial,
        isPersonel,
        code: item.code || "",
        name: item.name || "",
        volume: item.volume || "",
        budget,
        realizedPeriod,
        realizedTotal,
        remaining,
        serapanPct,
        requiredEvidence: getRequiredEvidenceForRabItem(item.code, item.name),
        txCount: approvedExpenses.length,
        withReceiptCount,
        withKwitansiCount,
        expenses: approvedExpenses,
      };

      if (isOfficial) {
        officialRows.push(row);
        if (isPersonel) {
          personelBudget += budget;
          personelRealizedPeriod += realizedPeriod;
          personelRealizedTotal += realizedTotal;
        } else {
          nonPersonelBudget += budget;
          nonPersonelRealizedPeriod += realizedPeriod;
          nonPersonelRealizedTotal += realizedTotal;
        }
      } else {
        extraRows.push(row);
        extraBudget += budget;
        extraRealizedPeriod += realizedPeriod;
        extraRealizedTotal += realizedTotal;
      }
    }
  }

  const subtotalOfficialBudget = personelBudget + nonPersonelBudget;
  const subtotalOfficialRealizedPeriod = personelRealizedPeriod + nonPersonelRealizedPeriod;
  const subtotalOfficialRealizedTotal = personelRealizedTotal + nonPersonelRealizedTotal;

  const ppnRate = options.includePpn11 ? 0.11 : 0;
  const ppnBudget = Math.round(subtotalOfficialBudget * ppnRate);
  const ppnRealizedPeriod = Math.round(subtotalOfficialRealizedPeriod * ppnRate);
  const ppnRealizedTotal = Math.round(subtotalOfficialRealizedTotal * ppnRate);

  const computedGrandBudget = subtotalOfficialBudget + ppnBudget;
  const grandTotalBudget =
    options.customPaguKontrak && options.customPaguKontrak > 0
      ? options.customPaguKontrak
      : computedGrandBudget;
  const grandTotalRealizedPeriod = subtotalOfficialRealizedPeriod + ppnRealizedPeriod;
  const grandTotalRealizedTotal = subtotalOfficialRealizedTotal + ppnRealizedTotal;
  const grandTotalRemaining = grandTotalBudget - grandTotalRealizedTotal;
  const overallSerapanPct =
    grandTotalBudget > 0 ? (grandTotalRealizedTotal / grandTotalBudget) * 100 : 0;

  const termin1Persen = options.termin1Persen ?? 70;
  const termin2Persen = options.termin2Persen ?? 30;
  const termin1Pagu = Math.round((grandTotalBudget * termin1Persen) / 100);
  const termin2Pagu = Math.round((grandTotalBudget * termin2Persen) / 100);
  const serapanTerhadapTermin1Pct =
    termin1Pagu > 0 ? (grandTotalRealizedTotal / termin1Pagu) * 100 : 0;

  return {
    officialRows,
    extraRows,
    personelBudget,
    personelRealizedPeriod,
    personelRealizedTotal,
    nonPersonelBudget,
    nonPersonelRealizedPeriod,
    nonPersonelRealizedTotal,
    subtotalOfficialBudget,
    subtotalOfficialRealizedPeriod,
    subtotalOfficialRealizedTotal,
    ppnBudget,
    ppnRealizedPeriod,
    ppnRealizedTotal,
    grandTotalBudget,
    grandTotalRealizedPeriod,
    grandTotalRealizedTotal,
    grandTotalRemaining,
    overallSerapanPct,
    termin1Pagu,
    termin2Pagu,
    serapanTerhadapTermin1Pct,
    eligibleForTermin2: serapanTerhadapTermin1Pct >= 80,
    extraBudget,
    extraRealizedPeriod,
    extraRealizedTotal,
  };
}

export interface KwitansiAuditRow {
  expenseId: string;
  date: string;
  categoryName: string;
  isOfficialRab: boolean;
  rabCode: string;
  rabName: string;
  description: string;
  penerima: string;
  amount: number;
  receiptUrls: string[];
  hasReceipt: boolean;
  noKwitansi: string | null;
  hasKwitansi: boolean;
  requiredEvidence: string;
  rawExpense: SntExpenseRecord;
}

export interface KwitansiAuditSummary {
  rows: KwitansiAuditRow[];
  totalTx: number;
  totalAmount: number;
  withReceiptCount: number;
  missingReceiptCount: number;
  withKwitansiCount: number;
  missingKwitansiCount: number;
  fullyReadyCount: number;
  readinessPct: number;
}

export function computeKwitansiAuditSummary(
  categories: SntRabCategoryRecord[],
  onlyOfficialRab = true
): KwitansiAuditSummary {
  const rows: KwitansiAuditRow[] = [];

  for (const cat of categories || []) {
    const isOfficial = isOfficialRabCategory(cat.name);
    if (onlyOfficialRab && !isOfficial) continue;

    for (const item of cat.items || []) {
      const reqEvidence = getRequiredEvidenceForRabItem(item.code, item.name);
      for (const exp of item.expenses || []) {
        if (exp.status && exp.status !== "APPROVED") continue;
        const urls = getExpenseReceiptUrls(exp);
        const noKwt = getValidKwitansiNumber(exp);
        const d = exp.date || exp.createdAt;
        const dateIso = d ? new Date(d).toISOString().slice(0, 10) : "";

        rows.push({
          expenseId: exp.id,
          date: dateIso,
          categoryName: cat.name,
          isOfficialRab: isOfficial,
          rabCode: item.code || "",
          rabName: item.name || "",
          description: exp.description || "",
          penerima: exp.fasilitator?.namaLengkap || exp.createdBy?.name || "Tim Pelaksana SNT",
          amount: Number(exp.amount) || 0,
          receiptUrls: urls,
          hasReceipt: urls.length > 0,
          noKwitansi: noKwt,
          hasKwitansi: Boolean(noKwt),
          requiredEvidence: reqEvidence,
          rawExpense: exp,
        });
      }
    }
  }

  rows.sort((a, b) => b.date.localeCompare(a.date));

  const totalTx = rows.length;
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const withReceiptCount = rows.filter((r) => r.hasReceipt).length;
  const withKwitansiCount = rows.filter((r) => r.hasKwitansi).length;
  const fullyReadyCount = rows.filter((r) => r.hasReceipt && r.hasKwitansi).length;

  return {
    rows,
    totalTx,
    totalAmount,
    withReceiptCount,
    missingReceiptCount: totalTx - withReceiptCount,
    withKwitansiCount,
    missingKwitansiCount: totalTx - withKwitansiCount,
    fullyReadyCount,
    readinessPct: totalTx > 0 ? Math.round((fullyReadyCount / totalTx) * 100) : 100,
  };
}

export function matchWilayah2Location(rawLocation?: string | null): string | null {
  const lower = (rawLocation || "").toLowerCase();
  if (!lower) return null;
  for (const loc of SNT_WILAYAH_2_LOCATIONS) {
    if (loc.keywords.some((kw) => lower.includes(kw))) {
      return loc.id;
    }
  }
  return null;
}

export interface LocationActivityRow {
  locationId: string;
  label: string;
  province: string;
  fasilitatorNames: string[];
  fasilitatorCount: number;
  laporanCount: number;
  rekapCount: number;
  totalJpIntra: number;
  totalJpEkstra: number;
  totalMuridMax: number;
  dokumentasiCount: number;
}

export function computeLocationActivityStats(
  fasilitators: SntFasilitatorRecord[],
  laporanList: SntLaporanKegiatanRecord[],
  rekaps: SntRekapRecord[],
  monthKey?: string
): LocationActivityRow[] {
  const targetMonth = monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : undefined;

  return SNT_WILAYAH_2_LOCATIONS.map((loc) => {
    const locFasils = (fasilitators || []).filter(
      (f) => matchWilayah2Location(f.lokasiSNT) === loc.id
    );
    const fasilIds = new Set(locFasils.map((f) => f.id));

    const locLaporan = (laporanList || []).filter((l) => {
      if (!fasilIds.has(l.fasilitatorId)) return false;
      if (targetMonth && getExpenseMonthKey(l.date) !== targetMonth) return false;
      return true;
    });

    const locRekaps = (rekaps || []).filter((r) => {
      if (!fasilIds.has(r.fasilitatorId)) return false;
      if (targetMonth && r.bulan !== targetMonth) return false;
      return true;
    });

    const totalJpIntra = locLaporan.reduce((s, l) => s + (Number(l.jumlahJPIntra) || 0), 0);
    const totalJpEkstra = locLaporan.reduce((s, l) => s + (Number(l.jumlahJPEkstra) || 0), 0);
    const totalMuridMax = locLaporan.reduce(
      (max, l) => Math.max(max, Number(l.attendance) || 0),
      0
    );
    const dokumentasiCount = locLaporan.filter((l) => l.foto1 || l.foto2).length;

    return {
      locationId: loc.id,
      label: loc.label,
      province: loc.province,
      fasilitatorNames: locFasils.map((f) => f.namaLengkap),
      fasilitatorCount: locFasils.length,
      laporanCount: locLaporan.length,
      rekapCount: locRekaps.length,
      totalJpIntra,
      totalJpEkstra,
      totalMuridMax,
      dokumentasiCount,
    };
  });
}
