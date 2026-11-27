"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileCheck2,
  Paperclip,
  Upload,
  Sparkles,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Lock,
  Save,
  BookOpen,
  Download,
  Trash2,
  Receipt,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { uploadFileClient } from "@/lib/upload-client";
import {
  appendExpenseReceipts,
  bulkGenerateMissingInvoices,
  bulkGenerateMissingKwitansi,
  deleteDocumentNumberRecord,
  updateExpenseVendorReceiptNo,
  updateKwitansiRecordDetails,
} from "@/app/actions/snt-reports";
import {
  buildDocumentRegisterCsv,
  computeNextSeqForEntity,
  DocumentRegisterEntry,
  formatSntDocumentNumber,
  normalizeEntityCode,
  renderDocumentRegisterPdfHtml,
  resolveEntityCodeFromOwner,
  resolveKopFromEntityCode,
  SNT_ENTITY_OPTIONS,
  SntEntityCode,
} from "@/lib/snt-doc-numbering";
import {
  computeKwitansiAuditSummary,
  KopSuratOption,
  KwitansiAuditRow,
  RabRealizationSummary,
  RealizationBasisMode,
  SntRabCategoryRecord,
  SntReportProfile,
} from "@/lib/snt-report-templates";
import {
  renderStandaloneKwitansiPdfHtml,
  StandaloneKwitansiPdfItem,
} from "@/lib/snt-report-pdf";

interface KwitansiAuditTabProps {
  categories: SntRabCategoryRecord[];
  rabSummary: RabRealizationSummary;
  profile: SntReportProfile;
  realizationBasis?: RealizationBasisMode;
}

interface QuickKwitansiModalState {
  kwitansiId: string | null;
  noKwitansi: string;
  tanggal: string;
  sudahTerimaDari: string;
  penerima: string;
  perihal: string;
  rabCode: string;
  rabLabel: string;
  amount: number;
  kopSurat: KopSuratOption;
  includeReceipts: boolean;
  receiptUrls: string[];
  fasilitator?: StandaloneKwitansiPdfItem["fasilitator"];
}

export function KwitansiAuditTab({ categories, rabSummary, profile, realizationBasis }: KwitansiAuditTabProps) {
  const router = useRouter();
  const [onlyOfficialRab, setOnlyOfficialRab] = useState(true);
  const [viewMode, setViewMode] = useState<"AUDIT" | "REGISTER">("AUDIT");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "REAL" | "PELAPORAN">("ALL");
  const [filterMode, setFilterMode] = useState<"ALL" | "MISSING_RECEIPT" | "MISSING_KWT" | "READY">("ALL");
  const [entityMode, setEntityMode] = useState<"AUTO" | SntEntityCode>("AUTO");
  const [regEntityFilter, setRegEntityFilter] = useState<"ALL" | SntEntityCode>("ALL");
  const [regKindFilter, setRegKindFilter] = useState<"ALL" | "KW" | "INV" | "NOTA">("ALL");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkIncludeReceipts, setBulkIncludeReceipts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSingleId, setGeneratingSingleId] = useState<string | null>(null);
  const [generatingInvId, setGeneratingInvId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingNotaId, setEditingNotaId] = useState<string | null>(null);
  const [editingNotaVal, setEditingNotaVal] = useState("");
  const [savingNotaId, setSavingNotaId] = useState<string | null>(null);
  const [showRabMatrix, setShowRabMatrix] = useState(true);
  const [statusBanner, setStatusBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Popup cepat Generate / Cetak Ulang PDF Kwitansi
  const [pdfModal, setPdfModal] = useState<QuickKwitansiModalState | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);

  const audit = useMemo(
    () =>
      computeKwitansiAuditSummary(
        categories,
        onlyOfficialRab,
        typeFilter === "ALL" ? (realizationBasis || "ALL") : typeFilter === "REAL" ? "REAL" : "PELAPORAN_ONLY"
      ),
    [categories, onlyOfficialRab, typeFilter, realizationBasis]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audit.rows.filter((r) => {
      if (filterMode === "MISSING_RECEIPT" && r.hasReceipt) return false;
      if (filterMode === "MISSING_KWT" && r.hasKwitansi) return false;
      if (filterMode === "READY" && !(r.hasReceipt && r.hasKwitansi)) return false;
      if (!q) return true;
      return (
        r.rabCode.toLowerCase().includes(q) ||
        r.rabName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.penerima.toLowerCase().includes(q) ||
        (r.noKwitansi || "").toLowerCase().includes(q)
      );
    });
  }, [audit.rows, filterMode, search]);

  const missingKwitansiIds = useMemo(
    () => audit.rows.filter((r) => !r.hasKwitansi).map((r) => r.expenseId),
    [audit.rows]
  );

  const missingInvoiceIds = useMemo(
    () => audit.rows.filter((r) => !r.hasInvoice).map((r) => r.expenseId),
    [audit.rows]
  );

  const rowsWithKwitansi = useMemo(
    () => audit.rows.filter((r) => r.hasKwitansi),
    [audit.rows]
  );

  const selectedMissingKwtIds = useMemo(
    () => selectedIds.filter((id) => missingKwitansiIds.includes(id)),
    [selectedIds, missingKwitansiIds]
  );

  const selectedMissingInvIds = useMemo(
    () => selectedIds.filter((id) => missingInvoiceIds.includes(id)),
    [selectedIds, missingInvoiceIds]
  );

  const selectedReadyKwtRows = useMemo(
    () => rowsWithKwitansi.filter((r) => selectedIds.includes(r.expenseId)),
    [rowsWithKwitansi, selectedIds]
  );

  // Buku Register Nomor (Kwitansi, Invoice & Nota Vendor) dari seluruh transaksi yang tampil
  const registerEntries = useMemo<DocumentRegisterEntry[]>(() => {
    const list: DocumentRegisterEntry[] = [];
    for (const r of audit.rows) {
      if (r.hasKwitansi && r.noKwitansi) {
        const entity = r.kwitansiEntityCode
          ? normalizeEntityCode(r.kwitansiEntityCode)
          : resolveEntityCodeFromOwner(r.kwitansiOwner);
        list.push({
          id: `kw-${r.kwitansiId || r.expenseId}`,
          kind: "KW",
          docNumber: r.noKwitansi,
          entityCode: entity,
          tanggal: r.kwitansiTanggal || r.date,
          rabCode: r.rabCode,
          rabName: r.rabName,
          realizationType: r.realizationType,
          perihal: r.kwitansiPerihal || r.description,
          penerimaOrOwner: r.kwitansiOwner || r.penerima,
          vendorReceiptNo: r.vendorReceiptNo,
          nominal: r.amount,
          expenseId: r.expenseId,
          recordId: r.kwitansiId,
        });
      }
      if (r.hasInvoice && r.noInvoice) {
        const entity = r.invoiceEntityCode
          ? normalizeEntityCode(r.invoiceEntityCode)
          : resolveEntityCodeFromOwner(r.invoiceOwner);
        list.push({
          id: `inv-${r.invoiceId || r.expenseId}`,
          kind: "INV",
          docNumber: r.noInvoice,
          entityCode: entity,
          tanggal: r.invoiceTanggal || r.date,
          rabCode: r.rabCode,
          rabName: r.rabName,
          realizationType: r.realizationType,
          perihal: r.invoicePerihal || r.description,
          penerimaOrOwner: r.invoiceOwner || r.penerima,
          vendorReceiptNo: r.vendorReceiptNo,
          nominal: r.amount,
          expenseId: r.expenseId,
          recordId: r.invoiceId,
        });
      }
      if (r.vendorReceiptNo) {
        list.push({
          id: `nota-${r.expenseId}`,
          kind: "NOTA",
          docNumber: r.vendorReceiptNo,
          entityCode: "MTC",
          tanggal: r.date,
          rabCode: r.rabCode,
          rabName: r.rabName,
          realizationType: r.realizationType,
          perihal: r.description,
          penerimaOrOwner: r.penerima,
          vendorReceiptNo: r.vendorReceiptNo,
          nominal: r.amount,
          expenseId: r.expenseId,
          recordId: null,
        });
      }
    }
    return list;
  }, [audit.rows]);

  const filteredRegisterEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registerEntries.filter((e) => {
      if (regEntityFilter !== "ALL" && e.entityCode !== regEntityFilter) return false;
      if (regKindFilter !== "ALL" && e.kind !== regKindFilter) return false;
      if (!q) return true;
      return (
        e.docNumber.toLowerCase().includes(q) ||
        (e.vendorReceiptNo || "").toLowerCase().includes(q) ||
        e.perihal.toLowerCase().includes(q) ||
        e.rabCode.toLowerCase().includes(q) ||
        e.rabName.toLowerCase().includes(q)
      );
    });
  }, [registerEntries, regEntityFilter, regKindFilter, search]);

  const nextNumbersPreview = useMemo(() => {
    const allKw = registerEntries.filter((e) => e.kind === "KW").map((e) => e.docNumber);
    const allInv = registerEntries.filter((e) => e.kind === "INV").map((e) => e.docNumber);
    const today = new Date().toISOString().slice(0, 10);
    return SNT_ENTITY_OPTIONS.map((ent) => ({
      ...ent,
      nextKw: formatSntDocumentNumber("KW", ent.code, computeNextSeqForEntity(allKw, "KW", ent.code), today),
      nextInv: formatSntDocumentNumber("INV", ent.code, computeNextSeqForEntity(allInv, "INV", ent.code), today),
    }));
  }, [registerEntries]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openPrintKwitansiWindow = (
    items: StandaloneKwitansiPdfItem[],
    kopSurat: KopSuratOption,
    includeReceipts: boolean
  ) => {
    if (items.length === 0) {
      setStatusBanner({ type: "err", text: "Belum ada transaksi berkwitansi yang bisa dicetak." });
      return;
    }
    const html = renderStandaloneKwitansiPdfHtml({
      items,
      kopSurat,
      kotaPengesahan: profile.kotaPengesahan || "Jakarta",
      includeReceipts,
      profile,
    });
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup diblokir browser. Izinkan popup untuk mencetak / menyimpan PDF Kwitansi.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const openQuickPdfModalFromRow = (
    row: KwitansiAuditRow,
    override?: {
      id: string;
      noKwitansi: string;
      tanggal: string;
      owner: string;
      perihal: string;
    }
  ) => {
    const noKwitansi = override?.noKwitansi || row.noKwitansi || "";
    if (!noKwitansi) return;
    const defaultOwner =
      override?.owner ||
      row.kwitansiOwner ||
      (profile.kopSurat === "maleo" ? "Yayasan Maleo Talenta Cendekia" : profile.namaYayasan);

    const entityCode = row.kwitansiEntityCode
      ? normalizeEntityCode(row.kwitansiEntityCode)
      : resolveEntityCodeFromOwner(defaultOwner);

    setPdfModal({
      kwitansiId: override?.id || row.kwitansiId,
      noKwitansi,
      tanggal: override?.tanggal || row.kwitansiTanggal || row.date || new Date().toISOString().slice(0, 10),
      sudahTerimaDari: defaultOwner,
      penerima: row.penerima,
      perihal: override?.perihal || row.kwitansiPerihal || `${row.description} - ${row.rabName}`,
      rabCode: row.rabCode,
      rabLabel: `${row.rabCode} - ${row.rabName}`,
      amount: row.amount,
      kopSurat: resolveKopFromEntityCode(entityCode),
      includeReceipts: row.receiptUrls.length > 0,
      receiptUrls: row.receiptUrls,
      fasilitator: row.rawExpense.fasilitator || null,
    });
  };

  const handleBulkPrintKwitansi = (targetRows: KwitansiAuditRow[]) => {
    const items: StandaloneKwitansiPdfItem[] = targetRows
      .filter((r) => r.noKwitansi)
      .map((r) => ({
        noKwitansi: r.noKwitansi as string,
        tanggal: r.kwitansiTanggal || r.date,
        sudahTerimaDari:
          r.kwitansiOwner ||
          (profile.kopSurat === "maleo" ? "Yayasan Maleo Talenta Cendekia" : profile.namaYayasan),
        perihal: r.kwitansiPerihal || `${r.description} - ${r.rabName}`,
        rabCode: r.rabCode,
        rabLabel: `${r.rabCode} - ${r.rabName}`,
        penerima: r.penerima,
        amount: r.amount,
        receiptUrls: r.receiptUrls,
        fasilitator: r.rawExpense.fasilitator || null,
      }));
    openPrintKwitansiWindow(items, profile.kopSurat, bulkIncludeReceipts);
  };

  const handleBulkGenerate = async (idsToGenerate: string[]) => {
    if (idsToGenerate.length === 0) {
      setStatusBanner({ type: "err", text: "Semua transaksi yang dipilih sudah memiliki nomor kwitansi resmi." });
      return;
    }
    const seriDesc =
      entityMode === "AUTO"
        ? "otomatis sesuai Pos RAB (LPD / RE / MTC)"
        : `seri ${entityMode}`;
    if (
      !confirm(
        `Generate nomor Kwitansi resmi (KW/{ENTITAS}/SNT-W2/{NNN}/{ROMAWI}/2026 — ${seriDesc}) untuk ${idsToGenerate.length} transaksi? Nomor resmi lama tidak akan diubah.`
      )
    ) {
      return;
    }

    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await bulkGenerateMissingKwitansi(idsToGenerate, entityMode);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal generate kwitansi masal" });
        return;
      }
      setSelectedIds([]);
      setStatusBanner({
        type: "ok",
        text: `Berhasil membuat ${res.generatedCount} nomor Kwitansi resmi baru (${res.skippedCount} dilewati karena sudah punya nomor resmi).`,
      });
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerateInvoices = async (idsToGenerate: string[]) => {
    if (idsToGenerate.length === 0) {
      setStatusBanner({ type: "err", text: "Semua transaksi yang dipilih sudah memiliki nomor invoice resmi." });
      return;
    }
    const seriDesc =
      entityMode === "AUTO"
        ? "otomatis sesuai Pos RAB (LPD / RE / MTC)"
        : `seri ${entityMode}`;
    if (
      !confirm(
        `Generate nomor Invoice resmi (INV/{ENTITAS}/SNT-W2/{NNN}/{ROMAWI}/2026 — ${seriDesc}) untuk ${idsToGenerate.length} transaksi?`
      )
    ) {
      return;
    }

    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await bulkGenerateMissingInvoices(idsToGenerate, entityMode);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal generate invoice masal" });
        return;
      }
      setSelectedIds([]);
      setStatusBanner({
        type: "ok",
        text: `Berhasil membuat ${res.generatedCount} nomor Invoice resmi baru (${res.skippedCount} dilewati karena sudah ada).`,
      });
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSingleGenerate = async (row: KwitansiAuditRow) => {
    setGeneratingSingleId(row.expenseId);
    setStatusBanner(null);
    try {
      const res = await bulkGenerateMissingKwitansi([row.expenseId], entityMode);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal generate kwitansi" });
        return;
      }
      const created = res.createdNumbers?.[0];
      if (created) {
        setStatusBanner({
          type: "ok",
          text: `Nomor Kwitansi resmi berhasil dibuat: ${created.noKwitansi}`,
        });
        openQuickPdfModalFromRow(row, {
          id: created.id,
          noKwitansi: created.noKwitansi,
          tanggal: created.tanggal,
          owner: created.owner,
          perihal: created.perihal,
        });
      }
      router.refresh();
    } finally {
      setGeneratingSingleId(null);
    }
  };

  const handleSingleGenerateInvoice = async (row: KwitansiAuditRow) => {
    setGeneratingInvId(row.expenseId);
    setStatusBanner(null);
    try {
      const res = await bulkGenerateMissingInvoices([row.expenseId], entityMode);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal generate invoice" });
        return;
      }
      const created = res.createdNumbers?.[0];
      if (created) {
        setStatusBanner({
          type: "ok",
          text: `Nomor Invoice resmi berhasil dibuat: ${created.noInvoice}`,
        });
      }
      router.refresh();
    } finally {
      setGeneratingInvId(null);
    }
  };

  const handleSaveVendorNota = async (expenseId: string) => {
    setSavingNotaId(expenseId);
    setStatusBanner(null);
    try {
      const res = await updateExpenseVendorReceiptNo(expenseId, editingNotaVal);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal menyimpan No. Nota Vendor" });
        return;
      }
      setEditingNotaId(null);
      setStatusBanner({
        type: "ok",
        text: editingNotaVal.trim()
          ? `No. Nota Vendor "${editingNotaVal.trim()}" tersimpan.`
          : "No. Nota Vendor dikosongkan.",
      });
      router.refresh();
    } finally {
      setSavingNotaId(null);
    }
  };

  const handleDeleteDocRecord = async (entry: DocumentRegisterEntry) => {
    if (!entry.recordId || (entry.kind !== "KW" && entry.kind !== "INV")) return;
    if (
      !confirm(
        `Hapus nomor ${entry.kind === "KW" ? "Kwitansi" : "Invoice"} "${entry.docNumber}" dari Buku Register? Transaksi pengeluaran tidak akan terhapus.`
      )
    ) {
      return;
    }
    const res = await deleteDocumentNumberRecord(entry.kind, entry.recordId);
    if (!res.success) {
      setStatusBanner({ type: "err", text: res.error || "Gagal menghapus nomor dokumen." });
      return;
    }
    setStatusBanner({ type: "ok", text: `Nomor ${entry.docNumber} dihapus dari Buku Register.` });
    router.refresh();
  };

  const handleExportRegisterCsv = () => {
    const csv = buildDocumentRegisterCsv(filteredRegisterEntries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Buku_Register_Nomor_SNT_W2_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintRegisterPdf = () => {
    const html = renderDocumentRegisterPdfHtml({
      title: "BUKU REGISTER NOMOR KWITANSI, INVOICE & NOTA VENDOR",
      subtitle: `SNT Wilayah 2 · Filter Entitas: ${regEntityFilter} · Jenis: ${regKindFilter}`,
      entries: filteredRegisterEntries,
      printedAt: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    });
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup diblokir browser. Izinkan popup untuk mencetak Buku Register.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handleModalPrint = async (saveChangesFirst: boolean) => {
    if (!pdfModal) return;

    if (saveChangesFirst && pdfModal.kwitansiId) {
      setIsSavingModal(true);
      try {
        const res = await updateKwitansiRecordDetails({
          kwitansiId: pdfModal.kwitansiId,
          tanggal: pdfModal.tanggal,
          owner: pdfModal.sudahTerimaDari,
          perihal: pdfModal.perihal,
        });
        if (!res.success) {
          setStatusBanner({ type: "err", text: res.error || "Gagal menyimpan perubahan kwitansi." });
          return;
        }
        setStatusBanner({
          type: "ok",
          text: `Detail kwitansi ${pdfModal.noKwitansi} diperbarui dan siap dicetak PDF.`,
        });
        router.refresh();
      } finally {
        setIsSavingModal(false);
      }
    }

    openPrintKwitansiWindow(
      [
        {
          noKwitansi: pdfModal.noKwitansi,
          tanggal: pdfModal.tanggal,
          sudahTerimaDari: pdfModal.sudahTerimaDari,
          perihal: pdfModal.perihal,
          rabCode: pdfModal.rabCode,
          rabLabel: pdfModal.rabLabel,
          penerima: pdfModal.penerima,
          amount: pdfModal.amount,
          receiptUrls: pdfModal.receiptUrls,
          fasilitator: pdfModal.fasilitator || null,
        },
      ],
      pdfModal.kopSurat,
      pdfModal.includeReceipts
    );
    setPdfModal(null);
  };

  const handleUploadReceipt = async (expenseId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingId(expenseId);
    setStatusBanner(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(fileList)) {
        const url = await uploadFileClient(file, "receipts");
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length === 0) {
        setStatusBanner({ type: "err", text: "Upload file gagal atau tidak menghasilkan URL." });
        return;
      }
      const res = await appendExpenseReceipts(expenseId, uploadedUrls);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal menyimpan tautan bukti." });
        return;
      }
      setStatusBanner({
        type: "ok",
        text: `Berhasil menambahkan ${uploadedUrls.length} file bukti baru tanpa menghapus bukti lama.`,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusBanner({ type: "err", text: `Gagal mengunggah bukti: ${msg}` });
    } finally {
      setUploadingId(null);
    }
  };

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.includes(r.expenseId));

  return (
    <div className="space-y-6">
      {/* KPI Kesiapan Bukti & Kwitansi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">
              Total Transaksi ({onlyOfficialRab ? "RAB A & B" : "Semua A–F"})
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{audit.totalTx} tx</div>
            <div className="text-xs text-slate-500 mt-0.5">{formatCurrency(audit.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card className={audit.missingReceiptCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/40"}>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-600">Kelengkapan File Bukti / Nota</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {audit.withReceiptCount} / {audit.totalTx}
            </div>
            <div className="text-xs text-amber-700 mt-0.5 font-medium">
              {audit.missingReceiptCount > 0
                ? `${audit.missingReceiptCount} transaksi belum ada file bukti`
                : "Seluruh transaksi sudah memiliki file bukti"}
            </div>
          </CardContent>
        </Card>
        <Card className={audit.missingKwitansiCount > 0 ? "border-rose-200 bg-rose-50/40" : "border-emerald-200 bg-emerald-50/40"}>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-600">Nomor Kwitansi Resmi (Non-TEMP)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {audit.withKwitansiCount} / {audit.totalTx}
            </div>
            <div className="text-xs text-rose-700 mt-0.5 font-medium">
              {audit.missingKwitansiCount > 0
                ? `${audit.missingKwitansiCount} transaksi belum digenerate kwitansi`
                : "Seluruh transaksi sudah punya nomor kwitansi"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-blue-700">Kesiapan Audit Penuh (Nota + Kwitansi)</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">{audit.readinessPct}%</div>
            <div className="text-xs text-blue-600 mt-0.5">
              {audit.fullyReadyCount} dari {audit.totalTx} transaksi siap cetak bundle
            </div>
          </CardContent>
        </Card>
      </div>

      {statusBanner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-3 ${
            statusBanner.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Matriks Kesiapan per Baris RAB A & B */}
      <Card>
        <CardHeader className="py-3 px-5 bg-slate-50 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Matriks Kelengkapan Bukti per Baris RAB (Sesuai Template 13)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Mencocokkan pos RAB A &amp; B dengan jenis bukti yang disyaratkan pada Template 13.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowRabMatrix((prev) => !prev)}
            className="text-xs gap-1"
          >
            {showRabMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showRabMatrix ? "Sembunyikan" : "Tampilkan"}
          </Button>
        </CardHeader>
        {showRabMatrix && (
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 border-b">
                <tr>
                  <th className="py-2 px-3">Kode</th>
                  <th className="py-2 px-3">Item RAB (Wilayah 2)</th>
                  <th className="py-2 px-3 text-right whitespace-nowrap">Anggaran</th>
                  <th className="py-2 px-3 text-right whitespace-nowrap">Realisasi</th>
                  <th className="py-2 px-3 text-center">Nota</th>
                  <th className="py-2 px-3 text-center">Kwitansi</th>
                  <th className="py-2 px-3">Bukti Wajib (Template 13)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rabSummary.officialRows.map((row) => {
                  const hasTx = row.txCount > 0;
                  const allReady = hasTx && row.withReceiptCount === row.txCount && row.withKwitansiCount === row.txCount;
                  return (
                    <tr key={row.id} className={hasTx ? "bg-white" : "bg-slate-50/40 text-slate-400"}>
                      <td className="py-2 px-3 font-semibold">{row.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{row.name}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-medium text-slate-700">
                        {formatCurrency(row.budget)}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-semibold">
                        {formatCurrency(row.realizedTotal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {hasTx ? (
                          <Badge variant={row.withReceiptCount === row.txCount ? "secondary" : "destructive"}>
                            {row.withReceiptCount}/{row.txCount}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {hasTx ? (
                          <Badge variant={allReady ? "default" : "destructive"}>
                            {row.withKwitansiCount}/{row.txCount}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{row.requiredEvidence}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right">
                    TOTAL RAB RESMI (A + B):
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {formatCurrency(rabSummary.subtotalOfficialBudget)}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap text-blue-700">
                    {formatCurrency(rabSummary.subtotalOfficialRealizedTotal)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-slate-600 font-medium">
                    Sisa: {formatCurrency(rabSummary.subtotalOfficialBudget - rabSummary.subtotalOfficialRealizedTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        )}
      </Card>

      {/* Toolbar Aksi Masal, Seri Entitas & Switcher Buku Register */}
      <Card>
        <CardHeader className="py-4 px-5 bg-slate-50 border-b space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("AUDIT")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    viewMode === "AUDIT"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Audit Transaksi &amp; Generator
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("REGISTER")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    viewMode === "REGISTER"
                      ? "bg-indigo-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Buku Register Nomor ({registerEntries.length})
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                Inv: <strong>{audit.withInvoiceCount}</strong> · Kwt: <strong>{audit.withKwitansiCount}</strong> · Nota Vendor: <strong>{audit.withVendorReceiptNoCount}</strong>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
                {([
                  { k: "ALL" as const, label: "Ikuti Basis" },
                  { k: "REAL" as const, label: "Real" },
                  { k: "PELAPORAN" as const, label: "Pelaporan" },
                ]).map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setTypeFilter(opt.k)}
                    className={`px-2 py-1 rounded ${
                      typeFilter === opt.k
                        ? opt.k === "REAL"
                          ? "bg-emerald-700 text-white"
                          : opt.k === "PELAPORAN"
                            ? "bg-blue-700 text-white"
                            : "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOnlyOfficialRab((v) => !v)}
                className="text-xs bg-white"
              >
                Cakupan: {onlyOfficialRab ? "Khusus RAB A & B" : "Semua Kategori A–F"}
              </Button>
            </div>
          </div>

          {/* Baris Pengaturan Seri Entitas (LPD / RE / MTC) & Generator Masal */}
          {viewMode === "AUDIT" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-indigo-950">Seri Penerbit Nomor:</span>
                <select
                  value={entityMode}
                  onChange={(e) => setEntityMode(e.target.value as "AUTO" | SntEntityCode)}
                  className="h-8 px-2 rounded-md border border-indigo-300 bg-white text-xs font-semibold text-indigo-950"
                >
                  <option value="AUTO">Otomatis per Pos RAB (LPD / RE / MTC)</option>
                  <option value="LPD">LPD — Jully Tjindrawan Robotik</option>
                  <option value="RE">RE — Robotic Explorer</option>
                  <option value="MTC">MTC — Yayasan Maleo</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedMissingKwtIds.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleBulkGenerate(selectedMissingKwtIds)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                    Buat Kwt Terpilih ({selectedMissingKwtIds.length})
                  </Button>
                )}
                {selectedMissingInvIds.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => handleBulkGenerateInvoices(selectedMissingInvIds)}
                    className="bg-sky-700 hover:bg-sky-800 text-white text-xs h-8 gap-1.5"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
                    Buat Inv Terpilih ({selectedMissingInvIds.length})
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={isGenerating || missingKwitansiIds.length === 0}
                  onClick={() => handleBulkGenerate(missingKwitansiIds)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate Semua Belum Kwt ({missingKwitansiIds.length})
                </Button>
              </div>
            </div>
          )}

          {/* Ringkasan Nomor Berikutnya & Tombol Export pada Mode Buku Register */}
          {viewMode === "REGISTER" && (
            <div className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-indigo-950">
                  Urutan Nomor Resmi Berikutnya per Entitas (Atomic DB Counter):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleExportRegisterCsv}
                    className="bg-white border-indigo-300 text-indigo-900 hover:bg-indigo-100 text-xs h-8 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV ({filteredRegisterEntries.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePrintRegisterPdf}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Buku Register (PDF)
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {nextNumbersPreview.map((ent) => (
                  <div
                    key={ent.code}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[11px]"
                  >
                    <span className={`inline-block font-bold px-1.5 py-0.5 rounded border text-[10px] ${ent.badgeClass}`}>
                      {ent.shortLabel}
                    </span>
                    <div className="mt-1 font-mono text-[10px] text-slate-700">
                      Next Inv: <strong>{ent.nextInv}</strong>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-800">
                      Next Kwt: <strong>{ent.nextKw}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-600">Entitas:</span>
                {(["ALL", "MTC", "LPD", "RE"] as const).map((ent) => (
                  <button
                    key={ent}
                    type="button"
                    onClick={() => setRegEntityFilter(ent)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold ${
                      regEntityFilter === ent
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {ent === "ALL" ? "Semua Entitas" : ent}
                  </button>
                ))}
                <span className="text-[11px] font-semibold text-slate-600 ml-2">Jenis:</span>
                {([
                  { k: "ALL" as const, l: "Semua" },
                  { k: "KW" as const, l: "Kuitansi" },
                  { k: "INV" as const, l: "Invoice" },
                  { k: "NOTA" as const, l: "Nota Vendor" },
                ]).map((j) => (
                  <button
                    key={j.k}
                    type="button"
                    onClick={() => setRegKindFilter(j.k)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold ${
                      regKindFilter === j.k
                        ? "bg-indigo-700 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {j.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Baris Cetak PDF Kwitansi Masal */}
          {viewMode === "AUDIT" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-2">
            <label className="flex items-center gap-2 text-xs font-medium text-blue-900 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkIncludeReceipts}
                onChange={(e) => setBulkIncludeReceipts(e.target.checked)}
              />
              <span>Sertakan lampiran foto/PDF bukti nota saat cetak masal PDF Kwitansi</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {selectedReadyKwtRows.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBulkPrintKwitansi(selectedReadyKwtRows)}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF Kwt Terpilih ({selectedReadyKwtRows.length})
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={rowsWithKwitansi.length === 0}
                onClick={() => handleBulkPrintKwitansi(rowsWithKwitansi)}
                className="bg-white border-blue-300 text-blue-800 hover:bg-blue-100 text-xs h-8 gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Semua PDF Kwitansi ({rowsWithKwitansi.length})
              </Button>
            </div>
          </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari uraian, pos RAB, penerima, no kwitansi, no invoice, atau no nota vendor..."
                className="pl-8 h-9 text-xs bg-white"
              />
            </div>
            {viewMode === "AUDIT" && (
            <div className="flex flex-wrap gap-1.5">
              {[
                { k: "ALL" as const, label: `Semua (${audit.totalTx})` },
                { k: "MISSING_RECEIPT" as const, label: `Belum Ada Bukti (${audit.missingReceiptCount})` },
                { k: "MISSING_KWT" as const, label: `Belum Ada Kwitansi (${audit.missingKwitansiCount})` },
                { k: "READY" as const, label: `Lengkap (${audit.fullyReadyCount})` },
              ].map((btn) => (
                <button
                  key={btn.k}
                  type="button"
                  onClick={() => setFilterMode(btn.k)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filterMode === btn.k
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {viewMode === "REGISTER" ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 border-b">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 text-center">Jenis</th>
                  <th className="py-2.5 px-3 text-center">Entitas</th>
                  <th className="py-2.5 px-3">Nomor Dokumen</th>
                  <th className="py-2.5 px-3">No. Nota Vendor</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3">Pos RAB &amp; Perihal</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRegisterEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Belum ada nomor dokumen pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredRegisterEntries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            entry.kind === "KW"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : entry.kind === "INV"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {entry.kind === "KW" ? "KUITANSI" : entry.kind === "INV" ? "INVOICE" : "NOTA"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {entry.entityCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] font-semibold text-slate-900 whitespace-nowrap">
                        {entry.docNumber}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {entry.vendorReceiptNo || "-"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600">{entry.tanggal}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1 py-0.5 rounded border ${
                              entry.realizationType === "PELAPORAN"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {entry.realizationType}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {entry.rabCode} - {entry.rabName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{entry.perihal}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold whitespace-nowrap">
                        {formatCurrency(entry.nominal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {entry.recordId && (entry.kind === "KW" || entry.kind === "INV") ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocRecord(entry)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus nomor dokumen ini dari Buku Register"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua baris yang tampil"
                    checked={allFilteredSelected}
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? filteredRows.map((r) => r.expenseId) : []
                      )
                    }
                  />
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3">Pos RAB &amp; Uraian</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Bukti Nota</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Nomor Kwitansi</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Lengkapi / Cetak PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Tidak ada transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.expenseId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.expenseId)}
                        onChange={() => toggleSelect(row.expenseId)}
                        aria-label={`Pilih ${row.description}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                      {row.date
                        ? new Date(row.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            row.realizationType === "PELAPORAN"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {row.realizationType === "PELAPORAN" ? "PELAPORAN" : "REAL"}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {row.rabCode} - {row.rabName}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{row.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Penerima: {row.penerima}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.receiptUrls.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {row.receiptUrls.map((url, idx) => (
                            <a
                              key={`${url}-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              data-preview-title={`Bukti ${row.rabCode} #${idx + 1} - ${row.description}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{row.receiptUrls.length === 1 ? "Lihat" : `File ${idx + 1}`}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> Belum Ada
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="space-y-1">
                        {row.hasKwitansi ? (
                          <div>
                            <span className="inline-block font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {row.noKwitansi}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium text-rose-600">Belum Kwt</div>
                        )}
                        {row.hasInvoice && (
                          <div>
                            <span className="inline-block font-mono text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                              {row.noInvoice}
                            </span>
                          </div>
                        )}
                        {editingNotaId === row.expenseId ? (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <input
                              type="text"
                              value={editingNotaVal}
                              onChange={(e) => setEditingNotaVal(e.target.value)}
                              placeholder="No. Nota Vendor..."
                              className="w-28 h-6 px-1.5 text-[10px] border rounded bg-white"
                            />
                            <button
                              type="button"
                              disabled={savingNotaId === row.expenseId}
                              onClick={() => handleSaveVendorNota(row.expenseId)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Simpan No. Nota Vendor"
                            >
                              {savingNotaId === row.expenseId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNotaId(null)}
                              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                              title="Batal"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotaId(row.expenseId);
                              setEditingNotaVal(row.vendorReceiptNo || "");
                            }}
                            className="text-[10px] text-slate-500 hover:text-indigo-700 underline"
                          >
                            {row.vendorReceiptNo ? `Nota: ${row.vendorReceiptNo}` : "+ No. Nota Vendor"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <label
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium cursor-pointer transition-colors ${
                            uploadingId === row.expenseId
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                          title="Tambah 1 atau lebih foto/PDF bukti tanpa menghapus file lama"
                        >
                          {uploadingId === row.expenseId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          <span>+ Bukti</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            disabled={uploadingId === row.expenseId}
                            className="hidden"
                            onChange={(e) => {
                              handleUploadReceipt(row.expenseId, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>

                        {!row.hasInvoice && (
                          <button
                            type="button"
                            disabled={generatingInvId === row.expenseId || isGenerating}
                            onClick={() => handleSingleGenerateInvoice(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                            title="Generate nomor Invoice resmi (INV/{ENTITAS}/SNT-W2/...)"
                          >
                            {generatingInvId === row.expenseId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Receipt className="w-3 h-3" />
                            )}
                            <span>+ Inv</span>
                          </button>
                        )}

                        {row.hasKwitansi ? (
                          <button
                            type="button"
                            onClick={() => openQuickPdfModalFromRow(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Buka popup koreksi cepat & generate ulang PDF Kwitansi"
                          >
                            <Printer className="w-3 h-3" />
                            <span>PDF Kwt</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={generatingSingleId === row.expenseId || isGenerating}
                            onClick={() => handleSingleGenerate(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                            title="Generate nomor kwitansi resmi & langsung buka cetak PDF"
                          >
                            {generatingSingleId === row.expenseId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileCheck2 className="w-3 h-3" />
                            )}
                            <span>Buat Kwt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>

      {/* Popup Cepat Generate / Cetak Ulang PDF Kwitansi */}
      {pdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPdfModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b bg-slate-50 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Generate / Cetak Ulang PDF Kwitansi
                </h3>
                <div className="inline-flex items-center gap-1.5 mt-1 font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>{pdfModal.noKwitansi} (Nomor Resmi Terkunci)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPdfModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Tutup popup cetak kwitansi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="rounded-lg bg-slate-50 border px-3 py-2 flex items-center justify-between">
                <span className="text-slate-600">{pdfModal.rabLabel}</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(pdfModal.amount)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Kwitansi
                  </label>
                  <Input
                    type="date"
                    value={pdfModal.tanggal}
                    onChange={(e) => setPdfModal({ ...pdfModal, tanggal: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilihan Kop Surat
                  </label>
                  <select
                    value={pdfModal.kopSurat}
                    onChange={(e) =>
                      setPdfModal({ ...pdfModal, kopSurat: e.target.value as KopSuratOption })
                    }
                    className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="maleo">Yayasan Maleo Talenta Cendekia</option>
                    <option value="lpd">LPD Jully Tjindrawan Robotik (Kop Baru)</option>
                    <option value="robotic">Robotic Explorer — PT JTR (Kop Baru)</option>
                    <option value="none">Tanpa Kop Surat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sudah Terima Dari (Pemberi Dana / Yayasan)
                </label>
                <Input
                  value={pdfModal.sudahTerimaDari}
                  onChange={(e) =>
                    setPdfModal({ ...pdfModal, sudahTerimaDari: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima / Pelaksana (di Blok Tanda Tangan)
                </label>
                <Input
                  value={pdfModal.penerima}
                  onChange={(e) => setPdfModal({ ...pdfModal, penerima: e.target.value })}
                  placeholder="Nama lengkap penerima..."
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Untuk Pembayaran / Perihal
                </label>
                <textarea
                  rows={2}
                  value={pdfModal.perihal}
                  onChange={(e) => setPdfModal({ ...pdfModal, perihal: e.target.value })}
                  className="w-full rounded-md border border-slate-200 p-2 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-blue-50/60 border-blue-200 text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfModal.includeReceipts}
                  disabled={pdfModal.receiptUrls.length === 0}
                  onChange={(e) =>
                    setPdfModal({ ...pdfModal, includeReceipts: e.target.checked })
                  }
                />
                <span>
                  {pdfModal.receiptUrls.length > 0
                    ? `Sertakan lampiran bukti nota (${pdfModal.receiptUrls.length} file) di halaman berikutnya`
                    : "Belum ada file bukti nota yang terlampir pada transaksi ini"}
                </span>
              </label>
            </div>

            <div className="px-5 py-3.5 border-t bg-slate-50 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPdfModal(null)}
                disabled={isSavingModal}
                className="text-xs bg-white"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleModalPrint(false)}
                disabled={isSavingModal}
                className="text-xs bg-white border-slate-300 gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak PDF Langsung
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleModalPrint(true)}
                disabled={isSavingModal || !pdfModal.kwitansiId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                {isSavingModal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Simpan Detail &amp; Cetak PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
