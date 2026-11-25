import { describe, it, expect } from "vitest";
import {
  BLANK_SIGNATURE_LINE,
  buildMonthlyFacilitatorHonorReceipt,
  buildMonthlyRabUnitHonorReceipt,
  computeTarget80Strategy,
  getDefaultGenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  getHonorTimPresetByRabCode,
  resolveRecipientDisplay,
  SNT_RAB_HONOR_FASIL_UNIT_PRICE,
  SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
} from "../lib/snt-evidence-docs";
import {
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderSewaRumahPdfHtml,
} from "../lib/snt-evidence-pdf";
import {
  computeRabRealizationSummary,
  getDefaultSntReportProfile,
  SntFasilitatorRecord,
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

  it("builds RAB unit rate Rp5.729.876/location for facilitators (blank on 2-fasil locations, selectable per row) and Tenaga Administrasi A.5", () => {
    const fasilitators: SntFasilitatorRecord[] = [
      { id: "f1", namaLengkap: "Muliyadi, S.Kom., M.Cs.", lokasiSNT: "Sulawesi Tenggara - Kab. Buton Tengah" },
      { id: "f2", namaLengkap: "Rando, S.Kom., M.Eng.", lokasiSNT: "Sulawesi Tenggara - Kab. Buton Tengah" },
      { id: "f3", namaLengkap: "Muh. Hanifudin H, S.Pd", lokasiSNT: "Maluku Utara - Kota Tidore Kepulauan" },
    ];
    const rekaps: SntRekapRecord[] = [
      {
        id: "rk-tidore",
        bulan: "2026-10",
        status: "APPROVED",
        totalHonor: 6796741,
        totalTransport: 0,
        totalJP: 48,
        totalJPIntra: 32,
        totalJPEkstra: 16,
        jumlahSesi: 4,
        fasilitatorId: "f3",
        fasilitator: { namaLengkap: "Muh. Hanifudin H, S.Pd", lokasiSNT: "Maluku Utara - Kota Tidore Kepulauan" },
      },
    ];

    const sheet = buildMonthlyRabUnitHonorReceipt("2026-10", rekaps, fasilitators);
    expect(sheet.pricingMode).toBe("RAB_SATUAN");
    expect(sheet.rows).toHaveLength(6);
    expect(sheet.totalHonor).toBe(SNT_RAB_HONOR_FASIL_UNIT_PRICE * 6);
    expect(sheet.totalHonor).toBe(34379256);

    // 5 lokasi multi-fasil kosong default; Tidore 1 fasil terisi dari rekap
    const buton = sheet.rows.find((r) => r.locationId === "buton-tengah");
    const tidore = sheet.rows.find((r) => r.locationId === "tidore");
    expect(buton?.nama).toBe("");
    expect(buton?.hargaSatuanReal).toBe(5729876);
    expect(tidore?.nama).toBe("Muh. Hanifudin H, S.Pd");

    // Simulasi user memilih 1 nama fasil untuk Buton Tengah dari dropdown, sementara Kupang tetap kosong
    const customSheet = {
      ...sheet,
      rows: sheet.rows.map((r) =>
        r.locationId === "buton-tengah" ? { ...r, nama: "Rando, S.Kom., M.Eng." } : r
      ),
    };
    const html = renderMonthlyFacilitatorHonorPdfHtml({
      sheet: customSheet,
      profile: getDefaultSntReportProfile(),
      includeTransportColumn: false,
      recipientMode: "MANUAL",
      tanggalCetak: "2026-10-31",
      includeIndividualKwitansi: true,
    });
    expect(html).toMatch(/Rp\s+5\.729\.876/);
    expect(html).toContain("Rando, S.Kom., M.Eng.");
    expect(html).toContain("Muh. Hanifudin H, S.Pd");
    expect(html).toContain(BLANK_SIGNATURE_LINE); // Kupang, Tebo, Tanjabtim, Minahasa Utara tetap kosong
    expect(html).not.toContain("POS RAB A.4");
    expect(html).not.toContain("TEMPLATE 13 BUKTI WAJIB");
    expect(html).not.toContain("Harga Satuan RAB");
    expect(html).not.toContain("Pos RAB A.4");
    expect(html).not.toContain("Fasilitator Penerima");
    expect(html).toContain("Honorarium Fasilitator KKA &amp; Robotika Bulan Oktober 2026 Lokasi SNT Kab. Buton Tengah");
    expect(html).toContain("Fasilitator,");

    // Preset Tenaga Administrasi Pos A.5 = 4 bulan × Rp5.729.876 = Rp22.919.504
    const adminPreset = getHonorTimPresetByRabCode("5");
    expect(adminPreset).toHaveLength(4);
    expect(adminPreset.every((it) => it.hargaSatuan === SNT_RAB_TENAGA_ADMIN_UNIT_PRICE)).toBe(true);
    expect(adminPreset.reduce((s, it) => s + it.nominal, 0)).toBe(22919504);
  });

  it("separates REAL vs PELAPORAN_SMART vs PELAPORAN_ONLY without double counting and computes variance", () => {
    const cats: SntRabCategoryRecord[] = [
      {
        id: "a",
        name: "A. BIAYA PERSONEL",
        items: [
          {
            id: "a4",
            code: "4",
            name: "Fasilitator Koding & KA",
            totalBudget: 137517024,
            expenses: [
              { id: "r-1", rabItemId: "a4", amount: 22396741, description: "Real 2 fasil/lokasi", date: "2026-10-31", status: "APPROVED", realizationType: "REAL" },
              { id: "p-1", rabItemId: "a4", amount: 34379256, description: "Pelaporan 6x5.729.876", date: "2026-10-31", status: "APPROVED", realizationType: "PELAPORAN" },
            ],
          },
        ],
      },
      {
        id: "b",
        name: "B. BIAYA NONPERSONEL",
        items: [
          {
            id: "b4b",
            code: "4b",
            name: "Sertifikasi STEM.org",
            totalBudget: 24000000,
            expenses: [
              { id: "r-2", rabItemId: "b4b", amount: 22000000, description: "Invoice STEM.org", date: "2026-10-15", status: "APPROVED", realizationType: "REAL" },
            ],
          },
        ],
      },
    ];

    const realSummary = computeRabRealizationSummary(cats, { includePpn11: false, basis: "REAL" });
    expect(realSummary.subtotalOfficialRealizedTotal).toBe(22396741 + 22000000);
    expect(realSummary.realTxCount).toBe(2);
    expect(realSummary.pelaporanTxCount).toBe(1);

    // PELAPORAN_SMART: pakai PELAPORAN pada A.4 (34.379.256, bukan dobel!), fallback ke REAL pada B.4b (22.000.000)
    const smartSummary = computeRabRealizationSummary(cats, { includePpn11: false, basis: "PELAPORAN_SMART" });
    expect(smartSummary.subtotalOfficialRealizedTotal).toBe(34379256 + 22000000);
    expect(smartSummary.subtotalOfficialRealizedReal).toBe(22396741 + 22000000);
    expect(smartSummary.subtotalOfficialRealizedTemplate).toBe(34379256 + 22000000);
    expect(smartSummary.varianceOfficialRealVsTemplate).toBe(34379256 - 22396741);

    const pelaporanOnly = computeRabRealizationSummary(cats, { includePpn11: false, basis: "PELAPORAN_ONLY" });
    expect(pelaporanOnly.subtotalOfficialRealizedTotal).toBe(34379256);
  });
});
