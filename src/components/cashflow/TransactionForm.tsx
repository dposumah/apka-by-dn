"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createCashflowTransaction,
  updateCashflowTransaction,
} from "@/actions/cashflow";
import { uploadFileClient } from "@/lib/upload-client";
import {
  FALLBACK_FX_RATES,
  InvoicePaymentOption,
  ParsedInvoiceData,
  formatForeignCurrency,
  generateInvoiceWhatsAppText,
} from "@/lib/cashflow-invoice";
import {
  Sparkles,
  FileUp,
  Loader2,
  Landmark,
  MessageSquare,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Coins,
  Receipt,
} from "lucide-react";

interface TransactionFormProps {
  projects: any[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  autoOpenScanner?: boolean;
}

export default function TransactionForm({
  projects,
  onSuccess,
  onCancel,
  initialData,
  autoOpenScanner = false,
}: TransactionFormProps) {
  const existingMeta: any = initialData?.invoiceMetadata || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isScanningPdf, setIsScanningPdf] = useState(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");
  const [showInvoiceBankSection, setShowInvoiceBankSection] = useState(
    Boolean(
      initialData?.bankName ||
        initialData?.accountNumber ||
        initialData?.invoiceNumber ||
        initialData?.whatsappText ||
        autoOpenScanner
    )
  );

  // State Data Transaksi Utama + Invoice + Rekening
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || projects[0]?.id || "",
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    type: initialData?.type || "EXPENSE",
    amount: initialData?.amount !== undefined ? String(initialData.amount) : "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    paymentMethod: initialData?.paymentMethod || "TRANSFER",
    status: initialData?.status || (autoOpenScanner ? "PENDING" : "COMPLETED"),
    receiptUrl: initialData?.receiptUrl || "",
    invoiceNumber: initialData?.invoiceNumber || "",
    vendorName: initialData?.vendorName || "",
    currency: initialData?.currency || "IDR",
    originalAmount:
      initialData?.originalAmount !== undefined && initialData?.originalAmount !== null
        ? String(initialData.originalAmount)
        : "",
    exchangeRate:
      initialData?.exchangeRate !== undefined && initialData?.exchangeRate !== null
        ? String(initialData.exchangeRate)
        : "1",
    paymentScheme: initialData?.paymentScheme || "",
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : "",
    bankName: initialData?.bankName || "",
    bankBranch: initialData?.bankBranch || "",
    accountNumber: initialData?.accountNumber || "",
    accountHolder: initialData?.accountHolder || "",
    swiftCode: initialData?.swiftCode || "",
    bankAddress: initialData?.bankAddress || "",
  });

  // Metadata tambahan hasil scan PDF (item, seksi biaya, syarat bayar, anomali, opsi cepat)
  const [invoiceMeta, setInvoiceMeta] = useState<{
    lineItems: any[];
    detectedSections: any[];
    paymentTermsSummary: string | null;
    paymentDeadlineText: string | null;
    amountAnomalyNote: string | null;
    suggestedPaymentOptions: InvoicePaymentOption[];
    fullInvoiceOriginalAmount: number | null;
    picName: string | null;
    picPhone: string | null;
    exchangeRateSource: string | null;
  }>({
    lineItems: Array.isArray(existingMeta.lineItems) ? existingMeta.lineItems : [],
    detectedSections: Array.isArray(existingMeta.detectedSections)
      ? existingMeta.detectedSections
      : [],
    paymentTermsSummary: existingMeta.paymentTermsSummary || null,
    paymentDeadlineText: existingMeta.paymentDeadlineText || null,
    amountAnomalyNote: existingMeta.amountAnomalyNote || null,
    suggestedPaymentOptions: Array.isArray(existingMeta.suggestedPaymentOptions)
      ? existingMeta.suggestedPaymentOptions
      : [],
    fullInvoiceOriginalAmount: existingMeta.fullInvoiceOriginalAmount ?? null,
    picName: existingMeta.picName || null,
    picPhone: existingMeta.picPhone || null,
    exchangeRateSource: existingMeta.exchangeRateSource || null,
  });

  // Teks WhatsApp & status manual edit
  const [waText, setWaText] = useState<string>(initialData?.whatsappText || "");
  const [isWaManuallyEdited, setIsWaManuallyEdited] = useState<boolean>(
    Boolean(initialData?.whatsappText)
  );
  const [copiedWa, setCopiedWa] = useState(false);

  const selectedProjectName = useMemo(() => {
    return (
      projects.find((p) => p.id === formData.projectId)?.name || "Cashflow Proyek"
    );
  }, [projects, formData.projectId]);

  const isForeignCurrency =
    (formData.currency || "IDR").toUpperCase() !== "IDR" &&
    (formData.currency || "IDR").toUpperCase() !== "RP";

  const generatedWaPreview = useMemo(() => {
    return generateInvoiceWhatsAppText({
      projectName: selectedProjectName,
      vendorName: formData.vendorName,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.date,
      dueDate: formData.dueDate || null,
      paymentDeadlineText: invoiceMeta.paymentDeadlineText,
      description: formData.description || "Pembayaran Invoice",
      category: formData.category,
      currency: formData.currency,
      originalAmount: formData.originalAmount
        ? parseFloat(formData.originalAmount)
        : null,
      fullInvoiceOriginalAmount: invoiceMeta.fullInvoiceOriginalAmount,
      exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
      amountIdr: parseFloat(formData.amount) || 0,
      paymentScheme: formData.paymentScheme,
      paymentTermsSummary: invoiceMeta.paymentTermsSummary,
      amountAnomalyNote: invoiceMeta.amountAnomalyNote,
      lineItems: invoiceMeta.lineItems,
      detectedSections: invoiceMeta.detectedSections,
      bankName: formData.bankName,
      bankBranch: formData.bankBranch,
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder,
      swiftCode: formData.swiftCode,
      bankAddress: formData.bankAddress,
      picName: invoiceMeta.picName,
      picPhone: invoiceMeta.picPhone,
      receiptUrl: formData.receiptUrl,
      status: formData.status,
    });
  }, [selectedProjectName, formData, invoiceMeta]);

  // Sinkronisasi teks WA otomatis bila user tidak mengedit manual teks WA-nya
  useEffect(() => {
    const hasInvoiceOrBankInfo = Boolean(
      formData.vendorName ||
        formData.invoiceNumber ||
        formData.bankName ||
        formData.accountNumber ||
        invoiceMeta.lineItems.length > 0
    );
    if (!isWaManuallyEdited && hasInvoiceOrBankInfo) {
      setWaText(generatedWaPreview);
    }
  }, [
    generatedWaPreview,
    isWaManuallyEdited,
    formData.vendorName,
    formData.invoiceNumber,
    formData.bankName,
    formData.accountNumber,
    invoiceMeta.lineItems.length,
  ]);

  const recalcIdrFromForeign = (
    origAmtStr: string,
    rateStr: string,
    cur: string
  ): string => {
    const orig = parseFloat(origAmtStr);
    if (Number.isNaN(orig)) return "";
    const upperCur = (cur || "IDR").toUpperCase();
    if (upperCur === "IDR" || upperCur === "RP") {
      return String(Math.round(orig));
    }
    const rate = parseFloat(rateStr) || 0;
    return rate > 0 ? String(Math.round(orig * rate)) : "";
  };

  const handleSelectPaymentOption = (opt: InvoicePaymentOption) => {
    const cur = (formData.currency || "IDR").toUpperCase();
    const isFx = cur !== "IDR" && cur !== "RP";
    const origStr = String(opt.amount);
    const rate = isFx ? parseFloat(formData.exchangeRate) || FALLBACK_FX_RATES[cur] || 15900 : 1;
    const idrAmount = isFx ? Math.round(opt.amount * rate) : Math.round(opt.amount);

    setFormData((prev) => ({
      ...prev,
      originalAmount: origStr,
      exchangeRate: String(rate),
      amount: String(idrAmount),
      paymentScheme: opt.scheme || opt.label,
    }));
    setIsWaManuallyEdited(false);
  };

  const handleInvoicePdfScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Untuk fitur Scan Invoice AI, silakan pilih file berformat PDF (.pdf).");
      return;
    }

    setIsScanningPdf(true);
    setError("");
    setScanSuccessMsg("");

    try {
      // 1. Coba upload file PDF ke Supabase agar langsung tersimpan sebagai bukti nota
      let uploadedUrl = "";
      try {
        setUploading(true);
        uploadedUrl = await uploadFileClient(file, "cashflow-invoices");
      } catch (uploadErr: any) {
        console.warn("PDF upload warning (scan akan tetap dicoba):", uploadErr?.message);
      } finally {
        setUploading(false);
      }

      // 2. Kirim ke endpoint AI Gemini (pakai fileUrl bila > 3.5MB & sudah terupload, atau file langsung)
      const payload = new FormData();
      if (file.size > 3.5 * 1024 * 1024 && uploadedUrl) {
        payload.append("fileUrl", uploadedUrl);
      } else {
        payload.append("file", file);
      }

      const res = await fetch("/api/cashflow/parse-invoice", {
        method: "POST",
        body: payload,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal membaca isi PDF invoice.");
      }

      const parsed: ParsedInvoiceData = json.data;
      const cur = (parsed.currency || "IDR").toUpperCase();
      const isFx = cur !== "IDR" && cur !== "RP";
      const fxRate = isFx ? parsed.suggestedExchangeRate || FALLBACK_FX_RATES[cur] || 15900 : 1;
      const origAmt = Number(parsed.originalAmount) || 0;
      const idrAmt = isFx ? Math.round(origAmt * fxRate) : Math.round(origAmt);

      // Cocokkan suggestedProject ke ID proyek yang tersedia
      let matchedProjectId = formData.projectId;
      if (parsed.suggestedProject) {
        const targetLower = parsed.suggestedProject.toLowerCase();
        const foundProj = projects.find(
          (p) =>
            p.name.toLowerCase() === targetLower ||
            p.name.toLowerCase().includes(targetLower) ||
            targetLower.includes(p.name.toLowerCase())
        );
        if (foundProj) {
          matchedProjectId = foundProj.id;
        }
      }

      const defaultScheme =
        parsed.suggestedPaymentOptions?.[0]?.scheme ||
        parsed.suggestedPaymentOptions?.[0]?.label ||
        "Full 100%";

      setFormData((prev) => ({
        ...prev,
        projectId: matchedProjectId,
        date: parsed.invoiceDate || prev.date,
        type: "EXPENSE",
        amount: idrAmt > 0 ? String(idrAmt) : prev.amount,
        description: parsed.summaryTitle || prev.description,
        category: parsed.suggestedCategory || prev.category || "Operasional",
        paymentMethod: "TRANSFER",
        status: "PENDING",
        receiptUrl: uploadedUrl || prev.receiptUrl,
        invoiceNumber: parsed.invoiceNumber || "",
        vendorName: parsed.vendorName || "",
        currency: cur,
        originalAmount: origAmt > 0 ? String(origAmt) : "",
        exchangeRate: String(fxRate),
        paymentScheme: defaultScheme,
        dueDate: parsed.dueDate || "",
        bankName: parsed.bankAccount?.bankName || "",
        bankBranch: parsed.bankAccount?.branch || "",
        accountNumber: parsed.bankAccount?.accountNumber || "",
        accountHolder: parsed.bankAccount?.accountHolder || "",
        swiftCode: parsed.bankAccount?.swiftCode || "",
        bankAddress: parsed.bankAccount?.bankAddress || "",
      }));

      setInvoiceMeta({
        lineItems: parsed.lineItems || [],
        detectedSections: parsed.detectedSections || [],
        paymentTermsSummary: parsed.paymentTermsSummary || null,
        paymentDeadlineText: parsed.paymentDeadlineText || null,
        amountAnomalyNote: parsed.amountAnomalyNote || null,
        suggestedPaymentOptions: parsed.suggestedPaymentOptions || [],
        fullInvoiceOriginalAmount: origAmt > 0 ? origAmt : null,
        picName: parsed.picName || null,
        picPhone: parsed.picPhone || null,
        exchangeRateSource: parsed.exchangeRateSource || null,
      });

      setShowInvoiceBankSection(true);
      setIsWaManuallyEdited(false);
      setScanSuccessMsg(
        `Berhasil membaca invoice ${parsed.invoiceNumber || file.name} (${parsed.lineItems?.length || 0} item terdeteksi). Silakan periksa detail di bawah sebelum disimpan.`
      );
    } catch (err: any) {
      setError("Scan PDF AI gagal: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setIsScanningPdf(false);
      // Reset input agar file yang sama bisa dipilih ulang bila perlu
      e.target.value = "";
    }
  };

  const handleManualReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];

      setUploading(true);
      setError("");
      const publicUrl = await uploadFileClient(file, "cashflow-invoices");
      setFormData((prev) => ({ ...prev, receiptUrl: publicUrl }));
    } catch (err: any) {
      setError("Gagal upload file: " + (err.message || "Terjadi kesalahan upload"));
    } finally {
      setUploading(false);
    }
  };

  const handleCopyWa = async () => {
    const textToCopy = waText || generatedWaPreview;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      alert("Gagal menyalin teks ke clipboard.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payloadToSave = {
        ...formData,
        invoiceMetadata: {
          lineItems: invoiceMeta.lineItems,
          detectedSections: invoiceMeta.detectedSections,
          paymentTermsSummary: invoiceMeta.paymentTermsSummary,
          paymentDeadlineText: invoiceMeta.paymentDeadlineText,
          amountAnomalyNote: invoiceMeta.amountAnomalyNote,
          suggestedPaymentOptions: invoiceMeta.suggestedPaymentOptions,
          fullInvoiceOriginalAmount: invoiceMeta.fullInvoiceOriginalAmount,
          picName: invoiceMeta.picName,
          picPhone: invoiceMeta.picPhone,
          exchangeRateSource: invoiceMeta.exchangeRateSource,
        },
        whatsappText: waText || (showInvoiceBankSection ? generatedWaPreview : null),
      };

      const res = initialData?.id
        ? await updateCashflowTransaction(initialData.id, payloadToSave)
        : await createCashflowTransaction(payloadToSave);

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Terjadi kesalahan saat menyimpan transaksi");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================== SMART PDF INVOICE SCANNER (AI) ==================== */}
      <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50/70 via-violet-50/40 to-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                <Sparkles size={12} /> Scan Invoice PDF Otomatis (AI)
              </span>
              {isScanningPdf && (
                <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={13} className="animate-spin" /> Membaca seluruh halaman PDF...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Upload PDF Invoice / Confirmation Letter (IDR maupun USD/asing, 1 halaman atau multi-halaman). Sistem otomatis mendeteksi rincian pengeluaran, nominal, syarat DP, rekening tujuan transfer, dan membuat draf pesan WhatsApp.
            </p>
          </div>

          <label
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
              isScanningPdf
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
            }`}
          >
            {isScanningPdf ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Menganalisis PDF...</span>
              </>
            ) : (
              <>
                <FileUp size={15} />
                <span>Pilih &amp; Scan PDF Invoice</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleInvoicePdfScan}
              disabled={isScanningPdf}
              className="hidden"
            />
          </label>
        </div>

        {scanSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
            <Check size={15} className="text-emerald-600 shrink-0" />
            <span>{scanSuccessMsg}</span>
          </div>
        )}

        {invoiceMeta.amountAnomalyNote && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Perhatian Selisih / Bagian Biaya pada Dokumen:</strong>
              <span>{invoiceMeta.amountAnomalyNote}</span>
            </div>
          </div>
        )}

        {/* Pilihan Nominal Cepat (Full / DP 50% / Gabungan Seksi) */}
        {invoiceMeta.suggestedPaymentOptions.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Pilihan Cepat Skema Pembayaran Terdeteksi:
            </div>
            <div className="flex flex-wrap gap-2">
              {invoiceMeta.suggestedPaymentOptions.map((opt, idx) => {
                const isSelected =
                  formData.paymentScheme === (opt.scheme || opt.label) ||
                  Math.abs(parseFloat(formData.originalAmount || "0") - opt.amount) < 0.01;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPaymentOption(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                    }`}
                  >
                    {opt.label}:{" "}
                    <span className="font-mono font-bold">
                      {formatForeignCurrency(opt.amount, formData.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
            {invoiceMeta.paymentTermsSummary && (
              <p className="text-[11px] text-slate-500 italic">
                Syarat pada dokumen: {invoiceMeta.paymentTermsSummary}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ==================== FORM FIELD UTAMA TRANSAKSI ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Proyek
          </label>
          <select
            required
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={formData.projectId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, projectId: e.target.value }))
            }
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Tanggal Transaksi / Invoice
          </label>
          <input
            type="date"
            required
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Tipe Arus Kas
          </label>
          <select
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Status Pembayaran
          </label>
          <select
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm bg-white font-semibold focus:ring-2 focus:ring-indigo-500"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="PENDING">Pending (Menunggu Transfer / Belum Lunas)</option>
            <option value="COMPLETED">Selesai (Sudah Ditransfer / Lunas)</option>
          </select>
        </div>

        {/* Panel Konversi Mata Uang Asing bila bukan IDR */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Coins size={14} className="text-indigo-600" />
              Nominal &amp; Mata Uang
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Mata Uang Invoice:</span>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const newCur = e.target.value;
                  const newRate =
                    newCur === "IDR" ? "1" : String(FALLBACK_FX_RATES[newCur] || 15900);
                  const orig = formData.originalAmount || formData.amount;
                  const idr = recalcIdrFromForeign(orig, newRate, newCur);
                  setFormData((prev) => ({
                    ...prev,
                    currency: newCur,
                    exchangeRate: newRate,
                    originalAmount: orig,
                    amount: idr || prev.amount,
                  }));
                }}
                className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-800"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dolar AS)</option>
                <option value="MYR">MYR (Ringgit Malaysia)</option>
                <option value="SGD">SGD (Dolar Singapura)</option>
                <option value="CNY">CNY (Yuan China)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              isForeignCurrency ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {isForeignCurrency && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Nominal Asli ({formData.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="block w-full rounded-lg border-indigo-300 border p-2 text-sm font-mono font-bold bg-white"
                    value={formData.originalAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const idr = recalcIdrFromForeign(
                        val,
                        formData.exchangeRate,
                        formData.currency
                      );
                      setFormData((prev) => ({
                        ...prev,
                        originalAmount: val,
                        amount: idr,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Kurs ke IDR (1 {formData.currency} = Rp)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="block w-full rounded-lg border-indigo-300 border p-2 text-sm font-mono font-bold bg-white"
                    value={formData.exchangeRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const idr = recalcIdrFromForeign(
                        formData.originalAmount,
                        val,
                        formData.currency
                      );
                      setFormData((prev) => ({
                        ...prev,
                        exchangeRate: val,
                        amount: idr,
                      }));
                    }}
                  />
                  {invoiceMeta.exchangeRateSource && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {invoiceMeta.exchangeRateSource}
                    </span>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nominal Dicatat Cashflow (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                className="block w-full rounded-lg border-slate-300 border p-2 text-sm font-mono font-bold bg-white text-slate-900"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
              {formData.amount && (
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  Rp {Math.round(parseFloat(formData.amount) || 0).toLocaleString("id-ID")}
                </span>
              )}
            </div>

            {!isForeignCurrency && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Skema Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Full 100%, DP 50%, Termin 1"
                  className="block w-full rounded-lg border-slate-300 border p-2 text-sm bg-white"
                  value={formData.paymentScheme}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, paymentScheme: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Keterangan Transaksi
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Registrasi Kontingen IYRC China 2026 / Akomodasi Hotel 88"
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Kategori
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Registrasi Lomba, Akomodasi & Hotel, Operasional"
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Metode Pembayaran
          </label>
          <select
            className="block w-full rounded-xl border-slate-300 shadow-xs border p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))
            }
          >
            <option value="TRANSFER">Transfer</option>
            <option value="BANK">Bank / Wire Transfer</option>
            <option value="CASH">Cash</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            File Bukti Nota / Kwitansi / PDF Invoice
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*,.pdf"
              className="block text-xs text-slate-500
                file:mr-3 file:py-2 file:px-3.5
                file:rounded-lg file:border-0
                file:text-xs file:font-semibold
                file:bg-slate-100 file:text-slate-700
                hover:file:bg-slate-200 cursor-pointer"
              onChange={handleManualReceiptChange}
              disabled={uploading || isScanningPdf}
            />
            {uploading && (
              <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                <Loader2 size={13} className="animate-spin" /> Mengunggah file...
              </span>
            )}
            {formData.receiptUrl && !uploading && (
              <a
                href={formData.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <Receipt size={13} /> Lihat File Tersimpan
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ==================== DETAIL INVOICE, REKENING TUJUAN & TEKS WHATSAPP ==================== */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowInvoiceBankSection((v) => !v)}
          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-indigo-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Detail Vendor, Rekening Tujuan Transfer &amp; Generator Teks WhatsApp
            </span>
            {(formData.bankName || formData.accountNumber) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Rekening Terisi
              </span>
            )}
          </div>
          {showInvoiceBankSection ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>

        {showInvoiceBankSection && (
          <div className="p-4 sm:p-5 space-y-5 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Vendor / Penerima
                </label>
                <input
                  type="text"
                  placeholder="Contoh: MY-ROBOT WORLDWIDE SDN BHD / Hotel 88"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs"
                  value={formData.vendorName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vendorName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  No. Invoice / Surat Konfirmasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: WW2611-00002 / KDY-CL-ACC-001"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs font-mono"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Batas Pembayaran / Jatuh Tempo
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
                {invoiceMeta.paymentDeadlineText && !formData.dueDate && (
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Terdeteksi: {invoiceMeta.paymentDeadlineText}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Bank Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA / OCBC Bank"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs font-semibold"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cabang Bank (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA KCP Jalan Panjang"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs"
                  value={formData.bankBranch}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bankBranch: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nomor Rekening Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 7550353088 / 791 104420 2"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs font-mono font-bold text-indigo-900"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT Amerta Kedoya Hotel"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs font-semibold"
                  value={formData.accountHolder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, accountHolder: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  SWIFT Code (Jika Transfer Luar Negeri)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: OCBCMYKL"
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs font-mono"
                  value={formData.swiftCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, swiftCode: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Bank (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Alamat bank penerima..."
                  className="w-full rounded-lg border-slate-300 border p-2 text-xs"
                  value={formData.bankAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bankAddress: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Rincian Line Items bila ada hasil scan */}
            {invoiceMeta.lineItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border-b flex items-center justify-between">
                  <span>Rincian Item Terdeteksi dari PDF ({invoiceMeta.lineItems.length} item)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Tersimpan ke metadata transaksi
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {invoiceMeta.lineItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 text-xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">
                          {idx + 1}. {it.description}
                        </span>
                        {(it.notes || it.qty > 0) && (
                          <span className="block text-[11px] text-slate-500">
                            {it.qty > 0
                              ? `${it.qty} × ${formatForeignCurrency(
                                  it.unitPrice || 0,
                                  formData.currency
                                )}`
                              : ""}
                            {it.notes ? ` • ${it.notes}` : ""}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                        {it.amount > 0
                          ? formatForeignCurrency(it.amount, formData.currency)
                          : it.notes || "FOC"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview & Generator Teks WhatsApp */}
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <MessageSquare size={15} className="text-emerald-600" />
                  Teks WhatsApp Pengajuan Transfer (Siap Salin &amp; Kirim)
                </label>
                <div className="flex items-center gap-2">
                  {isWaManuallyEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsWaManuallyEdited(false);
                        setWaText(generatedWaPreview);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <RotateCcw size={11} /> Sync Template
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyWa}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs cursor-pointer"
                  >
                    {copiedWa ? <Check size={13} /> : <Copy size={13} />}
                    {copiedWa ? "Tersalin ke Clipboard!" : "Salin Teks WA"}
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                value={waText || generatedWaPreview}
                onChange={(e) => {
                  setIsWaManuallyEdited(true);
                  setWaText(e.target.value);
                }}
                className="w-full rounded-xl border border-emerald-300 bg-white p-3 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Teks ini juga akan tersimpan pada transaksi agar bisa dibuka atau disalin ulang kapan saja dari tabel transaksi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==================== TOMBOL AKSI SIMPAN ==================== */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploading || isScanningPdf}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/20"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </div>
    </form>
  );
}
