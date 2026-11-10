"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Landmark,
  FileText,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  formatDateIndo,
  formatForeignCurrency,
  generateInvoiceWhatsAppText,
} from "@/lib/cashflow-invoice";

interface InvoiceWhatsappModalProps {
  transaction: any | null;
  onClose: () => void;
  onMarkPaid?: (txId: string) => Promise<void>;
}

export default function InvoiceWhatsappModal({
  transaction,
  onClose,
  onMarkPaid,
}: InvoiceWhatsappModalProps) {
  const [waText, setWaText] = useState("");
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedRek, setCopiedRek] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const meta: any = transaction?.invoiceMetadata || {};

  const buildFreshWaText = (tx: any) => {
    const m: any = tx?.invoiceMetadata || {};
    return generateInvoiceWhatsAppText({
      projectName: tx.project?.name || "Cashflow Proyek",
      vendorName: tx.vendorName,
      invoiceNumber: tx.invoiceNumber,
      invoiceDate: tx.date ? new Date(tx.date).toISOString().split("T")[0] : null,
      dueDate: tx.dueDate ? new Date(tx.dueDate).toISOString().split("T")[0] : null,
      paymentDeadlineText: m.paymentDeadlineText || null,
      description: tx.description,
      category: tx.category,
      currency: tx.currency || "IDR",
      originalAmount: tx.originalAmount,
      fullInvoiceOriginalAmount: m.fullInvoiceOriginalAmount,
      exchangeRate: tx.exchangeRate,
      amountIdr: tx.amount,
      paymentScheme: tx.paymentScheme,
      paymentTermsSummary: m.paymentTermsSummary,
      amountAnomalyNote: m.amountAnomalyNote,
      lineItems: Array.isArray(m.lineItems) ? m.lineItems : [],
      detectedSections: Array.isArray(m.detectedSections) ? m.detectedSections : [],
      bankName: tx.bankName,
      bankBranch: tx.bankBranch,
      accountNumber: tx.accountNumber,
      accountHolder: tx.accountHolder,
      swiftCode: tx.swiftCode,
      bankAddress: tx.bankAddress,
      picName: m.picName,
      picPhone: m.picPhone,
      receiptUrl: tx.receiptUrl,
      status: tx.status,
    });
  };

  useEffect(() => {
    if (!transaction) return;
    setWaText(transaction.whatsappText || buildFreshWaText(transaction));
    setCopiedWa(false);
    setCopiedRek(false);
  }, [transaction]);

  if (!transaction) return null;

  const cur = (transaction.currency || "IDR").toUpperCase();
  const isForeign = cur !== "IDR" && cur !== "RP";
  const lineItems: any[] = Array.isArray(meta.lineItems) ? meta.lineItems : [];

  const handleCopyWa = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      alert("Gagal menyalin teks ke clipboard.");
    }
  };

  const handleCopyRekening = async () => {
    if (!transaction.accountNumber) return;
    try {
      await navigator.clipboard.writeText(transaction.accountNumber);
      setCopiedRek(true);
      setTimeout(() => setCopiedRek(false), 2000);
    } catch {
      alert("Gagal menyalin nomor rekening.");
    }
  };

  const handleResetTemplate = () => {
    setWaText(buildFreshWaText(transaction));
  };

  const handleMarkPaidClick = async () => {
    if (!onMarkPaid) return;
    setIsMarkingPaid(true);
    try {
      await onMarkPaid(transaction.id);
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden border border-slate-200">
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Detail Invoice, Rekening TF &amp; Teks WhatsApp
              </h3>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                  transaction.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {transaction.status === "COMPLETED" ? "Lunas" : "Menunggu TF"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {transaction.project?.name} &bull; {transaction.vendorName || transaction.description}
              {transaction.invoiceNumber ? ` • ${transaction.invoiceNumber}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Ringkasan Nominal & Rekening Tujuan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-600" /> Nominal Pembayaran
              </div>
              <div className="text-xl font-extrabold text-rose-600">
                {formatCurrency(transaction.amount)}
              </div>
              {isForeign && transaction.originalAmount ? (
                <div className="text-xs font-semibold text-indigo-700">
                  Asli: {formatForeignCurrency(transaction.originalAmount, cur)}
                  {transaction.exchangeRate
                    ? ` (Kurs Rp ${Math.round(transaction.exchangeRate).toLocaleString("id-ID")})`
                    : ""}
                </div>
              ) : null}
              <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                {transaction.paymentScheme && (
                  <div>
                    Skema: <strong>{transaction.paymentScheme}</strong>
                  </div>
                )}
                {(meta.paymentDeadlineText || transaction.dueDate) && (
                  <div>
                    Deadline:{" "}
                    <strong className="text-amber-800">
                      {meta.paymentDeadlineText || formatDateIndo(transaction.dueDate)}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <Landmark size={13} /> Rekening Tujuan Transfer
                </span>
                {transaction.accountNumber && (
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    {copiedRek ? <Check size={11} /> : <Copy size={11} />}
                    {copiedRek ? "No. Rek Disalin" : "Salin No. Rek"}
                  </button>
                )}
              </div>
              {transaction.bankName || transaction.accountNumber ? (
                <div className="text-xs text-slate-800 space-y-0.5">
                  <div className="font-bold text-indigo-950 text-sm">
                    {transaction.bankName || "-"}
                    {transaction.bankBranch ? ` (${transaction.bankBranch})` : ""}
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900 select-all">
                    {transaction.accountNumber || "-"}
                  </div>
                  <div>
                    a.n. <strong>{transaction.accountHolder || "-"}</strong>
                  </div>
                  {transaction.swiftCode && (
                    <div className="text-[11px] text-slate-600">
                      SWIFT: <span className="font-mono font-bold">{transaction.swiftCode}</span>
                    </div>
                  )}
                  {transaction.bankAddress && (
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {transaction.bankAddress}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Detail rekening tujuan belum tercatat pada transaksi ini.
                </div>
              )}
            </div>
          </div>

          {meta.amountAnomalyNote && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Catatan Deteksi Dokumen:</strong> {meta.amountAnomalyNote}
            </div>
          )}

          {lineItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 border-b">
                Rincian Item dari Invoice ({lineItems.length} item)
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                {lineItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {idx + 1}. {it.description}
                      </span>
                      {(it.notes || it.qty > 0) && (
                        <span className="block text-[11px] text-slate-500">
                          {it.qty > 0
                            ? `${it.qty} × ${formatForeignCurrency(it.unitPrice || 0, cur)}`
                            : ""}
                          {it.notes ? ` • ${it.notes}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 whitespace-nowrap">
                      {it.amount > 0 ? formatForeignCurrency(it.amount, cur) : it.notes || "FOC"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teks WhatsApp Siap Salin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-600" />
                Teks Pengajuan Transfer WhatsApp (Dapat Diedit Sebelum Disalin)
              </label>
              <button
                type="button"
                onClick={handleResetTemplate}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 cursor-pointer"
              >
                <RotateCcw size={11} /> Generate Ulang Template
              </button>
            </div>
            <textarea
              rows={10}
              value={waText}
              onChange={(e) => setWaText(e.target.value)}
              className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 p-3 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-3.5 border-t bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {transaction.receiptUrl && (
              <a
                href={transaction.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
              >
                <ExternalLink size={13} /> Buka PDF Invoice
              </a>
            )}
            {transaction.status === "PENDING" && onMarkPaid && (
              <button
                type="button"
                onClick={handleMarkPaidClick}
                disabled={isMarkingPaid}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isMarkingPaid ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Tandai Sudah Lunas
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100"
            >
              <ExternalLink size={13} /> Kirim ke WA
            </a>
            <button
              type="button"
              onClick={handleCopyWa}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
            >
              {copiedWa ? <Check size={14} /> : <Copy size={14} />}
              {copiedWa ? "Teks WA Tersalin!" : "Salin Teks WA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
