import { describe, it, expect } from "vitest";
import {
  BLANK_SIGNATURE_LINE,
  buildDraftFromDriveMockupPreset,
  buildMonthlyFacilitatorHonorReceipt,
  buildMonthlyKorwilSlipHonorariumInputs,
  buildMonthlyPersonnelDraft,
  buildMonthlyRabUnitHonorReceipt,
  buildMonthlyTenagaAdminSlipHonorariumInputs,
  computeTarget80Strategy,
  DRIVE_MOCKUP_PRESETS,
  expandDraftIntoMonthlySlices,
  getDefaultGenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  getHonorTimPresetByRabCode,
  resolveRecipientDisplay,
  SNT_RAB_HONOR_FASIL_UNIT_PRICE,
  SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
} from "../lib/snt-evidence-docs";
import {
  renderMaleoTandaTerimaHtml,
  renderModernInvoiceHtml,
  renderModernKuitansiHtml,
  renderSlipHonorariumPdfDocumentHtml,
} from "../lib/snt-brand-kop";
import {
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderSewaRumahPdfHtml,
} from "../lib/snt-evidence-pdf";
import {
  buildDefaultRabPosDraft,
  buildTahap1RabPosDraft,
  normalizeRabPosCode,
  RAB_POS_CATALOG,
} from "../lib/snt-rab-pos-catalog";
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
      { id: "f1", namaLengkap: "Muliyadi, S.Kom., M.Cs.", lokasiSNT: "Sulawesi Tenggara - Kab. Buton Tengah", npwpNik: "7404010101880001", bankName: "BRI", bankAccount: "111222333" },
      { id: "f2", namaLengkap: "Rando, S.Kom., M.Eng.", lokasiSNT: "Sulawesi Tenggara - Kab. Buton Tengah", npwpNik: "7404010101890002", bankName: "Mandiri", bankAccount: "444555666" },
      { id: "f3", namaLengkap: "Muh. Hanifudin H, S.Pd", lokasiSNT: "Maluku Utara - Kota Tidore Kepulauan", npwpNik: "8201010101900003", bankName: "BNI", bankAccount: "777888999" },
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
      fasilitators,
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
    expect(html).toContain("SLIP HONORARIUM");
    expect(html).toContain("7404010101890002"); // NPWP/NIK Rando dari profil fasil
    expect(html).toContain("Mandiri — 444555666"); // Rekening Rando dari profil fasil
    expect(html).toContain("8201010101900003"); // NPWP/NIK Hanif dari profil fasil
    expect(html).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    expect(html).toContain("Fasilitator KKA — Lokasi SNT Kab. Buton Tengah");
    expect(html).toContain("KKA Sekolah Nasional Terintegrasi Tahun 2026");

    // Preset Tenaga Administrasi Pos A.5 = 3,5 bulan × Rp5.729.876 = Rp20.054.566 (Sep–Nov 1 bln, Des 0,5 bln)
    const adminPreset = getHonorTimPresetByRabCode("5");
    expect(adminPreset).toHaveLength(4);
    expect(adminPreset.every((it) => it.hargaSatuan === SNT_RAB_TENAGA_ADMIN_UNIT_PRICE)).toBe(true);
    expect(adminPreset[3].volume).toBe(0.5);
    expect(adminPreset[3].nominal).toBe(2864938);
    expect(adminPreset.reduce((s, it) => s + it.nominal, 0)).toBe(20054566);
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

  it("renders all 10 Tahap I / Drive mockup presets with dual-tone LPD & Robotic Explorer kop, modern Invoice, Kuitansi, and PPh honor table without MOCKUP watermark", () => {
    expect(DRIVE_MOCKUP_PRESETS).toHaveLength(10);
    const profile = getDefaultSntReportProfile();

    // Sinkronisasi angka Tabel 1 Simulasi 80%
    expect(buildDraftFromDriveMockupPreset("LPD_B1", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(3080000);
    expect(buildDraftFromDriveMockupPreset("RE_B4A", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(17600000);
    expect(buildDraftFromDriveMockupPreset("TIM_A2", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(112941177);
    expect(buildDraftFromDriveMockupPreset("MALEO_B5", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(84480000);
    expect(buildDraftFromDriveMockupPreset("B7A_ATK", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(24268320);
    expect(buildDraftFromDriveMockupPreset("B7C_HDD", profile).items.reduce((s, it) => s + it.nominal, 0)).toBe(18000000);
    expect(getDefaultGenericEvidenceDraft("TRANSPORT_KOMPETISI", "Yayasan Maleo").items.reduce((s, it) => s + it.nominal, 0)).toBe(21600000);

    // LPD 1 (A.3): Invoice + Kuitansi Kop LPD
    const lpdA3 = buildDraftFromDriveMockupPreset("LPD_A3", profile);
    const lpdHtml = renderGenericEvidencePdfHtml({
      type: "INVOICE_KUITANSI_MITRA",
      draft: lpdA3,
      profile,
      includeKwitansiSlips: true,
    });
    expect(lpdHtml).toContain("/logo-lpd.png");
    expect(lpdHtml).toContain("LPD JULLY TJINDRAWAN ROBOTIK");
    expect(lpdHtml).toContain("INVOICE");
    expect(lpdHtml).toContain("SLIP HONORARIUM");
    expect(lpdHtml).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    expect(lpdHtml).toContain("INV/LPD/SNT-W2/001/XI/2026");
    expect(lpdHtml).not.toContain("Tempel materai Rp10.000");
    expect(lpdHtml).not.toContain("Direktur, LPD Jully Tjindrawan Robotik");
    expect(lpdHtml).not.toContain("MOCKUP");

    // RE 3 (B.6a): Daftar Tanda Terima (dengan PPh %) + 6 Kuitansi Kop Robotic Explorer
    const reB6a = buildDraftFromDriveMockupPreset("RE_B6A", profile);
    expect(reB6a.items).toHaveLength(6);
    expect(reB6a.items.reduce((s, it) => s + it.nominal, 0)).toBe(100800000);
    const reHtml = renderGenericEvidencePdfHtml({
      type: "INVOICE_KUITANSI_MITRA",
      draft: reB6a,
      profile,
      includeKwitansiSlips: true,
    });
    expect(reHtml).toContain("/logo-robotic-explorer.png");
    expect(reHtml).toContain("ROBOTIC EXPLORER");
    expect(reHtml).toContain("DAFTAR TANDA TERIMA HONORARIUM");
    expect(reHtml).toContain("Diterima (Neto)");
    expect(reHtml).toContain("SNT 17 Tanjung Jabung Timur");
    expect(reHtml).not.toContain("MOCKUP");
  });

  it("supports per-month Invoice, Daftar Tanda Terima, and Kuitansi printing for A.3, A.4, and A.5", () => {
    const profile = getDefaultSntReportProfile();

    // A.3 (3,5 bulan RAB = 12+12+12+6 = 42 jam × Rp900.000 = Rp37.800.000) & split per bulan
    const a3Draft = buildMonthlyPersonnelDraft("3", "RAB_4_BULAN", profile);
    expect(a3Draft.items).toHaveLength(4);
    expect(a3Draft.items.reduce((s, it) => s + it.nominal, 0)).toBe(37800000);
    expect(a3Draft.items[3].volume).toBe(6);
    expect(a3Draft.items[3].nominal).toBe(5400000);
    const korwilSlips = buildMonthlyKorwilSlipHonorariumInputs(profile, "maleo");
    expect(korwilSlips).toHaveLength(4);
    expect(korwilSlips.reduce((s, sl) => s + sl.components[0].pendapatan, 0)).toBe(37800000);
    expect(korwilSlips[0].kegiatan).toBe("KKA Sekolah Nasional Terintegrasi Tahun 2026");
    expect(korwilSlips[0].disiapkanOleh).toBe("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    const a3Slices = expandDraftIntoMonthlySlices(a3Draft, "SPLIT_EACH_MONTH");
    expect(a3Slices).toHaveLength(4);
    expect(a3Slices[1].periodeLabel).toBe("Oktober 2026");

    const a3OctOnly = expandDraftIntoMonthlySlices(a3Draft, "2026-10");
    expect(a3OctOnly).toHaveLength(1);
    const a3OctHtml = renderGenericEvidencePdfHtml({
      type: "INVOICE_KUITANSI_MITRA",
      draft: { ...a3Draft, monthlyPrintFilter: "2026-10" },
      profile,
      includeKwitansiSlips: true,
    });
    expect(a3OctHtml).toContain("INVOICE");
    expect(a3OctHtml).toContain("SLIP HONORARIUM");
    expect(a3OctHtml).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    expect(a3OctHtml).toContain("Oktober 2026");
    expect(a3OctHtml).toContain("INV/LPD/SNT-W2-A3/002/X/2026");

    // A.5 (3,5 bulan RAB = Sep–Nov 1 bln @Rp5.729.876 + Des 0,5 bln Rp2.864.938 = Rp20.054.566 & 3 bulan LPD = Rp9.987.397)
    const a5Rab = buildMonthlyPersonnelDraft("5", "RAB_4_BULAN", profile);
    expect(a5Rab.items).toHaveLength(4);
    expect(a5Rab.items[3].volume).toBe(0.5);
    expect(a5Rab.items[3].nominal).toBe(2864938);
    expect(a5Rab.items.reduce((s, it) => s + it.nominal, 0)).toBe(20054566);
    const adminSlips = buildMonthlyTenagaAdminSlipHonorariumInputs(profile, "maleo");
    expect(adminSlips).toHaveLength(4);
    expect(adminSlips[3].components[0].qty).toBe("0,5 bulan");
    expect(adminSlips[3].components[0].pendapatan).toBe(2864938);
    expect(adminSlips.reduce((s, sl) => s + sl.components[0].pendapatan, 0)).toBe(20054566);
    expect(adminSlips[0].kegiatan).toBe("KKA Sekolah Nasional Terintegrasi Tahun 2026");
    expect(adminSlips[0].disiapkanOleh).toBe("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    const adminWithTtHtml = renderSlipHonorariumPdfDocumentHtml(
      adminSlips,
      "Tanda Terima & Slip Tenaga Administrasi",
      { includeTandaTerima: true }
    );
    expect(adminWithTtHtml).toContain("TANDA TERIMA");
    expect(adminWithTtHtml).toContain("SLIP HONORARIUM");
    expect(adminWithTtHtml).toContain("(8 lembar)");
    expect(adminWithTtHtml).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    const a5Lpd = buildMonthlyPersonnelDraft("5", "LPD_3_BULAN", profile);
    expect(a5Lpd.items).toHaveLength(3);
    expect(a5Lpd.items.reduce((s, it) => s + it.nominal, 0)).toBe(9987397);

    // A.4 bulanan dengan Invoice + Daftar Tanda Terima + Slip Honorarium
    const a4Sheet = buildMonthlyRabUnitHonorReceipt("2026-10", [], []);
    const a4Html = renderMonthlyFacilitatorHonorPdfHtml({
      sheet: a4Sheet,
      profile,
      kopSuratOverride: "lpd",
      includeTransportColumn: false,
      recipientMode: "MANUAL",
      tanggalCetak: "2026-10-31",
      includeIndividualKwitansi: true,
      includeInvoice: true,
    });
    expect(a4Html).toContain("INVOICE");
    expect(a4Html).toContain("DAFTAR TANDA TERIMA HONORARIUM FASILITATOR");
    expect(a4Html).toContain("SLIP HONORARIUM");
    expect(a4Html).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    expect(a4Html).toContain("INV/LPD/SNT-W2-A4/002/X/2026");
  });

  it("renders all 4 official Yayasan Maleo administrative formats (Invoice, Kwitansi, Tanda Terima, Slip Honorarium)", () => {
    const profile = getDefaultSntReportProfile();

    // 1. Maleo Invoice (#00ADB5, Bank Mandiri, Mutiara Hikma Mahendradatta)
    const maleoInv = renderModernInvoiceHtml({
      kopSurat: "maleo",
      profile,
      noInvoice: "INV.2026.11.27.001",
      tanggal: "2026-11-27",
      jatuhTempo: "2026-12-10",
      ditagihkanKepada: "PPK Ditjen PAUD Dikdasmen",
      items: [{ uraian: "Langganan LMS KKA & Robotika", qty: 1, satuan: "paket", hargaSatuan: 84480000, jumlah: 84480000 }],
    });
    expect(maleoInv).toContain("#00ADB5");
    expect(maleoInv).toContain("INV.2026.11.27.001");
    expect(maleoInv).toContain("BANK MANDIRI");
    expect(maleoInv).toContain("MALEO TALENTA CENDEKIA");
    expect(maleoInv).toContain("Mutiara Hikma Mahendradatta, BBA., MBA.");
    expect(maleoInv).toContain("ADDITIONAL FEE");

    // 2. Maleo Kwitansi (#009999, Subtotal, PPN 11%, Total Pembayaran, Ketua Yayasan)
    const maleoKwt = renderModernKuitansiHtml({
      kopSurat: "maleo",
      profile,
      noKwitansi: "KWT.2026.11.27.001",
      sudahTerimaDari: "Yayasan Maleo Talenta Cendekia",
      amount: 5729876,
      ppnPct: 0,
      untukPembayaran: "Honorarium Fasilitator Oktober 2026",
      kota: "Jakarta",
      tanggal: "2026-11-27",
      penerimaDisplay: "Muliyadi, S.Kom., M.Cs.",
      penerimaRole: "Fasilitator,",
    });
    expect(maleoKwt).toContain("#009999");
    expect(maleoKwt).toContain("KWT.2026.11.27.001");
    expect(maleoKwt).toContain("Total Pembayaran");
    expect(maleoKwt).toContain("PT Jully Tjindrawan Robotik (Robotic Explorer)");
    expect(maleoKwt).toContain("Mutiara Hikma Mahendradatta, BBA., MBA.");

    // 3. Maleo Tanda Terima (#00ADB5, Kepada Yth., Dibayarkan oleh, Diterima Oleh)
    const maleoTt = renderMaleoTandaTerimaHtml({
      kopSurat: "maleo",
      profile,
      tanggal: "2026-11-27",
      kepadaYth: "Muliyadi, S.Kom., M.Cs.",
      items: [{ deskripsi: "Honorarium Fasilitator Oktober 2026", total: 5729876 }],
    });
    expect(maleoTt).toContain("TANDA TERIMA");
    expect(maleoTt).toContain("Kepada Yth.");
    expect(maleoTt).toContain("Dibayarkan oleh,");
    expect(maleoTt).toContain("Diterima Oleh,");

    // 4. Maleo Slip Honorarium (#0DA7A0 + #CBF5F1, HONORARIUM BERSIH DITERIMA, electronic footer)
    const slipHtml = renderSlipHonorariumPdfDocumentHtml([
      {
        kopSurat: "maleo",
        profile,
        periode: "Oktober 2026",
        namaPenerima: "Muh. Hanifudin H, S.Pd",
        nomorDokumen: "KWT.2026.10.31.001",
        peranJabatan: "Fasilitator KKA & Robotika (Kota Tidore Kepulauan)",
        kegiatan: "Program SNT 2026 — Wilayah 2",
        tanggalKegiatan: "1 – 31 Oktober 2026",
        tanggalBayar: "2026-10-31",
        npwpNik: "8201010101900001",
        rekening: "BRI — 1234567890",
        components: [
          { komponen: "Honorarium", qty: "1 Bulan", pendapatan: 5729876, potongan: 0, keterangan: "SNT Tidore" },
          { komponen: "Tambahan honorarium", qty: "-", pendapatan: 0, potongan: 0, keterangan: "-" },
          { komponen: "Pajak / potongan lainnya", qty: "-", pendapatan: 0, potongan: 0, keterangan: "-" },
        ],
      },
    ]);
    expect(slipHtml).toContain("SLIP HONORARIUM");
    expect(slipHtml).toContain("HONORARIUM BERSIH DITERIMA");
    expect(slipHtml).toContain("8201010101900001");
    expect(slipHtml).toContain("Slip gaji ini dibuat secara elektronik dan hanya digunakan untuk keperluan internal.");
  });

  it("provides 23 official RAB pos menus with independent 4-document checklists (Invoice, Tanda Terima, Slip Gaji, Kwitansi)", () => {
    expect(RAB_POS_CATALOG).toHaveLength(23);
    expect(RAB_POS_CATALOG.filter((m) => m.group === "A")).toHaveLength(5);
    expect(RAB_POS_CATALOG.filter((m) => m.group === "B")).toHaveLength(18);
    expect(normalizeRabPosCode("A.3")).toBe("3");
    expect(normalizeRabPosCode("B.6a")).toBe("6a");

    const profile = getDefaultSntReportProfile();
    const a3 = buildDefaultRabPosDraft("3", profile);
    expect(a3.items.reduce((s, it) => s + it.nominal, 0)).toBe(37800000);
    expect(a3.includeDaftarTandaTerima).toBe(true);
    expect(a3.includeSlipGaji).toBe(true);
    expect(a3.includeInvoice).toBe(false);
    expect(a3.includeKwitansi).toBe(false);

    // Admin mencentang ke-4 dokumen sekaligus untuk Oktober 2026
    const all4Html = renderGenericEvidencePdfHtml({
      type: "INVOICE_KUITANSI_MITRA",
      draft: {
        ...a3,
        includeInvoice: true,
        includeDaftarTandaTerima: true,
        includeSlipGaji: true,
        includeKwitansi: true,
        monthlyPrintFilter: "2026-10",
        slipNpwpNik: "3173010101800001",
      },
      profile,
      includeKwitansiSlips: true,
    });
    expect(all4Html).toContain("INVOICE");
    expect(all4Html).toContain("TANDA TERIMA");
    expect(all4Html).toContain("SLIP HONORARIUM");
    expect(all4Html).toContain("KWITANSI");
    expect(all4Html).toContain("3173010101800001");

    const a5 = buildDefaultRabPosDraft("5", profile);
    expect(a5.items.reduce((s, it) => s + it.nominal, 0)).toBe(20054566);
    expect(buildTahap1RabPosDraft("2", profile)?.items.reduce((s, it) => s + it.nominal, 0)).toBe(112941177);
    expect(buildTahap1RabPosDraft("3", profile)?.items.reduce((s, it) => s + it.nominal, 0)).toBe(32018823);
    expect(buildTahap1RabPosDraft("5", profile)?.items.reduce((s, it) => s + it.nominal, 0)).toBe(9987397);

    // Pos A.4 mendukung ke-4 checklist secara independen
    const a4All4Html = renderMonthlyFacilitatorHonorPdfHtml({
      sheet: buildMonthlyRabUnitHonorReceipt("2026-10", [], []),
      profile,
      kopSuratOverride: "maleo",
      includeTransportColumn: false,
      recipientMode: "MANUAL",
      tanggalCetak: "2026-10-31",
      includeInvoice: true,
      includeTandaTerima: true,
      includeSlipGaji: true,
      includeKwitansi: true,
    });
    expect(a4All4Html).toContain("INVOICE");
    expect(a4All4Html).toContain("DAFTAR TANDA TERIMA HONORARIUM FASILITATOR");
    expect(a4All4Html).toContain("SLIP HONORARIUM");
    expect(a4All4Html).toContain("KWITANSI");
  });
});
