import { describe, it, expect } from "vitest";
import {
  computeKwitansiAuditSummary,
  computeLocationActivityStats,
  computeRabRealizationSummary,
  formatKwitansiNumber,
  getDefaultSntReportProfile,
  isOfficialRabCategory,
  SntRabCategoryRecord,
} from "../lib/snt-report-templates";
import {
  renderSntReportBundleHtml,
  renderStandaloneKwitansiPdfHtml,
} from "../lib/snt-report-pdf";

const SAMPLE_CATEGORIES: SntRabCategoryRecord[] = [
  {
    id: "cat-a",
    name: "A. BIAYA PERSONEL",
    items: [
      {
        id: "item-a4",
        code: "4",
        name: "Fasilitator Koding & KA (SMP & SMA)",
        totalBudget: 100000000,
        expenses: [
          {
            id: "exp-1",
            rabItemId: "item-a4",
            amount: 30000000,
            description: "Honor Sep",
            date: "2026-09-30T00:00:00.000Z",
            status: "APPROVED",
            receiptUrl: "https://example.com/nota-1.jpg",
            kwitansiRecord: { id: "k1", noKwitansi: "KWC/MTC/2026.09.30.001" },
          },
          {
            id: "exp-2",
            rabItemId: "item-a4",
            amount: 20000000,
            description: "Honor Okt",
            date: "2026-10-31T00:00:00.000Z",
            status: "APPROVED",
            receiptUrl: "https://example.com/nota-2.jpg",
            kwitansiRecord: null,
          },
        ],
      },
    ],
  },
  {
    id: "cat-b",
    name: "B. BIAYA NONPERSONEL",
    items: [
      {
        id: "item-b4b",
        code: "4b",
        name: "Biaya Sertifikasi Internasional STEM.org",
        totalBudget: 24000000,
        expenses: [
          {
            id: "exp-3",
            rabItemId: "item-b4b",
            amount: 22000000,
            description: "Sertifikasi STEM.org",
            date: "2026-11-14T00:00:00.000Z",
            status: "APPROVED",
            receiptUrl: null,
            kwitansiRecord: { id: "k-temp", noKwitansi: "KWT/TEMP/123" },
          },
        ],
      },
    ],
  },
  {
    id: "cat-c",
    name: "C. PENGELUARAN LAIN-LAIN (UNBUDGETED)",
    items: [
      {
        id: "item-c1",
        code: "C.1",
        name: "Pengeluaran Tak Terduga",
        totalBudget: 0,
        expenses: [
          {
            id: "exp-4",
            rabItemId: "item-c1",
            amount: 5000000,
            description: "Plakat",
            date: "2026-10-04T00:00:00.000Z",
            status: "APPROVED",
            receiptUrl: null,
            kwitansiRecord: null,
          },
        ],
      },
    ],
  },
];

describe("snt-report-templates & PDF bundle", () => {
  it("classifies official A/B RAB categories separately from C and IoT", () => {
    expect(isOfficialRabCategory("A. BIAYA PERSONEL")).toBe(true);
    expect(isOfficialRabCategory("B. BIAYA NONPERSONEL")).toBe(true);
    expect(isOfficialRabCategory("C. PENGELUARAN LAIN-LAIN (UNBUDGETED)")).toBe(false);
    expect(isOfficialRabCategory("F. Pengadaan Starter Kit IoT 100 Kit (5 Lokasi)")).toBe(false);
  });

  it("computes RAB A+B totals, monthly filter, PPN 11%, and Termin I absorption accurately", () => {
    const withoutPpn = computeRabRealizationSummary(SAMPLE_CATEGORIES, {
      monthKey: "2026-10",
      includePpn11: false,
      termin1Persen: 70,
      termin2Persen: 30,
    });

    expect(withoutPpn.subtotalOfficialBudget).toBe(124000000);
    expect(withoutPpn.subtotalOfficialRealizedTotal).toBe(72000000);
    expect(withoutPpn.subtotalOfficialRealizedPeriod).toBe(20000000);
    expect(withoutPpn.ppnBudget).toBe(0);
    expect(withoutPpn.extraRealizedTotal).toBe(5000000);
    expect(withoutPpn.termin1Pagu).toBe(Math.round(124000000 * 0.7));
    expect(withoutPpn.eligibleForTermin2).toBe(true);

    const withPpn = computeRabRealizationSummary(SAMPLE_CATEGORIES, {
      includePpn11: true,
    });
    expect(withPpn.ppnBudget).toBe(Math.round(124000000 * 0.11));
    expect(withPpn.grandTotalBudget).toBe(124000000 + Math.round(124000000 * 0.11));
  });

  it("audits receipt and official non-TEMP kwitansi readiness", () => {
    const auditOfficial = computeKwitansiAuditSummary(SAMPLE_CATEGORIES, true);
    expect(auditOfficial.totalTx).toBe(3);
    expect(auditOfficial.withReceiptCount).toBe(2);
    expect(auditOfficial.missingReceiptCount).toBe(1);
    expect(auditOfficial.withKwitansiCount).toBe(1);
    expect(auditOfficial.missingKwitansiCount).toBe(2);
    expect(auditOfficial.fullyReadyCount).toBe(1);

    const auditAll = computeKwitansiAuditSummary(SAMPLE_CATEGORIES, false);
    expect(auditAll.totalTx).toBe(4);
  });

  it("formats official kwitansi number and renders multi-template A4 PDF bundle HTML", () => {
    expect(formatKwitansiNumber("2026-11-15T00:00:00.000Z", 16)).toBe("KWC/MTC/2026.11.15.016");

    const profile = getDefaultSntReportProfile();
    const rabSummary = computeRabRealizationSummary(SAMPLE_CATEGORIES, { includePpn11: true });
    const audit = computeKwitansiAuditSummary(SAMPLE_CATEGORIES, true);
    const locationStats = computeLocationActivityStats(
      [{ id: "f1", namaLengkap: "Budi", lokasiSNT: "Nusa Tenggara Timur - Kab. Kupang" }],
      [{ id: "l1", date: "2026-10-05", jumlahJPIntra: 4, jumlahJPEkstra: 2, foto1: "https://ex/f.jpg", fasilitatorId: "f1" }],
      [],
      "2026-10"
    );

    const html = renderSntReportBundleHtml({
      selectedTemplates: ["13", "02", "04"],
      periodKey: "2026-10",
      profile,
      rabSummary,
      auditRows: audit.rows,
      locationStats,
      fasilitators: [{ id: "f1", namaLengkap: "Budi", lokasiSNT: "Nusa Tenggara Timur - Kab. Kupang" }],
      laporanKegiatan: [],
      drafts: {},
      includePpn11: true,
      includeExtraCategories: true,
      includeKwitansiPages: true,
      includeReceiptAttachments: true,
    });

    expect(html).toContain("LAPORAN PENGGUNAAN DANA");
    expect(html).toContain("LAPORAN BULANAN");
    expect(html).toContain("KOMPILASI LAPORAN BULANAN FASILITATOR");
    expect(html).toContain("KWC/MTC/2026.09.30.001");
    expect(html).toContain("https://example.com/nota-1.jpg");
    expect(html).toContain("Lampiran Tambahan: Pengeluaran di Luar RAB Resmi KAK");
  });

  it("renders standalone single and bulk kwitansi PDF HTML with optional receipt attachments", () => {
    const htmlWithReceipts = renderStandaloneKwitansiPdfHtml({
      items: [
        {
          noKwitansi: "KWC/MTC/2026.11.15.016",
          tanggal: "2026-11-15",
          sudahTerimaDari: "Yayasan Maleo Talenta Cendekia",
          perihal: "Jasa tenaga Admin Nov - Tenaga Administrasi",
          rabLabel: "5 - Tenaga Administrasi",
          penerima: "Donny Posumah",
          amount: 2500000,
          receiptUrls: ["https://example.com/admin-nov.jpg"],
        },
        {
          noKwitansi: "KWC/MTC/2026.11.11.017",
          tanggal: "2026-11-11",
          sudahTerimaDari: "Yayasan Maleo Talenta Cendekia",
          perihal: "Honorarium Fasilitator",
          rabLabel: "4 - Fasilitator Koding & KA",
          penerima: "Rocky Smart Lumowa",
          amount: 1560000,
          receiptUrls: [],
        },
      ],
      kopSurat: "maleo",
      kotaPengesahan: "Jakarta",
      includeReceipts: true,
    });

    expect(htmlWithReceipts).toContain("KWC/MTC/2026.11.15.016");
    expect(htmlWithReceipts).toContain("KWC/MTC/2026.11.11.017");
    expect(htmlWithReceipts).toContain("Donny Posumah");
    expect(htmlWithReceipts).toContain("/kop-maleo.png");
    expect(htmlWithReceipts).toContain("https://example.com/admin-nov.jpg");

    const htmlNoReceipts = renderStandaloneKwitansiPdfHtml({
      items: [
        {
          noKwitansi: "KWC/MTC/2026.11.15.016",
          tanggal: "2026-11-15",
          sudahTerimaDari: "Yayasan Maleo Talenta Cendekia",
          perihal: "Jasa tenaga Admin Nov",
          rabLabel: "5 - Tenaga Administrasi",
          penerima: "Donny Posumah",
          amount: 2500000,
          receiptUrls: ["https://example.com/admin-nov.jpg"],
        },
      ],
      kopSurat: "none",
      kotaPengesahan: "Jakarta",
      includeReceipts: false,
    });
    expect(htmlNoReceipts).not.toContain("https://example.com/admin-nov.jpg");
    expect(htmlNoReceipts).not.toContain("/kop-maleo.png");
  });
});
