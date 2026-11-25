import {
  RabRealizationSummary,
  SNT_WILAYAH_2_LOCATIONS,
  SntRekapRecord,
} from "./snt-report-templates";

export type EvidenceDocType =
  | "HONOR_FASIL_BULANAN"
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
    fullTitle: "Daftar Tanda Terima Honorarium Fasilitator KKA & Robotika (Harga Satuan Real)",
    template13Ref: "Pos A.4 · Kontrak/SK, absensi/rekap JP, daftar tanda terima, kwitansi honor",
    defaultRecipientMode: "MANUAL",
    description:
      "Otomatis menarik Rekap Honorarium bulanan (JP Intra, JP Ekstra, Total JP, Harga Satuan Real/JP, Total Honor) dengan kolom tanda tangan kosong + opsi edit/tambah bulan Nov–Des.",
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
  rows: MonthlyHonorReceiptRow[];
  totalJpIntra: number;
  totalJpEkstra: number;
  totalJP: number;
  totalHonor: number;
  totalTransport: number;
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
  recipientMode: RecipientMode;
  judulDokumen: string;
  periodeLabel: string;
  tanggalDokumen: string;
  sudahTerimaDari: string;
  catatan: string;
  items: EvidenceLineItem[];
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

export function getDefaultGenericEvidenceDraft(
  type: EvidenceDocType,
  sudahTerimaDari: string
): GenericEvidenceDraft {
  const meta = EVIDENCE_DOC_CATALOG.find((m) => m.type === type) || EVIDENCE_DOC_CATALOG[1];
  const today = new Date().toISOString().slice(0, 10);

  const presets: Partial<Record<EvidenceDocType, EvidenceLineItem[]>> = {
    HONOR_TIM: [
      {
        id: "ht-1",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Ketua Tim Pelaksana (4 jam × 3 bulan)",
        penerima: "",
        volume: 12,
        satuan: "jam",
        hargaSatuan: 900000,
        nominal: 10800000,
      },
      {
        id: "ht-2",
        tanggal: today,
        lokasi: "Wilayah 2",
        uraian: "Honorarium Koordinator Wilayah 2 (12 jam × 3 bulan)",
        penerima: "",
        volume: 36,
        satuan: "jam",
        hargaSatuan: 900000,
        nominal: 32400000,
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
