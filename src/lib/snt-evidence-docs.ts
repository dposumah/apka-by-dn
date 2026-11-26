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

/** Harga satuan resmi RAB Wilayah 2 Pos A.5 Tenaga Administrasi (1 org × 4 bln = Rp22.919.504) */
export const SNT_RAB_TENAGA_ADMIN_UNIT_PRICE = 5729876;

export type HonorPricingMode = "RAB_SATUAN" | "REAL_JP";

export type EvidenceDocType =
  | "HONOR_FASIL_BULANAN"
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
    shortTitle: "Daftar Tanda Terima Honor Fasil (Bulanan)",
    fullTitle: "Daftar Tanda Terima Honorarium Fasilitator KKA & Robotika",
    template13Ref: "Pos A.4 · Kontrak/SK, absensi/rekap JP, daftar tanda terima, kwitansi honor",
    defaultRecipientMode: "MANUAL",
    description:
      "Daftar tanda terima & kwitansi honor fasilitator bulanan (Standar RAB Rp5.729.876/lokasi atau Real/JP DB) dengan dropdown pilih nama fasil atau blanko kosong.",
  },
  {
    type: "INVOICE_KUITANSI_MITRA",
    rabCode: "3",
    shortTitle: "Invoice & Kuitansi Mitra (LPD / Robotic Explorer)",
    fullTitle: "Paket Invoice, Kuitansi & Daftar Tanda Terima (Kop LPD / Robotic Explorer)",
    template13Ref: "Preset 6 Paket Mockup Drive · LPD 1–3 (A.3, A.5, B.1a–c) & RE 1–3 (B.4a, B.4b, B.6a)",
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

export interface GenericEvidenceDraft {
  rabCode: string;
  rabCodeLabel?: string;
  kopSurat?: KopSuratOption;
  showRabCode?: boolean;
  includeInvoice?: boolean;
  includeDaftarTandaTerima?: boolean;
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
  | "RE_B6A";

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
    subtitle: "Invoice + Kuitansi · Kop LPD",
    totalAmount: 32018823,
  },
  {
    id: "LPD_A5",
    badge: "LPD 2 · A.5",
    kopSurat: "lpd",
    rabCode: "5",
    rabCodeLabel: "A.5",
    title: "Honor Tenaga Administrasi",
    subtitle: "Invoice + Kuitansi · Kop LPD",
    totalAmount: 9987397,
  },
  {
    id: "LPD_B1",
    badge: "LPD 3 · B.1a–c",
    kopSurat: "lpd",
    rabCode: "1b",
    rabCodeLabel: "B.1a, B.1b, B.1c",
    title: "Penyusunan & Pencetakan Laporan",
    subtitle: "Invoice (3 item) + Kuitansi · Kop LPD",
    totalAmount: 3218824,
  },
  {
    id: "RE_B4A",
    badge: "RE 1 · B.4a",
    kopSurat: "robotic",
    rabCode: "4a",
    rabCodeLabel: "B.4a",
    title: "Pelatihan In/On Boarding Fasilitator",
    subtitle: "Invoice + Kuitansi · Kop Robotic Explorer",
    totalAmount: 17957647,
  },
  {
    id: "RE_B4B",
    badge: "RE 2 · B.4b",
    kopSurat: "robotic",
    rabCode: "4b",
    rabCodeLabel: "B.4b",
    title: "Pelatihan Persiapan Sertifikasi STEM.org",
    subtitle: "Invoice + Kuitansi · Kop Robotic Explorer",
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
      kuitansiNoPrefix: "KW/LPD/SNT-W2/001/XI/2026",
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
          noDokumen: "KW/LPD/SNT-W2/001/XI/2026",
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
      kuitansiNoPrefix: "KW/LPD/SNT-W2/002/XI/2026",
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
          noDokumen: "KW/LPD/SNT-W2/002/XI/2026",
        },
      ],
    };
  }

  if (presetId === "LPD_B1") {
    return {
      rabCode: "1b",
      rabCodeLabel: "B.1a, B.1b, B.1c",
      kopSurat: "lpd",
      showRabCode: true,
      includeInvoice: true,
      includeDaftarTandaTerima: false,
      invoiceNo: "INV/LPD/SNT-W2/003/XI/2026",
      kuitansiNoPrefix: "KW/LPD/SNT-W2/003/XI/2026",
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
      judulDokumen: "Penyusunan & Pencetakan Laporan Pendahuluan, Bulanan dan Akhir SNT Wilayah 2",
      periodeLabel: "September – November 2026",
      tanggalDokumen: tgl,
      sudahTerimaDari: maleoName,
      catatan: "Mohon cantumkan No. Invoice pada berita transfer.",
      items: [
        {
          id: "lpd-b1a",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "B.1a Penyusunan & pencetakan Laporan Pendahuluan",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 169412,
          nominal: 169412,
          noDokumen: "KW/LPD/SNT-W2/003/XI/2026",
        },
        {
          id: "lpd-b1b",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "B.1b Penyusunan & pencetakan Laporan Bulanan (6 lokasi × 3 kali)",
          penerima: signerName,
          volume: 18,
          satuan: "laporan",
          hargaSatuan: 160000,
          nominal: 2880000,
          noDokumen: "KW/LPD/SNT-W2/003/XI/2026",
        },
        {
          id: "lpd-b1c",
          tanggal: tgl,
          lokasi: "Wilayah 2",
          uraian: "B.1c Penyusunan & pencetakan Laporan Akhir",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 169412,
          nominal: 169412,
          noDokumen: "KW/LPD/SNT-W2/003/XI/2026",
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
      kuitansiNoPrefix: "KW/RE/SNT-W2/001/XI/2026",
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
          uraian: "Pelatihan in/on boarding calon fasilitator SNT Wilayah 2 (6 lokasi) oleh Tim Program Koding, KA & Robotika",
          penerima: signerName,
          volume: 1,
          satuan: "paket",
          hargaSatuan: 17957647,
          nominal: 17957647,
          noDokumen: "KW/RE/SNT-W2/001/XI/2026",
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
      kuitansiNoPrefix: "KW/RE/SNT-W2/002/XI/2026",
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
          noDokumen: "KW/RE/SNT-W2/002/XI/2026",
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
    kuitansiNoPrefix: "KW/RE/SNT-W2-B6a",
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
      noDokumen: `KW/RE/SNT-W2-B6a/${String(idx + 1).padStart(3, "0")}/XI/2026`,
      catatan: `Fasilitator, ${r.snt}`,
    })),
  };
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
    return months.map((m) => ({
      id: `adm-${m.key}`,
      tanggal: m.date,
      lokasi: "Wilayah 2",
      uraian: `Honorarium Tenaga Administrasi — Bulan ${m.label}`,
      penerima: "",
      volume: 1,
      satuan: "bulan",
      hargaSatuan: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
      nominal: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
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
        uraian: "Honorarium Tim Program Koding KA Robotika (Penyusunan Modul & Kurikulum SMP & SMA)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 133333334,
        nominal: 133333334,
      },
    ];
  }

  if (c === "3") {
    return months.map((m) => ({
      id: `korwil-${m.key}`,
      tanggal: m.date,
      lokasi: "Wilayah 2",
      uraian: `Honorarium Koordinator Wilayah 2 — Bulan ${m.label} (12 jam)`,
      penerima: "",
      volume: 12,
      satuan: "jam",
      hargaSatuan: 900000,
      nominal: 10800000,
    }));
  }

  if (c === "4a") {
    return [
      {
        id: "narsum-1",
        tanggal: t,
        lokasi: "Jakarta / Wilayah 2",
        uraian: "Honorarium Narasumber Pelatihan In oleh Tim Program (ToT Fasilitator)",
        penerima: "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: 21200000,
        nominal: 21200000,
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
        uraian: "Honorarium Koordinator Wilayah 2 (12 jam × 4 bulan)",
        penerima: "",
        volume: 48,
        satuan: "jam",
        hargaSatuan: 900000,
        nominal: 43200000,
      },
      {
        id: "ht-3",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Tenaga Administrasi (Pos A.5 · Rp5.729.876/bulan)",
        penerima: "",
        volume: 1,
        satuan: "bulan",
        hargaSatuan: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
        nominal: SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
      },
    ],
    KORWIL_UANG_HARIAN: [
      {
        id: "uh-1",
        tanggal: today,
        lokasi: "Kab. Buton Tengah",
        uraian: "Uang Harian Kunjungan Monev Korwil Putaran 1",
        penerima: "",
        volume: 3,
        satuan: "hari",
        hargaSatuan: 400000,
        nominal: 1200000,
      },
    ],
    KORWIL_PENGINAPAN: [
      {
        id: "inap-1",
        tanggal: today,
        lokasi: "Kab. Buton Tengah",
        uraian: "Penginapan Hotel Kunjungan Monev Korwil (2 malam)",
        penerima: "",
        volume: 2,
        satuan: "malam",
        hargaSatuan: 600000,
        nominal: 1200000,
      },
    ],
    KORWIL_TRANSPORT: [
      {
        id: "tr-1",
        tanggal: today,
        lokasi: "Kab. Kupang",
        uraian: "Transportasi PP Perjalanan Dinas Monev Korwil Wilayah 2",
        penerima: "",
        volume: 1,
        satuan: "PP",
        hargaSatuan: 7500000,
        nominal: 7500000,
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
        uraian: "Akomodasi Pelatihan / ToT Fasilitator (6 org × 14 hari)",
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
      uraian: `Biaya Pembinaan Kompetisi Coding & Robotika (${loc.label} · 15 pert × 2 lomba)`,
      penerima: "",
      volume: 30,
      satuan: "pertemuan",
      hargaSatuan: 700000,
      nominal: 21000000,
    })),
    TRANSPORT_KOMPETISI: SNT_WILAYAH_2_LOCATIONS.map((loc, idx) => ({
      id: `tk-${idx + 1}`,
      tanggal: today,
      lokasi: loc.label,
      uraian: `Biaya Transport Lokal Pembinaan Kompetisi (${loc.label} · 15 pert × 2 lomba)`,
      penerima: "",
      volume: 30,
      satuan: "pertemuan",
      hargaSatuan: 150000,
      nominal: 4500000,
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
  if (["1", "2", "3", "5", "4a"].includes(c)) return "HONOR_TIM";
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
