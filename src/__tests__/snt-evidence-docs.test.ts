import { describe, it, expect } from "vitest";
import {
  BLANK_SIGNATURE_LINE,
  buildMonthlyFacilitatorHonorReceipt,
  computeTarget80Strategy,
  getDefaultGenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  resolveRecipientDisplay,
} from "../lib/snt-evidence-docs";
import {
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderSewaRumahPdfHtml,
} from "../lib/snt-evidence-pdf";
import {
  computeRabRealizationSummary,
  getDefaultSntReportProfile,
  SntRabCategoryRecord,
  SntRekapRecord,
} from "../lib/snt-report-templates";

describe("snt-evidence-docs & target > 80% strategy", () => {
  it("computes monthly facilitator honor receipts using actual unit rate per JP", () => {
    const rekaps: SntRekapRecord[] = [
      {
        id: "r1",
        bulan: "2026-10",
        status: "APPROVED",
        totalHonor: 3120000,
        totalTransport: 800000,
        totalJP: 48,
        totalJPIntra: 32,
        totalJPEkstra: 16,
        jumlahSesi: 4,
        fasilitatorId: "f1",
        fasilitator: { namaLengkap: "Dr. Ir. Almido H. Ginting", lokasiSNT: "NTT - Kab. Kupang" },
      },
      {
        id: "r2",
        bulan: "2026-10",
        status: "APPROVED",
        totalHonor: 6796741,
        totalTransport: 0,
        totalJP: 48,
        totalJPIntra: 32,
        totalJPEkstra: 16,
        jumlahSesi: 4,
        fasilitatorId: "f2",
        fasilitator: { namaLengkap: "Muh. Hanifudin H, S.Pd", lokasiSNT: "Maluku Utara - Tidore" },
      },
      {
        id: "r3",
        bulan: "2026-09",
        status: "APPROVED",
        totalHonor: 1560000,
        totalTransport: 360000,
        totalJP: 24,
        totalJPIntra: 24,
        totalJPEkstra: 0,
        jumlahSesi: 3,
        fasilitatorId: "f3",
        fasilitator: { namaLengkap: "Chindra Saputra", lokasiSNT: "Jambi - Tanjabtim" },
      },
    ];

    const oct = buildMonthlyFacilitatorHonorReceipt(rekaps, "2026-10");
    expect(oct.rows).toHaveLength(2);
    expect(oct.totalHonor).toBe(9916741);
    expect(oct.totalTransport).toBe(800000);
    expect(oct.rows.find((r) => r.id === "r1")?.hargaSatuanReal).toBe(65000);
    expect(oct.rows.find((r) => r.id === "r2")?.hargaSatuanReal).toBe(141599);

    const html = renderMonthlyFacilitatorHonorPdfHtml({
      sheet: oct,
      profile: getDefaultSntReportProfile(),
      includeTransportColumn: false,
      recipientMode: "MANUAL",
      tanggalCetak: "2026-10-31",
      includeIndividualKwitansi: true,
    });
    expect(html).toContain("DAFTAR TANDA TERIMA HONORARIUM FASILITATOR");
    expect(html).toContain("Dr. Ir. Almido H. Ginting");
    expect(html).toMatch(/Rp\s+65\.000/);
    expect(html).not.toContain("Info Transport");
  });

  it("renders blank recipient lines by default and supports manual override on Kontrak Sewa & Kwitansi Bulanan", () => {
    expect(resolveRecipientDisplay("BLANK", "Budi")).toBe(BLANK_SIGNATURE_LINE);
    expect(resolveRecipientDisplay("MANUAL", "Pak Hendra")).toBe("Pak Hendra");
    expect(resolveRecipientDisplay("MANUAL", "")).toBe(BLANK_SIGNATURE_LINE);

    const sewa = getDefaultSewaRumahDraft();
    const blankHtml = renderSewaRumahPdfHtml({
      draft: sewa,
      profile: getDefaultSntReportProfile(),
      includeMonthlyKwitansi: true,
    });
    expect(blankHtml).toContain("SURAT PERJANJIAN SEWA MENYEWA RUMAH / KOST");
    expect(blankHtml).toContain(BLANK_SIGNATURE_LINE);
    expect(blankHtml).toContain("Periode September 2026");
    expect(blankHtml).toContain("Periode Desember 2026");

    const manualHtml = renderSewaRumahPdfHtml({
      draft: { ...sewa, recipientMode: "MANUAL", namaPemilik: "H. Abdullah", namaFasilitator: "Muliyadi" },
      profile: getDefaultSntReportProfile(),
      includeMonthlyKwitansi: false,
    });
    expect(manualHtml).toContain("H. Abdullah");
    expect(manualHtml).toContain("Muliyadi");
  });

  it("computes >80% RAB strategy gap and renders generic evidence PDF with kwitansi slips", () => {
    const cats: SntRabCategoryRecord[] = [
      {
        id: "a",
        name: "A. BIAYA PERSONEL",
        items: [
          { id: "i2", code: "2", name: "Tim Program Koding KA Robotika", totalBudget: 133333334, expenses: [] },
          {
            id: "i4",
            code: "4",
            name: "Fasilitator Koding & KA",
            totalBudget: 137517024,
            expenses: [{ id: "e1", rabItemId: "i4", amount: 36436741, description: "Honor", date: "2026-10-31", status: "APPROVED" }],
          },
        ],
      },
      {
        id: "b",
        name: "B. BIAYA NONPERSONEL",
        items: [
          { id: "i6a", code: "6a", name: "Pembinaan Kompetisi Coding & Robotika", totalBudget: 126000000, expenses: [] },
          { id: "i6b", code: "6b", name: "Biaya Transport Lokal Kompetisi", totalBudget: 27000000, expenses: [] },
        ],
      },
    ];

    const summary = computeRabRealizationSummary(cats, { includePpn11: false });
    const strategy = computeTarget80Strategy(summary);

    expect(strategy.target80Amount).toBe(Math.ceil(summary.subtotalOfficialBudget * 0.8));
    expect(strategy.gapTo80).toBeGreaterThan(0);
    expect(strategy.recommendedPct).toBeGreaterThan(80);
    expect(strategy.internalDeliverablePotential).toBe(133333334 + 126000000);

    const draft = getDefaultGenericEvidenceDraft("PEMBINAAN_KOMPETISI", "Yayasan Maleo Talenta Cendekia");
    const html = renderGenericEvidencePdfHtml({
      type: "PEMBINAAN_KOMPETISI",
      draft,
      profile: getDefaultSntReportProfile(),
      includeKwitansiSlips: true,
    });
    expect(html).toContain("Pembinaan Kompetisi Coding");
    expect(html).toContain("KWITANSI");
    expect(html).toContain(BLANK_SIGNATURE_LINE);
  });
});
