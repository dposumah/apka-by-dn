/**
 * Helper tipe data, pemformatan mata uang asing/IDR, dan generator teks WhatsApp
 * pengajuan pembayaran invoice untuk modul Cashflow Proyek.
 */

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  notes?: string | null;
}

export interface InvoiceSectionSummary {
  label: string;
  amount: number;
}

export interface InvoicePaymentOption {
  label: string;
  amount: number;
  scheme?: string;
}

export interface InvoiceBankAccount {
  bankName: string;
  branch?: string | null;
  accountNumber: string;
  accountHolder: string;
  swiftCode?: string | null;
  bankAddress?: string | null;
}

export interface ParsedInvoiceData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  paymentDeadlineText?: string | null;
  suggestedProject?: string | null;
  suggestedCategory: string;
  summaryTitle: string;
  currency: string;
  originalAmount: number;
  suggestedExchangeRate?: number | null;
  exchangeRateSource?: string | null;
  detectedSections: InvoiceSectionSummary[];
  paymentTermsSummary?: string | null;
  suggestedPaymentOptions: InvoicePaymentOption[];
  amountAnomalyNote?: string | null;
  lineItems: InvoiceLineItem[];
  bankAccount: InvoiceBankAccount;
  picName?: string | null;
  picPhone?: string | null;
}

export interface WhatsAppGeneratorInput {
  projectName: string;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  paymentDeadlineText?: string | null;
  description: string;
  category?: string | null;
  currency?: string | null;
  originalAmount?: number | null; // Nominal pembayaran terpilih dlm mata uang asli (misal USD 7070 atau IDR)
  fullInvoiceOriginalAmount?: number | null; // Total keseluruhan tagihan pada dokumen dlm mata uang asli
  exchangeRate?: number | null;
  amountIdr: number; // Nominal akhir Rupiah yang diajukan / masuk Cashflow
  paymentScheme?: string | null;
  paymentTermsSummary?: string | null;
  amountAnomalyNote?: string | null;
  lineItems?: InvoiceLineItem[];
  detectedSections?: InvoiceSectionSummary[];
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  swiftCode?: string | null;
  bankAddress?: string | null;
  picName?: string | null;
  picPhone?: string | null;
  receiptUrl?: string | null;
  status?: string | null;
}

export const FALLBACK_FX_RATES: Record<string, number> = {
  IDR: 1,
  USD: 15900,
  SGD: 11850,
  MYR: 3600,
  CNY: 2220,
  EUR: 17100,
  AUD: 10400,
  JPY: 105,
};

export function formatForeignCurrency(amount: number, currency = "IDR"): string {
  const cur = (currency || "IDR").toUpperCase();
  if (cur === "IDR" || cur === "RP") {
    return `Rp ${Math.round(amount || 0).toLocaleString("id-ID")}`;
  }
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${cur} ${formatted}`;
}

export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Menghasilkan teks pengajuan / permintaan transfer WhatsApp yang siap disalin & dikirim ke Finance / Pimpinan.
 */
export function generateInvoiceWhatsAppText(input: WhatsAppGeneratorInput): string {
  const cur = (input.currency || "IDR").toUpperCase();
  const isForeign = cur !== "IDR" && cur !== "RP";
  const lines: string[] = [];

  const statusTag = input.status === "COMPLETED" ? "LUNAS / KONFIRMASI TF" : "MENUNGGU TRANSFER";
  lines.push(`*PENGAJUAN PEMBAYARAN INVOICE (${statusTag})*`);
  lines.push(`Proyek: *${input.projectName || "Cashflow Proyek"}*`);
  if (input.category) {
    lines.push(`Kategori: ${input.category}`);
  }
  lines.push("");

  lines.push(`📄 *DETAIL TAGIHAN:*`);
  if (input.vendorName) lines.push(`• Vendor / Tujuan: *${input.vendorName}*`);
  if (input.invoiceNumber) lines.push(`• No. Dokumen / Inv: *${input.invoiceNumber}*`);
  if (input.invoiceDate) lines.push(`• Tgl. Dokumen: ${formatDateIndo(input.invoiceDate)}`);
  if (input.paymentDeadlineText || input.dueDate) {
    const deadlineDisplay = input.paymentDeadlineText || formatDateIndo(input.dueDate);
    lines.push(`• Batas Pembayaran: *${deadlineDisplay}*`);
  }
  lines.push(`• Keperluan: ${input.description}`);
  if (input.picName || input.picPhone) {
    const picParts = [input.picName, input.picPhone].filter(Boolean).join(" / ");
    lines.push(`• PIC / Kontak: ${picParts}`);
  }

  if (input.detectedSections && input.detectedSections.length > 1) {
    lines.push("");
    lines.push(`📊 *RINGKASAN BAGIAN BIAYA PADA DOKUMEN:*`);
    input.detectedSections.forEach((sec) => {
      lines.push(`• ${sec.label}: ${formatForeignCurrency(sec.amount, cur)}`);
    });
  }

  if (input.lineItems && input.lineItems.length > 0) {
    lines.push("");
    lines.push(`🧾 *RINCIAN ITEM PENGELUARAN:*`);
    input.lineItems.forEach((item, idx) => {
      const qtyStr = item.qty > 0 ? `${item.qty} × ${formatForeignCurrency(item.unitPrice, cur)}` : "";
      const amtStr = item.amount > 0 ? `*${formatForeignCurrency(item.amount, cur)}*` : (item.notes || "FOC / Rp 0");
      const noteSuffix = item.notes && item.amount > 0 ? ` _(${item.notes})_` : "";
      lines.push(`${idx + 1}. ${item.description}${noteSuffix}`);
      if (qtyStr || amtStr) {
        lines.push(`   ↳ ${qtyStr ? `${qtyStr} = ` : ""}${amtStr}`);
      }
    });
  }

  if (input.amountAnomalyNote) {
    lines.push("");
    lines.push(`⚠️ *Catatan Dokumen:* ${input.amountAnomalyNote}`);
  }

  lines.push("");
  lines.push(`💰 *JUMLAH YANG HARUS DIBAYAR (TRANSFER):*`);
  if (input.paymentScheme) {
    lines.push(`• Skema Pembayaran: *${input.paymentScheme}*`);
  }
  if (isForeign) {
    const fxAmt = input.originalAmount ?? 0;
    lines.push(`• Nominal Tagihan Asli: *${formatForeignCurrency(fxAmt, cur)}*`);
    if (input.exchangeRate && input.exchangeRate > 0) {
      lines.push(`• Estimasi Kurs (${cur}/IDR): Rp ${Math.round(input.exchangeRate).toLocaleString("id-ID")}`);
    }
    lines.push(`• Estimasi Nominal Rupiah: *Rp ${Math.round(input.amountIdr || 0).toLocaleString("id-ID")}*`);
    if (input.fullInvoiceOriginalAmount && input.fullInvoiceOriginalAmount > fxAmt) {
      lines.push(`• Total Penuh Dokumen: ${formatForeignCurrency(input.fullInvoiceOriginalAmount, cur)}`);
    }
  } else {
    lines.push(`• Nominal Transfer: *Rp ${Math.round(input.amountIdr || 0).toLocaleString("id-ID")}*`);
    if (input.fullInvoiceOriginalAmount && input.fullInvoiceOriginalAmount > input.amountIdr) {
      lines.push(`• Total Tagihan Penuh: Rp ${Math.round(input.fullInvoiceOriginalAmount).toLocaleString("id-ID")}`);
    }
  }
  if (input.paymentTermsSummary) {
    lines.push(`• Syarat Bayar: _${input.paymentTermsSummary}_`);
  }

  lines.push("");
  lines.push(`🏦 *REKENING TUJUAN TRANSFER:*`);
  if (input.bankName || input.accountNumber || input.accountHolder) {
    if (input.bankName) lines.push(`• Bank: *${input.bankName}*`);
    if (input.bankBranch) lines.push(`• Cabang: ${input.bankBranch}`);
    if (input.accountNumber) lines.push(`• No. Rekening: \`${input.accountNumber}\``);
    if (input.accountHolder) lines.push(`• Atas Nama: *${input.accountHolder}*`);
    if (input.swiftCode) lines.push(`• SWIFT Code: \`${input.swiftCode}\``);
    if (input.bankAddress) lines.push(`• Alamat Bank: ${input.bankAddress}`);
  } else {
    lines.push(`• _(Detail rekening belum tercantum di dokumen — mohon cek PDF)_`);
  }

  if (input.receiptUrl) {
    lines.push("");
    lines.push(`📎 *Lampiran File Invoice PDF:*`);
    lines.push(input.receiptUrl);
  }

  lines.push("");
  lines.push(`Mohon dibantu proses transfernya. Terima kasih 🙏`);

  return lines.join("\n");
}
