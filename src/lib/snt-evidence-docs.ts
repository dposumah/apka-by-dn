import {
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  DEFAULT_SLIP_KEGIATAN_LABEL,
  SlipHonorariumInput,
} from "./snt-brand-kop";
import { formatKwitansiNumber } from "./snt-doc-numbering";
import {
  KopSuratOption,
  RabRealizationSummary,
  SNT_WILAYAH_2_LOCATIONS,
  SntFasilitatorRecord,
  SntRekapRecord,
  SntReportProfile,
} from "./snt-report-templates";

/** Harga satuan resmi RAB Wilayah 2 Pos A.4 (6 lokasi × 4 bln = Rp137.517.024) */
export const SNT_RAB_HONOR_FASIL_UNIT_PRICE = 5729876;

/** Harga satuan resmi RAB Wilayah 2 Pos A.5 Tenaga Administrasi (1 org × 3,5 bln = Rp20.054.566) */
export const SNT_RAB_TENAGA_ADMIN_UNIT_PRICE = 5729876;

export type HonorPricingMode = "RAB_SATUAN" | "REAL_JP";

export type EvidenceDocType =
  | "HONOR_FASIL_BULANAN"
  | "SLIP_HONORARIUM"
  | "INVOICE_KUITANSI_MITRA"
  | "HONOR_TIM"
  | "KORWIL_TRANSPORT"
  | "KORWIL_UANG_HARIAN"
  | "KORWIL_PENGINAPAN"
  | "PINDAH_FASIL"
  | "SEWA_RUMAH"
  | "AKOMODASI_TOT"
  | "PEMBINAAN_KOMPETISI"
  | "TRANSPORT_KOMPETISI";

export type RecipientMode = "BLANK" | "MANUAL";

export interface EvidenceDocMeta {
  type: EvidenceDocType;
  rabCode: string;
  shortTitle: string;
  fullTitle: string;
  template13Ref: string;
  defaultRecipientMode: RecipientMode;
  description: string;
}

export const EVIDENCE_DOC_CATALOG: EvidenceDocMeta[] = [
  {
    type: "HONOR_FASIL_BULANAN",
    rabCode: "4",
    shortTitle: "Honor Fasilitator Bulanan (Daftar & Slip)",
    fullTitle: "Daftar Tanda Terima & Slip Honorarium Fasilitator KKA & Robotika (Pos A.4)",
    template13Ref: "Pos A.4 · 6 Lokasi × 4 Bulan × Rp5.729.876 = Rp137.517.024 (Daftar Tanda Terima, Invoice & Slip Honorarium)",
    defaultRecipientMode: "MANUAL",
    description:
      "Cetak bulanan (1 bulan atau 4 bulan Sep–Des) Daftar Tanda Terima & Slip Honorarium Fasilitator (Standar RAB Rp5.729.876/lokasi atau Real/JP DB) auto profil fasil.",
  },
  {
    type: "SLIP_HONORARIUM",
    rabCode: "A.3 & A.5",
    shortTitle: "Tanda Terima & Slip Korwil / Tenaga Admin",
    fullTitle: "Tanda Terima & Slip Honorarium Bulanan — Koordinator Wilayah (A.3) & Tenaga Administrasi (A.5)",
    template13Ref: "Pos A.3 (Korwil · 1 Org × 12 jam × 3,5 bln = Rp37,8 jt) & Pos A.5 (Tenaga Admin · 1 Org × 3,5 bln = Rp20,05 jt) · Format Resmi Maleo",
    defaultRecipientMode: "MANUAL",
    description:
      "Cetak Tanda Terima & Slip Honorarium per bulan sesuai rincian RAB untuk Koordinator Wilayah (A.3) & Tenaga Administrasi (A.5), lengkap dengan editor slip satuan.",
  },
  {
    type: "INVOICE_KUITANSI_MITRA",
    rabCode: "3",
    shortTitle: "Invoice & Kuitansi Mitra (LPD / Robotic Explorer)",
    fullTitle: "Paket Invoice, Kuitansi & Daftar Tanda Terima (Kop LPD / Robotic Explorer)",
    template13Ref: "Preset 10 Paket Tahap I · LPD (A.3, A.5, B.1a–b, B.7a, B.7c), RE (A.2, B.4a, B.4b, B.6a) & Maleo (B.5)",
    defaultRecipientMode: "MANUAL",
    description:
      "Generator Invoice resmi (PPN 0%/11%, jatuh tempo, rekening transfer), Kuitansi modern 2-warna, & Daftar Tanda Terima (dengan PPh %) memakai Kop baru LPD & Robotic Explorer.",
  },
  {
    type: "HONOR_TIM",
    rabCode: "1",
    shortTitle: "Bukti Terima & Kwitansi Honor Tim",
    fullTitle: "Daftar Bukti Terima & Kwitansi Honorarium Personel (Ketua, Tim Program, Korwil, Admin, Narasumber)",
    template13Ref: "Pos A.1, A.2, A.3, A.5, B.4a · SK/penugasan, log jam kerja, bukti terima & kwitansi honor",
    defaultRecipientMode: "BLANK",
    description:
      "Menyiapkan daftar tanda terima honor dan lembar kwitansi honorarium personel inti/narasumber (nama penerima kosong default atau isi manual).",
  },
  {
    type: "KORWIL_TRANSPORT",
    rabCode: "2a",
    shortTitle: "Kwitansi Perjadin Korwil — Transportasi",
    fullTitle: "Kwitansi & Rincian Transportasi Perjalanan Dinas Koordinator Wilayah 2",
    template13Ref: "Pos B.2a · Surat tugas/SPD, tiket & boarding pass, laporan kunjungan, kwitansi",
    defaultRecipientMode: "BLANK",
    description:
      "Kwitansi resmi perjalanan dinas transportasi Korwil (bisa tarik dari transaksi 2a atau tambah kunjungan baru).",
  },
  {
    type: "KORWIL_UANG_HARIAN",
    rabCode: "2b",
    shortTitle: "Daftar & Kwitansi Uang Harian Korwil",
    fullTitle: "Daftar Pembayaran & Tanda Terima / Kwitansi Uang Harian Perjalanan Dinas Korwil",
    template13Ref: "Pos B.2b · Daftar uang harian (Rp400.000/hari), tanda terima / kwitansi",
    defaultRecipientMode: "BLANK",
    description:
      "Daftar uang harian per lokasi kunjungan (hari × tarif Rp400.000) beserta tanda terima & lembar kwitansi.",
  },
  {
    type: "KORWIL_PENGINAPAN",
    rabCode: "2c",
    shortTitle: "Bill & Kwitansi Penginapan Korwil",
    fullTitle: "Rincian Bill Hotel & Kwitansi Penginapan Perjalanan Dinas Korwil",
    template13Ref: "Pos B.2c · Bill hotel / kuitansi penginapan (maks. Rp600.000/malam)",
    defaultRecipientMode: "BLANK",
    description:
      "Format bill/rincian penginapan hotel (nama hotel, check-in/out, jumlah malam × tarif) + lembar kwitansi penginapan.",
  },
  {
    type: "PINDAH_FASIL",
    rabCode: "3a",
    shortTitle: "Daftar Penerima Transport Pindah Fasil",
    fullTitle: "Daftar Penerima & Kwitansi Biaya Perjalanan Pindah Fasilitator (Transport PP)",
    template13Ref: "Pos B.3a · Tiket/bukti perjalanan per fasilitator, daftar penerima, kwitansi",
    defaultRecipientMode: "BLANK",
    description:
      "Daftar penerima transport pindah Jakarta–lokasi SNT PP untuk 6 lokasi Wilayah 2 beserta kwitansi per penerima.",
  },
  {
    type: "SEWA_RUMAH",
    rabCode: "3b",
    shortTitle: "Kontrak Sewa & Kwitansi Bulanan Rumah",
    fullTitle: "Surat Perjanjian Kontrak Sewa Rumah/Kost & Kwitansi Bulanan Fasilitator",
    template13Ref: "Pos B.3b · Kontrak sewa/kost, kuitansi bulanan (maks. Rp2.000.000/bln), bukti transfer",
    defaultRecipientMode: "BLANK",
    description:
      "Mencetak 1 Surat Kontrak Sewa Rumah/Kost + rangkaian Kwitansi Bulanan otomatis (Bulan 1 s.d. N) dengan nama pemilik/penerima kosong blanko atau isi manual.",
  },
  {
    type: "AKOMODASI_TOT",
    rabCode: "4c",
    shortTitle: "Kwitansi Akomodasi Pelatihan / ToT",
    fullTitle: "Rincian & Kwitansi Akomodasi Pelatihan / Training of Trainers (ToT)",
    template13Ref: "Pos B.4c · Kuitansi akomodasi (14 hari × Rp160.000), daftar hadir 14 hari",
    defaultRecipientMode: "BLANK",
    description:
      "Rincian & kwitansi akomodasi pelatihan ToT fasilitator Wilayah 2 (peserta × hari × tarif).",
  },
  {
    type: "PEMBINAAN_KOMPETISI",
    rabCode: "6a",
    shortTitle: "Bukti Biaya Pembinaan Kompetisi",
    fullTitle: "Daftar Tanda Terima & Kwitansi Biaya Pembinaan Kompetisi Coding & Robotika",
    template13Ref: "Pos B.6a · Jurnal 15 pertemuan, daftar peserta, bukti lomba, bukti biaya & kwitansi",
    defaultRecipientMode: "BLANK",
    description:
      "Daftar terima & kwitansi biaya pembinaan kompetisi per lokasi SNT (target 15 pertemuan × 2 lomba × Rp700.000).",
  },
  {
    type: "TRANSPORT_KOMPETISI",
    rabCode: "6b",
    shortTitle: "Kwitansi Transport Lokal Kompetisi",
    fullTitle: "Daftar Tanda Terima & Kwitansi Biaya Transport Lokal Pembinaan Kompetisi",
    template13Ref: "Pos B.6b · Kuitansi / daftar transport lokal pembinaan kompetisi (Rp150.000/pert)",
    defaultRecipientMode: "BLANK",
    description:
      "Daftar tanda terima & kwitansi transport lokal pembinaan kompetisi (6 lokasi × 15 pertemuan × 2 lomba × Rp150.000).",
  },
];

export const BLANK_SIGNATURE_LINE = "................................................";

export function resolveRecipientDisplay(mode: RecipientMode, manualName?: string | null): string {
  if (mode === "BLANK") return BLANK_SIGNATURE_LINE;
  const trimmed = (manualName || "").trim();
  return trimmed.length > 0 ? trimmed : BLANK_SIGNATURE_LINE;
}

export interface MonthlyHonorReceiptRow {
  id: string;
  nama: string;
  lokasi: string;
  locationId?: string;
  isMultiFacilitatorLocation?: boolean;
  jpIntra: number;
  jpEkstra: number;
  totalJP: number;
  hargaSatuanReal: number;
  totalHonor: number;
  totalTransport: number;
  status: string;
}

export interface MonthlyHonorReceiptSheet {
  monthKey: string;
  monthLabel: string;
  pricingMode?: HonorPricingMode;
  rows: MonthlyHonorReceiptRow[];
  totalJpIntra: number;
  totalJpEkstra: number;
  totalJP: number;
  totalHonor: number;
  totalTransport: number;
}

export function matchWilayah2LocationId(rawLokasi?: string | null): string | null {
  const hay = (rawLokasi || "").toLowerCase();
  if (!hay) return null;
  for (const loc of SNT_WILAYAH_2_LOCATIONS) {
    if (
      hay.includes(loc.label.toLowerCase()) ||
      loc.keywords.some((kw) => hay.includes(kw.toLowerCase()))
    ) {
      return loc.id;
    }
  }
  return null;
}

const MONTH_LABELS: Record<string, string> = {
  "2026-09": "September 2026",
  "2026-10": "Oktober 2026",
  "2026-11": "November 2026",
  "2026-12": "Desember 2026",
};

export function getMonthLabelId(monthKey: string): string {
  return MONTH_LABELS[monthKey] || monthKey;
}

/**
 * Membangun Daftar Tanda Terima & Kwitansi Honor Fasilitator bulanan sesuai
 * Harga Satuan RAB A.4 (Rp5.729.876 / lokasi / bulan × 6 lokasi = Rp34.379.256 / bln).
 *
 * Karena 5 lokasi menggunakan 2 fasilitator dalam 1 lokasi (kecuali Kota Tidore Kepulauan),
 * nama penerima pada 5 lokasi tersebut dikosongkan default agar dapat dibiarkan kosong (blanko)
 * atau dipilih salah satu fasilitator via dropdown pada daftar tanda terima & kwitansi.
 */
export function buildMonthlyRabUnitHonorReceipt(
  monthKey: string,
  rekaps: SntRekapRecord[],
  fasilitators: SntFasilitatorRecord[]
): MonthlyHonorReceiptSheet {
  const monthRekaps = (rekaps || []).filter((r) => r.bulan === monthKey);

  const rows: MonthlyHonorReceiptRow[] = SNT_WILAYAH_2_LOCATIONS.map((loc) => {
    const locRekaps = monthRekaps.filter(
      (r) => matchWilayah2LocationId(r.fasilitator?.lokasiSNT) === loc.id
    );
    const locFasils = (fasilitators || []).filter(
      (f) => matchWilayah2LocationId(f.lokasiSNT) === loc.id
    );

    const isTidore = loc.id === "tidore";
    const isMultiFacilitatorLocation = !isTidore;

    // Untuk Tidore (1 fasil aktif), ambil nama fasil dari rekap bulan tsb jika ada;
    // untuk 5 lokasi lain (2 fasil per lokasi), kosongkan default agar user pilih dari dropdown atau biarkan blanko.
    let defaultNama = "";
    if (isTidore) {
      const fromRekap = locRekaps.find((r) => r.fasilitator?.namaLengkap)?.fasilitator?.namaLengkap;
      if (fromRekap) {
        defaultNama = fromRekap;
      } else if (locFasils.length === 1) {
        defaultNama = locFasils[0].namaLengkap;
      }
    }

    const jpIntra = locRekaps.reduce((s, r) => s + (Number(r.totalJPIntra) || 0), 0);
    const jpEkstra = locRekaps.reduce((s, r) => s + (Number(r.totalJPEkstra) || 0), 0);
    const totalJP = locRekaps.reduce(
      (s, r) => s + (Number(r.totalJP) || (Number(r.totalJPIntra) || 0) + (Number(r.totalJPEkstra) || 0)),
      0
    );
    const totalTransport = locRekaps.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0);

    return {
      id: `rab-${monthKey}-${loc.id}`,
      nama: defaultNama,
      lokasi: loc.label,
      locationId: loc.id,
      isMultiFacilitatorLocation,
      jpIntra,
      jpEkstra,
      totalJP,
      hargaSatuanReal: SNT_RAB_HONOR_FASIL_UNIT_PRICE,
      totalHonor: SNT_RAB_HONOR_FASIL_UNIT_PRICE,
      totalTransport,
      status: "RAB_SATUAN",
    };
  });

  return {
    monthKey,
    monthLabel: getMonthLabelId(monthKey),
    pricingMode: "RAB_SATUAN",
    rows,
    totalJpIntra: rows.reduce((s, r) => s + r.jpIntra, 0),
    totalJpEkstra: rows.reduce((s, r) => s + r.jpEkstra, 0),
    totalJP: rows.reduce((s, r) => s + r.totalJP, 0),
    totalHonor: rows.reduce((s, r) => s + r.totalHonor, 0),
    totalTransport: rows.reduce((s, r) => s + r.totalTransport, 0),
  };
}

/**
 * Membangun Daftar Tanda Terima Honor Fasilitator bulanan berdasarkan realisasi
 * harga satuan real per JP (totalHonor / totalJP) dari RekapHonorarium.
 */
export function buildMonthlyFacilitatorHonorReceipt(
  rekaps: SntRekapRecord[],
  monthKey: string
): MonthlyHonorReceiptSheet {
  const matched = (rekaps || []).filter((r) => r.bulan === monthKey);
  const rows: MonthlyHonorReceiptRow[] = matched.map((r) => {
    const jpIntra = Number(r.totalJPIntra) || 0;
    const jpEkstra = Number(r.totalJPEkstra) || 0;
    const totalJP = Number(r.totalJP) || jpIntra + jpEkstra;
    const totalHonor = Number(r.totalHonor) || 0;
    const totalTransport = Number(r.totalTransport) || 0;
    const hargaSatuanReal = totalJP > 0 ? Math.round(totalHonor / totalJP) : totalHonor;

    return {
      id: r.id,
      nama: r.fasilitator?.namaLengkap || "-",
      lokasi: r.fasilitator?.lokasiSNT || "-",
      locationId: matchWilayah2LocationId(r.fasilitator?.lokasiSNT) || undefined,
      jpIntra,
      jpEkstra,
      totalJP,
      hargaSatuanReal,
      totalHonor,
      totalTransport,
      status: r.status || "APPROVED",
    };
  });

  rows.sort((a, b) => a.lokasi.localeCompare(b.lokasi) || a.nama.localeCompare(b.nama));

  return {
    monthKey,
    monthLabel: getMonthLabelId(monthKey),
    pricingMode: "REAL_JP",
    rows,
    totalJpIntra: rows.reduce((s, r) => s + r.jpIntra, 0),
    totalJpEkstra: rows.reduce((s, r) => s + r.jpEkstra, 0),
    totalJP: rows.reduce((s, r) => s + r.totalJP, 0),
    totalHonor: rows.reduce((s, r) => s + r.totalHonor, 0),
    totalTransport: rows.reduce((s, r) => s + r.totalTransport, 0),
  };
}

export interface EvidenceLineItem {
  id: string;
  tanggal: string;
  lokasi: string;
  uraian: string;
  penerima: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  nominal: number;
  noDokumen?: string;
  catatan?: string;
  receiptUrls?: string[];
}

export interface SewaRumahContractDraft {
  recipientMode: RecipientMode;
  namaPemilik: string;
  nikPemilik: string;
  alamatPemilik: string;
  namaFasilitator: string;
  lokasiSnt: string;
  alamatRumahSewa: string;
  tanggalKontrak: string;
  periodeMulai: string;
  jumlahBulan: number;
  tarifPerBulan: number;
  daftarBulan: string[];
  nomorKontrak: string;
}

export type MonthlyPrintFilter =
  | "ALL"
  | "2026-09"
  | "2026-10"
  | "2026-11"
  | "2026-12"
  | "SPLIT_EACH_MONTH";

export const SNT_HONOR_MONTH_OPTIONS = [
  { key: "2026-09", label: "September 2026", short: "Sep 2026", roman: "IX", defaultDate: "2026-09-30", defaultDue: "2026-10-14", seq: "001" },
  { key: "2026-10", label: "Oktober 2026", short: "Okt 2026", roman: "X", defaultDate: "2026-10-31", defaultDue: "2026-11-14", seq: "002" },
  { key: "2026-11", label: "November 2026", short: "Nov 2026", roman: "XI", defaultDate: "2026-11-30", defaultDue: "2026-12-14", seq: "003" },
  { key: "2026-12", label: "Desember 2026", short: "Des 2026", roman: "XII", defaultDate: "2026-12-20", defaultDue: "2026-12-30", seq: "004" },
] as const;

export interface GenericEvidenceDraft {
  rabCode: string;
  rabCodeLabel?: string;
  kopSurat?: KopSuratOption;
  monthlyPrintFilter?: MonthlyPrintFilter;
  showRabCode?: boolean;
  includeInvoice?: boolean;
  includeDaftarTandaTerima?: boolean;
  includeSlipGaji?: boolean;
  includeKwitansi?: boolean;
  includeReceiptAttachments?: boolean;
  tandaTerimaDibayarkanOleh?: string;
  slipNamaPenerima?: string;
  slipPeranJabatan?: string;
  slipKegiatan?: string;
  slipNpwpNik?: string;
  slipRekening?: string;
  slipDisiapkanOleh?: string;
  invoiceNo?: string;
  kuitansiNoPrefix?: string;
  jatuhTempo?: string;
  ditagihkanKepada?: string;
  alamatTagihan?: string;
  upTagihan?: string;
  programLabel?: string;
  ppnPct?: number;
  includePphColumn?: boolean;
  pphPct?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  catatanInvoice?: string;
  signerName?: string;
  signerTitle?: string;
  recipientMode: RecipientMode;
  judulDokumen: string;
  periodeLabel: string;
  tanggalDokumen: string;
  sudahTerimaDari: string;
  catatan: string;
  items: EvidenceLineItem[];
}

export type DriveMockupPresetId =
  | "LPD_A3"
  | "LPD_A5"
  | "LPD_B1"
  | "RE_B4A"
  | "RE_B4B"
  | "RE_B6A"
  | "TIM_A2"
  | "MALEO_B5"
  | "B7A_ATK"
  | "B7C_HDD";

export interface DriveMockupPresetMeta {
  id: DriveMockupPresetId;
  badge: string;
  kopSurat: KopSuratOption;
  rabCode: string;
  rabCodeLabel: string;
  title: string;
  subtitle: string;
  totalAmount: number;
}

export const DRIVE_MOCKUP_PRESETS: DriveMockupPresetMeta[] = [
  {
    id: "LPD_A3",
    badge: "LPD 1 · A.3",
    kopSurat: "lpd",
    rabCode: "3",
    rabCodeLabel: "A.3",
    title: "Honor Koordinator Wilayah 2",
    subtitle: "Invoice + Slip Honorarium (Tahap I) · Kop LPD",
    totalAmount: 32018823,
  },
  {
    id: "LPD_A5",
    badge: "LPD 2 · A.5",
    kopSurat: "lpd",
    rabCode: "5",
    rabCodeLabel: "A.5",
    title: "Honor Tenaga Administrasi (Selisih)",
    subtitle: "Invoice + Slip Honorarium (Tahap I) · Kop LPD",
    totalAmount: 9987397,
  },
  {
    id: "LPD_B1",
    badge: "LPD 3 · B.1a–b",
    kopSurat: "lpd",
    rabCode: "1b",
    rabCodeLabel: "B.1a, B.1b",
    title: "Laporan Pendahuluan & Bulanan",
    subtitle: "Invoice (2 item) + Kuitansi · Kop LPD",
    totalAmount: 3080000,
  },
  {
    id: "RE_B4A",
    badge: "RE 1 · B.4a",
    kopSurat: "robotic",
    rabCode: "4a",
    rabCodeLabel: "B.4a",
    title: "Pelatihan In/On Boarding Fasilitator",
    subtitle: "Invoice + Kuitansi (Tahap I) · Kop Robotic Explorer",
    totalAmount: 17600000,
  },
  {
    id: "RE_B4B",
    badge: "RE 2 · B.4b",
    kopSurat: "robotic",
    rabCode: "4b",
    rabCodeLabel: "B.4b",
    title: "Pelatihan Persiapan Sertifikasi STEM.org",
    subtitle: "Invoice + Kuitansi (Selisih) · Kop Robotic Explorer",
    totalAmount: 2000000,
  },
  {
    id: "RE_B6A",
    badge: "RE 3 · B.6a",
    kopSurat: "robotic",
    rabCode: "6a",
    rabCodeLabel: "B.6a",
    title: "Tanda Terima & Kuitansi Pembinaan Kompetisi",
    subtitle: "6 Lokasi × 24 Pert × Rp700rb · Kop Robotic Explorer",
    totalAmount: 100800000,
  },
  {
    id: "TIM_A2",
    badge: "Tahap I · A.2",
    kopSurat: "robotic",
    rabCode: "2",
    rabCodeLabel: "A.2",
    title: "Tim Program — Penyusunan Modul SMP & SMA",
    subtitle: "Invoice + Tanda Terima + Kuitansi (Tahap I)",
    totalAmount: 112941177,
  },
  {
    id: "MALEO_B5",
    badge: "Tahap I · B.5",
    kopSurat: "maleo",
    rabCode: "5a",
    rabCodeLabel: "B.5",
    title: "Langganan LMS KKA & Robotika (80 Akun)",
    subtitle: "Invoice + Kuitansi (Tahap I) · Yayasan Maleo",
    totalAmount: 84480000,
  },
  {
    id: "B7A_ATK",
    badge: "Tahap I · B.7a",
    kopSurat: "lpd",
    rabCode: "7a",
    rabCodeLabel: "B.7a",
    title: "Pengadaan ATK & Cetak Buku (6 Lokasi)",
    subtitle: "Invoice + Kuitansi (Tahap I · 80%)",
    totalAmount: 24268320,
  },
  {
    id: "B7C_HDD",
    badge: "Tahap I · B.7c",
    kopSurat: "lpd",
    rabCode: "7c",
    rabCodeLabel: "B.7c",
    title: "Penyimpanan Hardisk Eksternal 1 TB (6 Unit)",
    subtitle: "Invoice + Kuitansi (6 × Rp3.000.000)",
    totalAmount: 18000000,
  },
];

export function buildDraftFromDriveMockupPreset(
  presetId: DriveMockupPresetId,
  profile?: Partial<SntReportProfile>
): GenericEvidenceDraft {
  const tgl = "2026-11-26";
  const jatuhTempo = "2026-12-10";
  const maleoName = "Yayasan Maleo Talenta Cendekia";
  const maleoAddr = profile?.alamatYayasanMaleo || "";
  const maleoUp = profile?.upYayasanMaleo || "";
  const lpdBank = {
    bankName: profile?.lpdBankName || "",
    bankAccount: profile?.lpdBankAccount || "",
    bankHolder: profile?.lpdBankHolder || "LPD Jully Tjindrawan Robotik",
  };
  const reBank = {
    bankName: profile?.reBankName || "BCA",
    bankAccount: profile?.reBankAccount || "7040827000",
    bankHolder: profile?.reBankHolder || "PT Jully Tjindrawan Robotik",
  };
  const signerName = profile?.ketuaTimPelaksana || "Jully Tjindrawan, MBA";

  if (presetId === "LPD_A3") {
    return {
      rabCode: "3",
      rabCodeLabel: "A.3",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/LPD/SNT-W2/001/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur, LPD Jully Tjindrawan Robotik",
      recipientMode: "MANUAL",
      judulDokumen: "Honorarium Koordinator Wilayah 2 — SNT 2026",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: [
        {
          id: "lpd-a3-1",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "Honorarium Koordinator Wilayah 2 — SNT 2026, periode September–November 2026",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 32018823,
          nominal: 32018823,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "LPD_A5") {
    return {
      rabCode: "5",
      rabCodeLabel: "A.5",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/LPD/SNT-W2/002/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 2),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur, LPD Jully Tjindrawan Robotik",
      recipientMode: "MANUAL",
      judulDokumen: "Honorarium Tenaga Administrasi — SNT Wilayah 2",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: [
        {
          id: "lpd-a5-1",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "Honorarium Tenaga Administrasi — SNT Wilayah 2, periode September–November 2026",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 9987397,
          nominal: 9987397,
          noDokumen: formatKwitansiNumber(tgl, 2),
        },
      ],
    };
  }

  if (presetId === "LPD_B1") {
    return {
      rabCode: "1b",
      rabCodeLabel: "B.1a, B.1b",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/LPD/SNT-W2/003/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 3),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur, LPD Jully Tjindrawan Robotik",
      recipientMode: "MANUAL",
      judulDokumen: "Penyusunan & Pencetakan Laporan Pendahuluan dan Bulanan SNT Wilayah 2 (Tahap I)",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer. (B.1c Laporan Akhir Rp0 pada Tahap I).",
      items: [
        {
          id: "lpd-b1a",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "B.1a Penyusunan & pencetakan Laporan Pendahuluan (1 salinan × Rp200.000)",
          penerima: signerName,
          volume: 1,
          satuan: "salinan",
          hargaSatuan: 200000,
          nominal: 200000,
          noDokumen: formatKwitansiNumber(tgl, 3),
        },
        {
          id: "lpd-b1b",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "B.1b Penyusunan & pencetakan Laporan Bulanan (6 lokasi × 3 kali · Tahap I 80%)",
          penerima: signerName,
          volume: 18,
          satuan: "laporan",
          hargaSatuan: 160000,
          nominal: 2880000,
          noDokumen: formatKwitansiNumber(tgl, 4),
        },
      ],
    };
  }

  if (presetId === "RE_B4A") {
    return {
      rabCode: "4a",
      rabCodeLabel: "B.4a",
      kopSurat: "robotic",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/RE/SNT-W2/001/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...reBank,
      signerName,
      signerTitle: "Direktur, PT Jully Tjindrawan Robotik",
      recipientMode: "MANUAL",
      judulDokumen: "Pelatihan In/On Boarding Calon Fasilitator SNT Wilayah 2",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: [
        {
          id: "re-b4a-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Pelatihan in/on boarding calon fasilitator SNT Wilayah 2 (88 jam × Rp200.000) oleh Tim Program Koding, KA & Robotika",
          penerima: signerName,
          volume: 88,
          satuan: "jam",
          hargaSatuan: 200000,
          nominal: 17600000,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "TIM_A2") {
    return {
      rabCode: "2",
      rabCodeLabel: "A.2",
      kopSurat: "robotic",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: true,
      invoiceNo: "INV/RE/SNT-W2-A2/001/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...reBank,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: "Honorarium Tim Program Koding, KA & Robotika — Penyusunan Modul SMP & SMA (Tahap I)",
      periodeLabel: "September – November 2026 (Tahap I · 80%)",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Dilengkapi SK Tim Program, naskah modul SMP & SMA, dan Berita Acara Serah Terima (BAST).",
      items: [
        {
          id: "tim-a2-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Penyusunan Modul Pembelajaran Koding, KA & Robotika Jenjang SMP & SMA (Porsi 6/17 Wilayah 2 — Realisasi Tahap I 80%)",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 112941177,
          nominal: 112941177,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "MALEO_B5") {
    return {
      rabCode: "5a",
      rabCodeLabel: "B.5",
      kopSurat: "maleo",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV.2026.11.26.001",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      bankName: "",
      bankAccount: "",
      bankHolder: maleoName,
      signerName,
      signerTitle: "Ketua Tim Pelaksana",
      recipientMode: "MANUAL",
      judulDokumen: "Langganan LMS KKA & Robotika — SNT Wilayah 2 (Tahap I)",
      periodeLabel: "September – November 2026 (Tahap I · 80%)",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Dilengkapi daftar akun aktif LMS per lokasi SNT (6 lokasi × 80 akun).",
      items: [
        {
          id: "maleo-b5-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Langganan Platform LMS KKA & Robotika SNT Wilayah 2 (6 lokasi × 80 akun × Rp55.000 — Tahap I 80%)",
          penerima: maleoName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 84480000,
          nominal: 84480000,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "B7A_ATK") {
    return {
      rabCode: "7a",
      rabCodeLabel: "B.7a",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/LPD/SNT-W2-B7A/001/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: "Pengadaan ATK, Pencetakan Buku & Perlengkapan SNT Wilayah 2 (Tahap I)",
      periodeLabel: "September – November 2026 (Tahap I · 80%)",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Lampirkan nota/invoice cetak & ATK (Snapy / Percetakan / Toko ATK).",
      items: [
        {
          id: "b7a-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Pengadaan ATK, cetak buku modul & perlengkapan pembelajaran KKA Robotika SNT Wilayah 2 (6 lokasi · Tahap I 80%)",
          penerima: "",
          volume: 6,
          satuan: "paket",
          hargaSatuan: 4044720,
          nominal: 24268320,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "B7C_HDD") {
    return {
      rabCode: "7c",
      rabCodeLabel: "B.7c",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: true,
      invoiceNo: "INV/LPD/SNT-W2-B7C/001/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: "Pengadaan Penyimpanan Hardisk Eksternal 1 TB — SNT Wilayah 2 (6 Lokasi)",
      periodeLabel: "Tahap I — November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Lampirkan invoice toko elektronik & berita acara serah terima 6 unit Hardisk 1 TB.",
      items: [
        {
          id: "b7c-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Pengadaan Penyimpanan Hardisk Eksternal 1 TB untuk dokumentasi & modul SNT Wilayah 2 (6 lokasi × Rp3.000.000)",
          penerima: "",
          volume: 6,
          satuan: "unit",
          hargaSatuan: 3000000,
          nominal: 18000000,
          noDokumen: formatKwitansiNumber(tgl, 1),
        },
      ],
    };
  }

  if (presetId === "RE_B4B") {
    return {
      rabCode: "4b",
      rabCodeLabel: "B.4b",
      kopSurat: "robotic",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/RE/SNT-W2/002/XI/2026",
      kuitansiNoPrefix: formatKwitansiNumber(tgl, 2),
      jatuhTempo,
      ditagihkanKepada: maleoName,
      alamatTagihan: maleoAddr,
      upTagihan: maleoUp,
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...reBank,
      signerName,
      signerTitle: "Direktur, PT Jully Tjindrawan Robotik",
      recipientMode: "MANUAL",
      judulDokumen: "Pelatihan Persiapan Sertifikasi Internasional STEM.org (Master of Trainer)",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: [
        {
          id: "re-b4b-1",
          tanggal: tgl,
          lokasi: "Wilayah 2 (6 Lokasi)",
          uraian: "Pelatihan persiapan sertifikasi internasional STEM.org (Master of Trainer) untuk fasilitator SNT Wilayah 2",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 2000000,
          nominal: 2000000,
          noDokumen: formatKwitansiNumber(tgl, 2),
        },
      ],
    };
  }

  // RE_B6A: Daftar Tanda Terima & 6 Kuitansi Pembinaan Kompetisi
  const b6aRows: Array<{ nama: string; snt: string }> = [
    { nama: "Chindra Saputra, S.Kom., M.S.I.", snt: "SNT 17 Tanjung Jabung Timur" },
    { nama: "Cahyana Putra Pratama", snt: "SNT 16 Tebo" },
    { nama: "Rando, S.Kom., M.Eng.", snt: "SNT 15 Buton Tengah" },
    { nama: "Dr. Ir. Almido H. Ginting, S.T., M.Eng.", snt: "SNT 10 Kupang" },
    { nama: "Rocky Smart Lumowa, S.Pd., M.Pd.", snt: "SNT 4 Minahasa Utara" },
    { nama: "Muh. Hanifudin H, S.Pd", snt: "SNT 5 Tidore Kepulauan" },
  ];

  return {
    rabCode: "6a",
    rabCodeLabel: "B.6a",
    kopSurat: "robotic",
    showRabCode: true,
    includeInvoice: false,
    includeDaftarTandaTerima: true,
    invoiceNo: "",
    kuitansiNoPrefix: formatKwitansiNumber(tgl, 1),
    jatuhTempo,
    ditagihkanKepada: maleoName,
    alamatTagihan: maleoAddr,
    upTagihan: maleoUp,
    programLabel: "Honorarium Pembinaan Kompetisi Coding, KA & Robotika — SNT Wilayah 2",
    ppnPct: 0,
    includePphColumn: true,
    pphPct: 0,
    ...reBank,
    signerName,
    signerTitle: "Direktur",
    recipientMode: "MANUAL",
    judulDokumen: "Honorarium Pembinaan Kompetisi Coding, KA & Robotika — SNT Wilayah 2",
    periodeLabel: "September – November 2026",
    tanggalDokumen: tgl,
    sudahTerimaDari: "Robotic Explorer (PT Jully Tjindrawan Robotik)",
    catatan: "",
    items: b6aRows.map((r, idx) => ({
      id: `re-b6a-${idx + 1}`,
      tanggal: tgl,
      lokasi: r.snt,
      uraian: `Honorarium pembinaan kompetisi coding, KA & robotika ${r.snt}, 24 pertemuan × Rp700.000, periode September–November 2026`,
      penerima: r.nama,
      volume: 24,
      satuan: "pertemuan",
      hargaSatuan: 700000,
      nominal: 16800000,
      noDokumen: formatKwitansiNumber(tgl, idx + 1),
      catatan: `Fasilitator, ${r.snt}`,
    })),
  };
}

/**
 * Mendeteksi bulan (2026-09 s.d. 2026-12) dari tanggal atau uraian item.
 */
export function detectItemMonthKey(
  item: Pick<EvidenceLineItem, "tanggal" | "uraian">
): string | null {
  const t = (item.tanggal || "").trim();
  if (/^\d{4}-\d{2}/.test(t)) {
    const ym = t.slice(0, 7);
    if (SNT_HONOR_MONTH_OPTIONS.some((m) => m.key === ym)) return ym;
  }
  const u = (item.uraian || "").toLowerCase();
  if (u.includes("september") || /\bsep\b/.test(u)) return "2026-09";
  if (u.includes("oktober") || /\bokt\b/.test(u)) return "2026-10";
  if (u.includes("november") || /\bnov\b/.test(u)) return "2026-11";
  if (u.includes("desember") || /\bdes\b/.test(u)) return "2026-12";
  return null;
}

export const DEFAULT_SNT_KORWIL_PROFILE = {
  nama: "Jully Tjindrawan",
  nik: "3173055009710007",
  npwp: "73.672.680.3-039.000",
  npwpNik: "73.672.680.3-039.000 / 3173055009710007",
  rekening: "7040680009",
} as const;

export const DEFAULT_SNT_ADMIN_PROFILE = {
  nama: "Galvin Amaris Limbrawan",
  nik: "3173050304000006",
  npwp: "84.747.411.1-039.000",
  npwpNik: "84.747.411.1-039.000 / 3173050304000006",
  rekening: "7040804000",
} as const;

/**
 * Rincian resmi Koordinator Wilayah (Pos A.3):
 * 1 Orang × 12 jam × 3,5 bulan × Rp900.000 = 42 jam × Rp900.000 = Rp37.800.000
 * - September 2026 : 12 jam (1 bulan)  = Rp10.800.000
 * - Oktober 2026   : 12 jam (1 bulan)  = Rp10.800.000
 * - November 2026  : 12 jam (1 bulan)  = Rp10.800.000
 * - Desember 2026  : 6 jam (0,5 bulan) = Rp5.400.000
 */
export const SNT_KORWIL_HOURLY_RATE = 900000;
export const SNT_KORWIL_MONTHLY_SCHEDULE = [
  { key: "2026-09", label: "September 2026", roman: "IX", seq: "001", defaultDate: "2026-09-30", defaultDue: "2026-10-14", jam: 12, bulanFraction: 1, nominal: 10800000 },
  { key: "2026-10", label: "Oktober 2026", roman: "X", seq: "002", defaultDate: "2026-10-31", defaultDue: "2026-11-14", jam: 12, bulanFraction: 1, nominal: 10800000 },
  { key: "2026-11", label: "November 2026", roman: "XI", seq: "003", defaultDate: "2026-11-30", defaultDue: "2026-12-14", jam: 12, bulanFraction: 1, nominal: 10800000 },
  { key: "2026-12", label: "Desember 2026", roman: "XII", seq: "004", defaultDate: "2026-12-20", defaultDue: "2026-12-30", jam: 6, bulanFraction: 0.5, nominal: 5400000 },
] as const;

/**
 * Membangun Slip Honorarium Koordinator Wilayah (Pos A.3) per bulan
 * sesuai RAB (1 Orang × 12 jam × 3,5 bulan × Rp900.000 = Rp37.800.000).
 */
export function buildMonthlyKorwilSlipHonorariumInputs(
  profile?: Partial<SntReportProfile>,
  kopSurat: KopSuratOption = "maleo",
  monthKey?: string,
  overrides?: {
    namaPenerima?: string;
    npwpNik?: string;
    rekening?: string;
    catatan?: string;
    disiapkanOleh?: string;
  }
): SlipHonorariumInput[] {
  const targetMonths = monthKey
    ? SNT_KORWIL_MONTHLY_SCHEDULE.filter((m) => m.key === monthKey)
    : [...SNT_KORWIL_MONTHLY_SCHEDULE];
  const nama = overrides?.namaPenerima?.trim() || DEFAULT_SNT_KORWIL_PROFILE.nama;

  return targetMonths.map((m) => {
    const blnText = m.bulanFraction === 0.5 ? "0,5 bulan" : "1 bulan";
    return {
      kopSurat,
      profile,
      periode: m.label,
      namaPenerima: nama,
      nomorDokumen: `SLIP.${m.defaultDate.replace(/-/g, ".")}.${m.seq}`,
      peranJabatan: "Koordinator Wilayah 2",
      kegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
      tanggalKegiatan: `Bulan ${m.label}`,
      tanggalBayar: m.defaultDate,
      npwpNik: overrides?.npwpNik?.trim() || DEFAULT_SNT_KORWIL_PROFILE.npwpNik,
      rekening: overrides?.rekening?.trim() || DEFAULT_SNT_KORWIL_PROFILE.rekening,
      components: [
        {
          komponen: "Honorarium",
          qty: `${m.jam} jam (${blnText})`,
          pendapatan: m.nominal,
          potongan: 0,
          keterangan: `Koordinator Wilayah: 1 Orang × ${m.jam} jam × Rp900.000/jam`,
        },
        {
          komponen: "Tambahan honorarium",
          qty: "-",
          pendapatan: 0,
          potongan: 0,
          keterangan: "-",
        },
        {
          komponen: "Pajak / potongan lainnya",
          qty: "-",
          pendapatan: 0,
          potongan: 0,
          keterangan: "-",
        },
      ],
      catatan: overrides?.catatan?.trim() || "Pagu RAB A.3: 1 Orang × 12 jam × 3,5 bulan × Rp900.000 = Rp37.800.000",
      disiapkanOleh: overrides?.disiapkanOleh?.trim() || DEFAULT_ROBOTIC_PREPARER_LABEL,
    };
  });
}

/**
 * Rincian resmi RAB Wilayah 2 Pos A.5 (Tenaga Administrasi):
 * 1 Orang × 3,5 bulan × Rp5.729.876 = Rp20.054.566
 * - September 2026 : 1 bulan   = Rp5.729.876
 * - Oktober 2026   : 1 bulan   = Rp5.729.876
 * - November 2026  : 1 bulan   = Rp5.729.876
 * - Desember 2026  : 0,5 bulan = Rp2.864.938
 */
export const SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE = [
  { key: "2026-09", label: "September 2026", roman: "IX", seq: "001", defaultDate: "2026-09-30", defaultDue: "2026-10-14", bulanFraction: 1, nominal: 5729876 },
  { key: "2026-10", label: "Oktober 2026", roman: "X", seq: "002", defaultDate: "2026-10-31", defaultDue: "2026-11-14", bulanFraction: 1, nominal: 5729876 },
  { key: "2026-11", label: "November 2026", roman: "XI", seq: "003", defaultDate: "2026-11-30", defaultDue: "2026-12-14", bulanFraction: 1, nominal: 5729876 },
  { key: "2026-12", label: "Desember 2026", roman: "XII", seq: "004", defaultDate: "2026-12-20", defaultDue: "2026-12-30", bulanFraction: 0.5, nominal: 2864938 },
] as const;

/**
 * Membangun Slip Honorarium Tenaga Administrasi (Pos A.5) per bulan
 * sesuai RAB (1 Orang × 3,5 bulan × Rp5.729.876 = Rp20.054.566).
 */
export function buildMonthlyTenagaAdminSlipHonorariumInputs(
  profile?: Partial<SntReportProfile>,
  kopSurat: KopSuratOption = "maleo",
  monthKey?: string,
  overrides?: {
    namaPenerima?: string;
    npwpNik?: string;
    rekening?: string;
    catatan?: string;
    disiapkanOleh?: string;
  }
): SlipHonorariumInput[] {
  const targetMonths = monthKey
    ? SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE.filter((m) => m.key === monthKey)
    : [...SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE];
  const nama = overrides?.namaPenerima?.trim() || DEFAULT_SNT_ADMIN_PROFILE.nama;

  return targetMonths.map((m) => {
    const blnText = m.bulanFraction === 0.5 ? "0,5 bulan" : "1 bulan";
    return {
      kopSurat,
      profile,
      periode: m.label,
      namaPenerima: nama,
      nomorDokumen: `SLIP.${m.defaultDate.replace(/-/g, ".")}.${m.seq}`,
      peranJabatan: "Tenaga Administrasi SNT Wilayah 2",
      kegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
      tanggalKegiatan: `Bulan ${m.label}`,
      tanggalBayar: m.defaultDate,
      npwpNik: overrides?.npwpNik?.trim() || DEFAULT_SNT_ADMIN_PROFILE.npwpNik,
      rekening: overrides?.rekening?.trim() || DEFAULT_SNT_ADMIN_PROFILE.rekening,
      components: [
        {
          komponen: "Honorarium",
          qty: blnText,
          pendapatan: m.nominal,
          potongan: 0,
          keterangan: `Tenaga Administrasi: 1 Orang × ${blnText} × Rp5.729.876/bln`,
        },
        {
          komponen: "Tambahan honorarium",
          qty: "-",
          pendapatan: 0,
          potongan: 0,
          keterangan: "-",
        },
        {
          komponen: "Pajak / potongan lainnya",
          qty: "-",
          pendapatan: 0,
          potongan: 0,
          keterangan: "-",
        },
      ],
      catatan: overrides?.catatan?.trim() || "Pagu RAB A.5: 1 Orang × 3,5 bulan × Rp5.729.876 = Rp20.054.566",
      disiapkanOleh: overrides?.disiapkanOleh?.trim() || DEFAULT_ROBOTIC_PREPARER_LABEL,
    };
  });
}

/**
 * Membangun draft bulanan siap cetak (Invoice + Daftar Tanda Terima + Slip Honorarium)
 * untuk Pos A.3 (Koordinator Wilayah: 1 org × 12 jam × 3,5 bln × Rp900.000 = Rp37.800.000)
 * atau Pos A.5 (Tenaga Administrasi).
 */
export function buildMonthlyPersonnelDraft(
  rabCode: "3" | "5",
  mode: "RAB_4_BULAN" | "LPD_3_BULAN",
  profile?: Partial<SntReportProfile>
): GenericEvidenceDraft {
  const maleoName = "Yayasan Maleo Talenta Cendekia";
  const signerName = profile?.ketuaTimPelaksana || "Jully Tjindrawan, MBA";
  const korwilName = DEFAULT_SNT_KORWIL_PROFILE.nama;
  const adminName = DEFAULT_SNT_ADMIN_PROFILE.nama;
  const lpdBank = {
    bankName: profile?.lpdBankName || "",
    bankAccount: profile?.lpdBankAccount || "",
    bankHolder: profile?.lpdBankHolder || "LPD Jully Tjindrawan Robotik",
  };

  if (rabCode === "3") {
    const isLpdSim = mode === "LPD_3_BULAN";
    const korwilMonths = isLpdSim
      ? SNT_KORWIL_MONTHLY_SCHEDULE.slice(0, 3)
      : SNT_KORWIL_MONTHLY_SCHEDULE;
    return {
      rabCode: "3",
      rabCodeLabel: "A.3",
      kopSurat: "lpd",
      monthlyPrintFilter: "SPLIT_EACH_MONTH",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: true,
      invoiceNo: "INV/LPD/SNT-W2-A3",
      kuitansiNoPrefix: "",
      jatuhTempo: korwilMonths[korwilMonths.length - 1].defaultDue,
      ditagihkanKepada: maleoName,
      alamatTagihan: profile?.alamatYayasanMaleo || "",
      upTagihan: profile?.upYayasanMaleo || "",
      programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
      ppnPct: 0,
      includePphColumn: false,
      pphPct: 0,
      ...lpdBank,
      signerName,
      signerTitle: "Direktur",
      recipientMode: "MANUAL",
      judulDokumen: "Honorarium Koordinator Wilayah 2 — SNT 2026",
      periodeLabel: isLpdSim ? "September – November 2026" : "September – Desember 2026 (3,5 Bulan)",
      tanggalDokumen: korwilMonths[0].defaultDate,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: korwilMonths.map((m) => ({
        id: `a3-${m.key}`,
        tanggal: m.defaultDate,
        lokasi: "Wilayah 2 (6 Lokasi SNT)",
        uraian: isLpdSim
          ? `Honorarium Koordinator Wilayah 2 — SNT 2026, Bulan ${m.label}`
          : `Honorarium Koordinator Wilayah 2 — SNT 2026, Bulan ${m.label} (${m.jam} jam / ${m.bulanFraction === 0.5 ? "0,5 bulan" : "1 bulan"} × Rp900.000)`,
        penerima: korwilName,
        volume: isLpdSim ? 1 : m.jam,
        satuan: isLpdSim ? "bulan" : "jam",
        hargaSatuan: isLpdSim ? 10672941 : SNT_KORWIL_HOURLY_RATE,
        nominal: isLpdSim ? 10672941 : m.nominal,
        noDokumen: formatKwitansiNumber(m.defaultDate, Number(m.seq) || 1),
      })),
    };
  }

  // Pos A.5 Tenaga Administrasi (RAB: 1 Orang × 3,5 bulan × Rp5.729.876 = Rp20.054.566)
  const isLpdSim = mode === "LPD_3_BULAN";
  const lpdA5Amounts = [3329132, 3329132, 3329133]; // Total tepat Rp9.987.397
  const adminMonths = isLpdSim
    ? SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE.slice(0, 3)
    : SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE;
  return {
    rabCode: "5",
    rabCodeLabel: "A.5",
    kopSurat: "lpd",
    monthlyPrintFilter: "SPLIT_EACH_MONTH",
    showRabCode: true,
    includeInvoice: true,
    includeDaftarTandaTerima: true,
    invoiceNo: "INV/LPD/SNT-W2-A5",
    kuitansiNoPrefix: "",
    jatuhTempo: adminMonths[adminMonths.length - 1].defaultDue,
    ditagihkanKepada: maleoName,
    alamatTagihan: profile?.alamatYayasanMaleo || "",
    upTagihan: profile?.upYayasanMaleo || "",
    programLabel: "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2",
    ppnPct: 0,
    includePphColumn: false,
    pphPct: 0,
    ...lpdBank,
    signerName,
    signerTitle: "Direktur",
    recipientMode: "MANUAL",
    judulDokumen: "Honorarium Tenaga Administrasi — SNT Wilayah 2",
    periodeLabel: isLpdSim ? "September – November 2026" : "September – Desember 2026 (3,5 Bulan)",
    tanggalDokumen: adminMonths[0].defaultDate,
    sudahTerimaDari: maleoName,
    catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
    items: adminMonths.map((m, idx) => {
      const blnText = m.bulanFraction === 0.5 ? "0,5 bulan" : "1 bulan";
      const amt = isLpdSim ? lpdA5Amounts[idx] ?? 3329132 : m.nominal;
      return {
        id: `a5-${m.key}`,
        tanggal: m.defaultDate,
        lokasi: "Wilayah 2 (6 Lokasi SNT)",
        uraian: isLpdSim
          ? `Honorarium Tenaga Administrasi — SNT Wilayah 2, Bulan ${m.label}`
          : `Honorarium Tenaga Administrasi — SNT Wilayah 2, Bulan ${m.label} (${blnText} × Rp5.729.876)`,
        penerima: adminName,
        volume: isLpdSim ? 1 : m.bulanFraction,
        satuan: "bulan",
        hargaSatuan: isLpdSim ? amt : SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
        nominal: amt,
        noDokumen: formatKwitansiNumber(m.defaultDate, Number(m.seq) || 1),
      };
    }),
  };
}

/**
 * Memecah atau menyaring GenericEvidenceDraft menjadi slice per bulan untuk
 * pencetakan Invoice, Daftar Tanda Terima, dan Kuitansi bulanan.
 */
export function expandDraftIntoMonthlySlices(
  draft: GenericEvidenceDraft,
  filter: MonthlyPrintFilter = "ALL"
): GenericEvidenceDraft[] {
  if (filter === "ALL") {
    return [draft];
  }

  const brandCode =
    draft.kopSurat === "lpd" ? "LPD" : draft.kopSurat === "robotic" ? "RE" : "MTC";
  const rabTag = (draft.rabCodeLabel || draft.rabCode || "SNT")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  const buildSingleMonthSlice = (
    m: (typeof SNT_HONOR_MONTH_OPTIONS)[number],
    matchedItems: EvidenceLineItem[]
  ): GenericEvidenceDraft => {
    const tglDok = matchedItems[0]?.tanggal || m.defaultDate;
    const invDateDot = tglDok.replace(/-/g, ".");
    const invNo =
      brandCode === "MTC"
        ? `INV.${invDateDot}.${m.seq}`
        : `INV/${brandCode}/SNT-W2-${rabTag}/${m.seq}/${m.roman}/2026`;
    const kwtNo = formatKwitansiNumber(tglDok, Number(m.seq) || 1);

    return {
      ...draft,
      monthlyPrintFilter: "ALL",
      periodeLabel: m.label,
      tanggalDokumen: tglDok,
      jatuhTempo: m.defaultDue,
      invoiceNo: invNo,
      kuitansiNoPrefix: kwtNo,
      items: matchedItems.map((it, idx) => {
        const existingDoc = (it.noDokumen || "").trim();
        const isValidKwtDot = /^KWT\.\d{4}\.\d{2}\.\d{2}\.\d{1,5}$/i.test(existingDoc);
        return {
          ...it,
          noDokumen: isValidKwtDot
            ? existingDoc
            : matchedItems.length === 1
              ? kwtNo
              : formatKwitansiNumber(it.tanggal || tglDok, idx + 1),
        };
      }),
    };
  };

  if (filter === "SPLIT_EACH_MONTH") {
    const slices: GenericEvidenceDraft[] = [];
    for (const m of SNT_HONOR_MONTH_OPTIONS) {
      const matched = draft.items.filter((it) => detectItemMonthKey(it) === m.key);
      if (matched.length > 0) {
        slices.push(buildSingleMonthSlice(m, matched));
      }
    }
    return slices.length > 0 ? slices : [draft];
  }

  // Filter bulan tunggal (2026-09 / 2026-10 / 2026-11 / 2026-12)
  const targetMonth = SNT_HONOR_MONTH_OPTIONS.find((m) => m.key === filter);
  if (!targetMonth) return [draft];

  const matched = draft.items.filter((it) => detectItemMonthKey(it) === targetMonth.key);
  if (matched.length > 0) {
    return [buildSingleMonthSlice(targetMonth, matched)];
  }

  // Fallback jika item belum bertag tanggal bulanan: adaptasikan item untuk bulan terpilih
  const adapted = draft.items.map((it) => ({
    ...it,
    tanggal: targetMonth.defaultDate,
    uraian: it.uraian.toLowerCase().includes(targetMonth.label.toLowerCase())
      ? it.uraian
      : `${it.uraian} — Bulan ${targetMonth.label}`,
  }));
  return [buildSingleMonthSlice(targetMonth, adapted)];
}

export function getDefaultSewaRumahDraft(): SewaRumahContractDraft {
  return {
    recipientMode: "BLANK",
    namaPemilik: "",
    nikPemilik: "",
    alamatPemilik: "",
    namaFasilitator: "",
    lokasiSnt: SNT_WILAYAH_2_LOCATIONS[0].label,
    alamatRumahSewa: "",
    tanggalKontrak: "2026-09-01",
    periodeMulai: "September 2026",
    jumlahBulan: 4,
    tarifPerBulan: 2000000,
    daftarBulan: ["September 2026", "Oktober 2026", "November 2026", "Desember 2026"],
    nomorKontrak: "PKS-SEWA/SNT-W2/2026/001",
  };
}

export function getHonorTimPresetByRabCode(rabCode: string, tanggal?: string): EvidenceLineItem[] {
  const t = tanggal || new Date().toISOString().slice(0, 10);
  const c = (rabCode || "").trim().toLowerCase();
  const months = [
    { key: "sep", label: "September 2026", date: "2026-09-30" },
    { key: "okt", label: "Oktober 2026", date: "2026-10-31" },
    { key: "nov", label: "November 2026", date: "2026-11-30" },
    { key: "des", label: "Desember 2026", date: "2026-12-20" },
  ];

  if (c === "5") {
    return SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE.map((m) => ({
      id: `adm-${m.key}`,
      tanggal: m.defaultDate,
      lokasi: "Wilayah 2",
      uraian: `Honorarium Tenaga Administrasi — Bulan ${m.label} (${m.bulanFraction === 0.5 ? "0,5 bln" : "1 bln"})`,
      penerima: "",
      volume: m.bulanFraction,
      satuan: "bulan",
      hargaSatuan: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
      nominal: m.nominal,
    }));
  }

  if (c === "1") {
    return months.map((m) => ({
      id: `ketua-${m.key}`,
      tanggal: m.date,
      lokasi: "Wilayah 2",
      uraian: `Honorarium Ketua Tim Pelaksana — Bulan ${m.label} (4 jam)`,
      penerima: "",
      volume: 4,
      satuan: "jam",
      hargaSatuan: 900000,
      nominal: 3600000,
    }));
  }

  if (c === "2") {
    return [
      {
        id: "tp-1",
        tanggal: t,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Tim Program Koding KA Robotika (Penyusunan Modul & Kurikulum SMP & SMA — Tahap I 80%)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 112941177,
        nominal: 112941177,
      },
    ];
  }

  if (c === "3") {
    return SNT_KORWIL_MONTHLY_SCHEDULE.map((m) => ({
      id: `korwil-${m.key}`,
      tanggal: m.defaultDate,
      lokasi: "Wilayah 2",
      uraian: `Honorarium Koordinator Wilayah 2 — Bulan ${m.label} (${m.jam} jam / ${m.bulanFraction === 0.5 ? "0,5 bln" : "1 bln"})`,
      penerima: "Jully Tjindrawan, MBA",
      volume: m.jam,
      satuan: "jam",
      hargaSatuan: SNT_KORWIL_HOURLY_RATE,
      nominal: m.nominal,
    }));
  }

  if (c === "4a") {
    return [
      {
        id: "narsum-1",
        tanggal: t,
        lokasi: "Jakarta / Wilayah 2",
        uraian: "Honorarium Narasumber Pelatihan In/On Boarding oleh Tim Program (88 jam × Rp200.000 — Tahap I)",
        penerima: "",
        volume: 88,
        satuan: "jam",
        hargaSatuan: 200000,
        nominal: 17600000,
      },
    ];
  }

  return [];
}

export function getDefaultGenericEvidenceDraft(
  type: EvidenceDocType,
  sudahTerimaDari: string
): GenericEvidenceDraft {
  if (type === "INVOICE_KUITANSI_MITRA") {
    return buildDraftFromDriveMockupPreset("LPD_A3");
  }
  const meta = EVIDENCE_DOC_CATALOG.find((m) => m.type === type) || EVIDENCE_DOC_CATALOG[2];
  const today = new Date().toISOString().slice(0, 10);

  const presets: Partial<Record<EvidenceDocType, EvidenceLineItem[]>> = {
    HONOR_TIM: [
      {
        id: "ht-1",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Ketua Tim Pelaksana (4 jam × 4 bulan)",
        penerima: "",
        volume: 16,
        satuan: "jam",
        hargaSatuan: 900000,
        nominal: 14400000,
      },
      {
        id: "ht-2",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Koordinator Wilayah 2 (12 jam × 3,5 bulan)",
        penerima: "",
        volume: 42,
        satuan: "jam",
        hargaSatuan: 900000,
        nominal: 37800000,
      },
      {
        id: "ht-3",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Tenaga Administrasi (Pos A.5 · 3,5 bulan × Rp5.729.876)",
        penerima: "",
        volume: 3.5,
        satuan: "bulan",
        hargaSatuan: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
        nominal: 20054566,
      },
    ],
    KORWIL_UANG_HARIAN: [
      {
        id: "uh-1",
        tanggal: today,
        lokasi: "Wilayah 2 (6 Lokasi SNT)",
        uraian: "Uang Harian Kunjungan Monev Korwil Tahap I — Selisih Perlu Kuitansi & Tanda Terima (Target Rp11.520.000 − Riil Rp1.200.000)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 10320000,
        nominal: 10320000,
      },
    ],
    KORWIL_PENGINAPAN: [
      {
        id: "inap-1",
        tanggal: today,
        lokasi: "Wilayah 2 (6 Lokasi SNT)",
        uraian: "Penginapan Hotel Kunjungan Monev Korwil Tahap I — Selisih Perlu Kuitansi & Bill Hotel (Target Rp11.520.000 − Riil Rp2.471.715)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 9048285,
        nominal: 9048285,
      },
    ],
    KORWIL_TRANSPORT: [
      {
        id: "tr-1",
        tanggal: today,
        lokasi: "Wilayah 2 (6 Lokasi SNT)",
        uraian: "Transportasi PP Perjalanan Dinas Monev Korwil Tahap I — Selisih Perlu Kuitansi/Tiket (Target Rp72.000.000 − Riil Rp18.432.821)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 53567179,
        nominal: 53567179,
      },
    ],
    PINDAH_FASIL: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
      id: `pf-${idx + 1}`,
      tanggal: today,
      lokasi: loc.label,
      uraian: `Biaya Perjalanan Pindah Fasilitator Jakarta – ${loc.label} (PP)`,
      penerima: "",
      volume: 1,
      satuan: "PP",
      hargaSatuan: 7500000,
      nominal: 7500000,
    })),
    AKOMODASI_TOT: [
      {
        id: "tot-1",
        tanggal: today,
        lokasi: "Jakarta (6 Fasilitator Wilayah 2)",
        uraian: "Akomodasi Pelatihan / ToT Fasilitator (6 org × 14 hari · Hotel 88)",
        penerima: "",
        volume: 84,
        satuan: "orang-hari",
        hargaSatuan: 160000,
        nominal: 13440000,
      },
    ],
    PEMBINAAN_KOMPETISI: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
      id: `pk-${idx + 1}`,
      tanggal: today,
      lokasi: loc.label,
      uraian: `Biaya Pembinaan Kompetisi Coding & Robotika (${loc.label} · 24 pert × Rp700.000 — Tahap I 80%)`,
      penerima: "",
      volume: 24,
      satuan: "pertemuan",
      hargaSatuan: 700000,
      nominal: 16800000,
    })),
    TRANSPORT_KOMPETISI: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
      id: `tk-${idx + 1}`,
      tanggal: today,
      lokasi: loc.label,
      uraian: `Biaya Transport Lokal Pembinaan Kompetisi (${loc.label} · 24 pert × Rp150.000 — Tahap I 80%)`,
      penerima: "",
      volume: 24,
      satuan: "pertemuan",
      hargaSatuan: 150000,
      nominal: 3600000,
    })),
  };

  return {
    rabCode: meta.rabCode,
    recipientMode: meta.defaultRecipientMode,
    judulDokumen: meta.fullTitle,
    periodeLabel: "September – Desember 2026",
    tanggalDokumen: today,
    sudahTerimaDari,
    catatan: "",
    items: presets[type] || [],
  };
}

export interface Target80StrategyRow {
  rabItemId: string;
  rabCode: string;
  rabName: string;
  budget: number;
  realized: number;
  remaining: number;
  recommendedAdd: number;
  priority: "TINGGI" | "SEDANG" | "PENDUKUNG";
  marginLeverage: "INTERNAL_DELIVERABLE" | "EFISIENSI_VENDOR" | "AT_COST_OPERASIONAL";
  requiredEvidence: string;
  recommendedEvidenceDocType: EvidenceDocType | null;
  efficiencyTip: string;
}

export interface Target80StrategySummary {
  totalBudget: number;
  target80Amount: number;
  currentRealized: number;
  currentPct: number;
  gapTo80: number;
  recommendedTotalRealized: number;
  recommendedPct: number;
  internalDeliverablePotential: number;
  rows: Target80StrategyRow[];
}

export function mapRabCodeToEvidenceDocType(rabCode: string): EvidenceDocType | null {
  const c = (rabCode || "").trim().toLowerCase();
  if (c === "3" || c === "5") return "SLIP_HONORARIUM";
  if (["1", "2", "4a"].includes(c)) return "HONOR_TIM";
  if (c === "4") return "HONOR_FASIL_BULANAN";
  if (c === "2a") return "KORWIL_TRANSPORT";
  if (c === "2b") return "KORWIL_UANG_HARIAN";
  if (c === "2c") return "KORWIL_PENGINAPAN";
  if (c === "3a") return "PINDAH_FASIL";
  if (c === "3b") return "SEWA_RUMAH";
  if (c === "4c") return "AKOMODASI_TOT";
  if (c === "6a") return "PEMBINAAN_KOMPETISI";
  if (c === "6b") return "TRANSPORT_KOMPETISI";
  return null;
}

/**
 * Menghitung strategi legal & audit-safe untuk menaikkan realisasi > 80% RAB
 * sekaligus mengoptimalkan margin/surplus organisasi melalui deliverable internal & efisiensi biaya sah.
 */
export function computeTarget80Strategy(rabSummary: RabRealizationSummary): Target80StrategySummary {
  const totalBudget = rabSummary.subtotalOfficialBudget;
  const target80Amount = Math.ceil(totalBudget * 0.8);
  const currentRealized = rabSummary.subtotalOfficialRealizedTotal;
  const currentPct = totalBudget > 0 ? (currentRealized / totalBudget) * 100 : 0;
  const gapTo80 = Math.max(0, target80Amount - currentRealized);

  const rows: Target80StrategyRow[] = rabSummary.officialRows.map((row) => {
    const c = row.code.trim().toLowerCase();
    const remaining = Math.max(0, row.budget - row.realizedTotal);
    let recommendedAdd = 0;
    let priority: Target80StrategyRow["priority"] = "PENDUKUNG";
    let marginLeverage: Target80StrategyRow["marginLeverage"] = "AT_COST_OPERASIONAL";
    let efficiencyTip =
      "Pastikan setiap transaksi riil dilengkapi nota/kwitansi sesuai Template 13; bila terjadi penghematan sah dan perlu pergeseran antarpos, ajukan adendum resmi ke PPK.";

    if (c === "2") {
      recommendedAdd = remaining;
      priority = "TINGGI";
      marginLeverage = "INTERNAL_DELIVERABLE";
      efficiencyTip =
        "Prioritas utama surplus legal: kerjakan 40+40 modul oleh Tim Program internal & lengkapi SK, naskah modul, BAST, dan bukti terima honor sehingga dana terserap penuh ke tim internal.";
    } else if (c === "6a") {
      recommendedAdd = Math.round(remaining * 0.85);
      priority = "TINGGI";
      marginLeverage = "INTERNAL_DELIVERABLE";
      efficiencyTip =
        "Maksimalkan pembinaan oleh pembina/fasilitator internal untuk persiapan lomba (termasuk IYRC/nasional) disertai jurnal 15 pertemuan, daftar hadir peserta, dan bukti biaya resmi.";
    } else if (c === "5a") {
      recommendedAdd = remaining;
      priority = "TINGGI";
      marginLeverage = "INTERNAL_DELIVERABLE";
      efficiencyTip =
        "Jika platform LMS dikelola internal/mitra yayasan, terbitkan invoice langganan resmi + daftar akun aktif (85 akun × 6 lokasi) agar serapan tinggi sekaligus efisien.";
    } else if (c === "4") {
      recommendedAdd = Math.round(remaining * 0.75);
      priority = "TINGGI";
      marginLeverage = "AT_COST_OPERASIONAL";
      efficiencyTip =
        "Lengkapi rekap honorarium Nov–Des beserta Daftar Tanda Terima Honor Bulanan & bukti transfer agar seluruh beban riil fasilitator tercatat penuh di A.4.";
    } else if (c === "1" || c === "3" || c === "4a") {
      recommendedAdd = Math.round(remaining * 0.85);
      priority = "TINGGI";
      marginLeverage = "INTERNAL_DELIVERABLE";
      efficiencyTip =
        "Pos personel/narasumber internal berdaya ungkit margin tinggi: segera susun SK penugasan, log jam kerja (4/12/106 jam), dan bukti terima honor sesuai pagu.";
    } else if (["2a", "2b", "2c"].includes(c)) {
      recommendedAdd = Math.round(remaining * 0.7);
      priority = "SEDANG";
      marginLeverage = "EFISIENSI_VENDOR";
      efficiencyTip =
        "Efisiensi sah: jadwalkan kunjungan monev putaran 1 & 2 secara terencana (rute gabungan & pesan tiket/hotel lebih awal) disertai SPD, boarding pass, daftar uang harian, dan bill hotel riil.";
    } else if (c === "3a" || c === "3b") {
      recommendedAdd = Math.round(remaining * 0.75);
      priority = "SEDANG";
      marginLeverage = "EFISIENSI_VENDOR";
      efficiencyTip =
        "Lengkapi kontrak sewa rumah/kost & kwitansi bulanan riil serta daftar penerima transport pindah PP. Jangan gunakan kwitansi sewa untuk pengeluaran lain — bila pagu sewa berlebih, ajukan adendum/pergeseran pos resmi ke PPK.";
    } else if (c === "6b") {
      recommendedAdd = Math.round(remaining * 0.8);
      priority = "SEDANG";
      marginLeverage = "AT_COST_OPERASIONAL";
      efficiencyTip =
        "Catat seluruh transport lokal pembinaan kompetisi dengan daftar tanda terima & kwitansi per sesi pertemuan.";
    } else if (c === "4c") {
      recommendedAdd = remaining;
      priority = "SEDANG";
      marginLeverage = "EFISIENSI_VENDOR";
      efficiencyTip =
        "Sinkronkan akomodasi ToT yang sudah terjadi (termasuk di modul Akomodasi) ke pos B.4c disertai kwitansi penginapan & daftar hadir 14 hari.";
    } else {
      recommendedAdd = Math.round(remaining * 0.85);
      priority = "PENDUKUNG";
      marginLeverage = "EFISIENSI_VENDOR";
      efficiencyTip =
        "Lengkapi nota pembelian ATK/HDD/cetak laporan/langganan Zoom & bukti serah terima barang/laporan ke PPK.";
    }

    return {
      rabItemId: row.id,
      rabCode: row.code,
      rabName: row.name,
      budget: row.budget,
      realized: row.realizedTotal,
      remaining,
      recommendedAdd,
      priority,
      marginLeverage,
      requiredEvidence: row.requiredEvidence,
      recommendedEvidenceDocType: mapRabCodeToEvidenceDocType(row.code),
      efficiencyTip,
    };
  });

  const recommendedAddTotal = rows.reduce((s, r) => s + r.recommendedAdd, 0);
  const recommendedTotalRealized = currentRealized + recommendedAddTotal;
  const recommendedPct = totalBudget > 0 ? (recommendedTotalRealized / totalBudget) * 100 : 0;
  const internalDeliverablePotential = rows
    .filter((r) => r.marginLeverage === "INTERNAL_DELIVERABLE")
    .reduce((s, r) => s + r.remaining, 0);

  return {
    totalBudget,
    target80Amount,
    currentRealized,
    currentPct,
    gapTo80,
    recommendedTotalRealized,
    recommendedPct,
    internalDeliverablePotential,
    rows,
  };
}
