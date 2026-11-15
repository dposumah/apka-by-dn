export interface ExpenseWithReceipts {
  receiptUrl?: string | null;
  receiptUrls?: string[] | null;
  paymentReceiptUrl?: string | null;
}

/**
 * Membersihkan daftar URL bukti (trim, hapus string kosong, dan deduplikasi
 * sambil mempertahankan urutan asli).
 */
export function normalizeReceiptUrlList(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of urls) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

/**
 * Mengambil seluruh URL bukti pengeluaran (mendukung multi-file `receiptUrls`
 * serta menjaga kompatibilitas data lama `receiptUrl` dan `paymentReceiptUrl`).
 */
export function getExpenseReceiptUrls(expense?: ExpenseWithReceipts | null): string[] {
  if (!expense) return [];
  return normalizeReceiptUrlList([
    ...(Array.isArray(expense.receiptUrls) ? expense.receiptUrls : []),
    expense.receiptUrl,
    expense.paymentReceiptUrl,
  ]);
}

/**
 * Mengambil URL bukti nota yang bisa diedit (prioritas `receiptUrls` + `receiptUrl`,
 * atau fallback ke `paymentReceiptUrl` bila hanya itu yang tersimpan pada data lama).
 */
export function getEditableExpenseNotaUrls(expense?: ExpenseWithReceipts | null): string[] {
  if (!expense) return [];
  const notaUrls = normalizeReceiptUrlList([
    ...(Array.isArray(expense.receiptUrls) ? expense.receiptUrls : []),
    expense.receiptUrl,
  ]);
  if (notaUrls.length > 0) return notaUrls;
  return normalizeReceiptUrlList([expense.paymentReceiptUrl]);
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Menghasilkan halaman HTML cetak untuk seluruh lampiran bukti (1 halaman per file).
 */
export function renderReceiptAttachmentPagesHtml(urls: string[]): string {
  const cleanUrls = normalizeReceiptUrlList(urls);
  if (cleanUrls.length === 0) return "";

  return cleanUrls
    .map((url, idx) => {
      const safeUrl = escapeHtmlAttr(url);
      const isPdf = url.toLowerCase().split("?")[0].endsWith(".pdf");
      const label =
        cleanUrls.length > 1
          ? `Lampiran Bukti Pengeluaran (${idx + 1} dari ${cleanUrls.length})`
          : "Lampiran Bukti Pengeluaran";

      return `
        <div style="page-break-before: always; padding: 40px; font-family: sans-serif; box-sizing: border-box; width: 100%; text-align: center;">
          <h3 style="margin-bottom: 20px;">${label}</h3>
          ${
            isPdf
              ? `<div style="padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
                   <p>Lampiran ini berformat PDF dan tidak dapat dicetak langsung di halaman ini.</p>
                   <a href="${safeUrl}" target="_blank" style="color: blue; text-decoration: underline;">Klik di sini untuk melihat PDF Bukti ${idx + 1}</a>
                 </div>`
              : `<img src="${safeUrl}" style="max-width: 100%; max-height: 900px; object-fit: contain; border: 1px solid #ccc; padding: 10px;" alt="Bukti Nota ${idx + 1}" />`
          }
        </div>
      `;
    })
    .join("");
}
