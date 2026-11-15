import { describe, it, expect } from "vitest";
import {
  getEditableExpenseNotaUrls,
  getExpenseReceiptUrls,
  normalizeReceiptUrlList,
  renderReceiptAttachmentPagesHtml,
} from "../lib/expense-receipts";

describe("expense-receipts helpers", () => {
  it("normalizes and deduplicates receipt URLs while preserving order", () => {
    expect(
      normalizeReceiptUrlList([
        " https://example.com/a.jpg ",
        "",
        null,
        undefined,
        "https://example.com/b.png",
        "https://example.com/a.jpg",
      ])
    ).toEqual(["https://example.com/a.jpg", "https://example.com/b.png"]);
  });

  it("preserves legacy single receiptUrl and paymentReceiptUrl alongside receiptUrls", () => {
    expect(
      getExpenseReceiptUrls({
        receiptUrl: "https://cdn.example/old.jpg",
        receiptUrls: [],
        paymentReceiptUrl: null,
      })
    ).toEqual(["https://cdn.example/old.jpg"]);

    expect(
      getExpenseReceiptUrls({
        receiptUrl: "https://cdn.example/1.jpg",
        receiptUrls: ["https://cdn.example/1.jpg", "https://cdn.example/2.png"],
        paymentReceiptUrl: "https://cdn.example/pay.pdf",
      })
    ).toEqual([
      "https://cdn.example/1.jpg",
      "https://cdn.example/2.png",
      "https://cdn.example/pay.pdf",
    ]);

    expect(
      getEditableExpenseNotaUrls({
        receiptUrl: null,
        receiptUrls: [],
        paymentReceiptUrl: "https://cdn.example/legacy-pay.jpg",
      })
    ).toEqual(["https://cdn.example/legacy-pay.jpg"]);
  });

  it("renders separate printable attachment pages for each image and PDF", () => {
    const html = renderReceiptAttachmentPagesHtml([
      "https://cdn.example/nota-1.jpg",
      "https://cdn.example/nota-2.pdf?token=abc",
    ]);
    expect(html).toContain("Lampiran Bukti Pengeluaran (1 dari 2)");
    expect(html).toContain("Lampiran Bukti Pengeluaran (2 dari 2)");
    expect(html).toContain("<img src=\"https://cdn.example/nota-1.jpg\"");
    expect(html).toContain("Lihat PDF Bukti 2".replace("Lihat", "melihat"));
  });
});
