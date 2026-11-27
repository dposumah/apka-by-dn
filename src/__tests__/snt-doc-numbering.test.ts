import { describe, it, expect } from "vitest";
import {
  buildDocumentRegisterCsv,
  computeNextSeqForEntity,
  extractSeqFromSntDocNumber,
  formatSntDocumentNumber,
  renderDocumentRegisterPdfHtml,
  resolveEntityCodeFromKop,
  resolveEntityCodeFromOwner,
  suggestEntityCodeForRabCode,
} from "../lib/snt-doc-numbering";

describe("snt-doc-numbering centralized entity register", () => {
  it("formats official Invoice and Kwitansi numbers per entity (Maleo dot-date vs LPD/RE SNT-W2 Roman)", () => {
    expect(formatSntDocumentNumber("INV", "LPD", 1, "2026-11-25")).toBe(
      "INV/LPD/SNT-W2/001/XI/2026"
    );
    expect(formatSntDocumentNumber("KW", "RE", 12, "2026-10-31")).toBe(
      "KW/RE/SNT-W2/012/X/2026"
    );
    expect(formatSntDocumentNumber("KW", "MTC", 3, "2026-09-30")).toBe(
      "KWT.2026.09.30.003"
    );
    expect(formatSntDocumentNumber("INV", "MTC", 1, "2026-11-27")).toBe(
      "INV.2026.11.27.001"
    );
  });

  it("keeps sequence counters independent per entity and ignores legacy KWC/MTC format", () => {
    const existing = [
      "KWC/MTC/2026.11.10.024",
      "KWT.2026.11.27.002",
      "INV.2026.11.27.004",
      "KW/LPD/SNT-W2/001/IX/2026",
      "KW/LPD/SNT-W2/002/X/2026",
      "KW/RE/SNT-W2/005/XI/2026",
      "INV/LPD/SNT-W2/003/XI/2026",
    ];

    expect(extractSeqFromSntDocNumber("KWC/MTC/2026.11.10.024", "KW", "MTC")).toBe(0);
    expect(computeNextSeqForEntity(existing, "KW", "MTC")).toBe(3);
    expect(computeNextSeqForEntity(existing, "INV", "MTC")).toBe(5);
    expect(computeNextSeqForEntity(existing, "KW", "LPD")).toBe(3);
    expect(computeNextSeqForEntity(existing, "KW", "RE")).toBe(6);
    expect(computeNextSeqForEntity(existing, "INV", "LPD")).toBe(4);
    expect(computeNextSeqForEntity(existing, "INV", "RE")).toBe(1);
  });

  it("resolves entities from Kop, Owner, and RAB codes accurately", () => {
    expect(resolveEntityCodeFromKop("lpd")).toBe("LPD");
    expect(resolveEntityCodeFromKop("robotic")).toBe("RE");
    expect(resolveEntityCodeFromKop("maleo")).toBe("MTC");

    expect(resolveEntityCodeFromOwner("LPD Jully Tjindrawan Robotik")).toBe("LPD");
    expect(resolveEntityCodeFromOwner("Robotic Explorer")).toBe("RE");
    expect(resolveEntityCodeFromOwner("Yayasan Maleo Talenta Cendekia")).toBe("MTC");

    expect(suggestEntityCodeForRabCode("3")).toBe("LPD");
    expect(suggestEntityCodeForRabCode("5")).toBe("LPD");
    expect(suggestEntityCodeForRabCode("1b")).toBe("LPD");
    expect(suggestEntityCodeForRabCode("4a")).toBe("RE");
    expect(suggestEntityCodeForRabCode("6a")).toBe("RE");
    expect(suggestEntityCodeForRabCode("4")).toBe("MTC");
    expect(suggestEntityCodeForRabCode("5a")).toBe("MTC");
  });

  it("exports CSV and printable PDF HTML for Buku Register Nomor", () => {
    const entries = [
      {
        id: "k1",
        kind: "KW" as const,
        docNumber: "KW/LPD/SNT-W2/001/XI/2026",
        entityCode: "LPD" as const,
        tanggal: "2026-11-25",
        rabCode: "3",
        rabName: "Koordinator Wilayah",
        realizationType: "PELAPORAN" as const,
        perihal: "Honorarium Korwil Nov 2026",
        penerimaOrOwner: "LPD Jully Tjindrawan Robotik",
        vendorReceiptNo: "NOTA-001",
        nominal: 10672941,
      },
      {
        id: "i1",
        kind: "INV" as const,
        docNumber: "INV/RE/SNT-W2/001/XI/2026",
        entityCode: "RE" as const,
        tanggal: "2026-11-25",
        rabCode: "4a",
        rabName: "Pelatihan In/On Boarding",
        realizationType: "PELAPORAN" as const,
        perihal: "Pelatihan In/On Boarding",
        penerimaOrOwner: "Robotic Explorer",
        vendorReceiptNo: null,
        nominal: 17600000,
      },
    ];

    const csv = buildDocumentRegisterCsv(entries);
    expect(csv).toContain("KW/LPD/SNT-W2/001/XI/2026");
    expect(csv).toContain("INV/RE/SNT-W2/001/XI/2026");
    expect(csv).toContain("NOTA-001");

    const html = renderDocumentRegisterPdfHtml({
      title: "BUKU REGISTER NOMOR KWITANSI, INVOICE & NOTA",
      subtitle: "SNT Wilayah 2",
      entries,
    });
    expect(html).toContain("BUKU REGISTER NOMOR KWITANSI, INVOICE &amp; NOTA");
    expect(html).toContain("KW/LPD/SNT-W2/001/XI/2026");
    expect(html).toContain("INV/RE/SNT-W2/001/XI/2026");
  });
});
