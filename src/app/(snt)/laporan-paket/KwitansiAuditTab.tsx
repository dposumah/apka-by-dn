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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { uploadFileClient } from "@/lib/upload-client";
import {
  appendExpenseReceipts,
  bulkGenerateMissingKwitansi,
  updateKwitansiRecordDetails,
} from "@/app/actions/snt-reports";
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
  rabLabel: string;
  amount: number;
  kopSurat: KopSuratOption;
  includeReceipts: boolean;
  receiptUrls: string[];
}

export function KwitansiAuditTab({ categories, rabSummary, profile, realizationBasis }: KwitansiAuditTabProps) {
  const router = useRouter();
  const [onlyOfficialRab, setOnlyOfficialRab] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "REAL" | "PELAPORAN">("ALL");
  const [filterMode, setFilterMode] = useState<"ALL" | "MISSING_RECEIPT" | "MISSING_KWT" | "READY">("ALL");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkIncludeReceipts, setBulkIncludeReceipts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSingleId, setGeneratingSingleId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
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

  const rowsWithKwitansi = useMemo(
    () => audit.rows.filter((r) => r.hasKwitansi),
    [audit.rows]
  );

  const selectedMissingKwtIds = useMemo(
    () => selectedIds.filter((id) => missingKwitansiIds.includes(id)),
    [selectedIds, missingKwitansiIds]
  );

  const selectedReadyKwtRows = useMemo(
    () => rowsWithKwitansi.filter((r) => selectedIds.includes(r.expenseId)),
    [rowsWithKwitansi, selectedIds]
  );

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

    setPdfModal({
      kwitansiId: override?.id || row.kwitansiId,
      noKwitansi,
      tanggal: override?.tanggal || row.kwitansiTanggal || row.date || new Date().toISOString().slice(0, 10),
      sudahTerimaDari: defaultOwner,
      penerima: row.penerima,
      perihal: override?.perihal || row.kwitansiPerihal || `${row.description} - ${row.rabName}`,
      rabLabel: `${row.rabCode} - ${row.rabName}`,
      amount: row.amount,
      kopSurat: profile.kopSurat,
      includeReceipts: row.receiptUrls.length > 0,
      receiptUrls: row.receiptUrls,
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
        rabLabel: `${r.rabCode} - ${r.rabName}`,
        penerima: r.penerima,
        amount: r.amount,
        receiptUrls: r.receiptUrls,
      }));
    openPrintKwitansiWindow(items, profile.kopSurat, bulkIncludeReceipts);
  };

  const handleBulkGenerate = async (idsToGenerate: string[]) => {
    if (idsToGenerate.length === 0) {
      setStatusBanner({ type: "err", text: "Semua transaksi yang dipilih sudah memiliki nomor kwitansi resmi." });
      return;
    }
    if (
      !confirm(
        `Generate nomor Kwitansi resmi (format KWC/MTC/YYYY.MM.DD.NNN) untuk ${idsToGenerate.length} transaksi yang belum memiliki kwitansi? Nomor kwitansi yang sudah ada tidak akan diubah.`
      )
    ) {
      return;
    }

    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await bulkGenerateMissingKwitansi(idsToGenerate);
      if (!res.success) {
        setStatusBanner({ type: "err", text: res.error || "Gagal generate kwitansi masal" });
        return;
      }
      setSelectedIds([]);
      setStatusBanner({
        type: "ok",
        text: `Berhasil membuat ${res.generatedCount} nomor Kwitansi resmi baru (${res.skippedCount} dilewati karena sudah punya nomor resmi). Gunakan tombol "Cetak Semua PDF Kwitansi" untuk mencetak masal.`,
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
      const res = await bulkGenerateMissingKwitansi([row.expenseId]);
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
          rabLabel: pdfModal.rabLabel,
          penerima: pdfModal.penerima,
          amount: pdfModal.amount,
          receiptUrls: pdfModal.receiptUrls,
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

      {/* Toolbar Aksi Masal & Filter */}
      <Card>
        <CardHeader className="py-4 px-5 bg-slate-50 border-b space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Daftar Transaksi &amp; Generator Kwitansi Resmi
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload bukti multi-file (gambar/PDF), generate nomor kwitansi resmi, dan cetak/generate ulang PDF kwitansi satuan maupun masal.
              </p>
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
              {selectedMissingKwtIds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => handleBulkGenerate(selectedMissingKwtIds)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                  Generate Kwt Terpilih ({selectedMissingKwtIds.length})
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={isGenerating || missingKwitansiIds.length === 0}
                onClick={() => handleBulkGenerate(missingKwitansiIds)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Semua Belum Kwt ({missingKwitansiIds.length})
              </Button>
            </div>
          </div>

          {/* Baris Cetak PDF Kwitansi Masal */}
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari uraian, pos RAB, penerima, atau no kwitansi..."
                className="pl-8 h-9 text-xs bg-white"
              />
            </div>
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
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
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
                      {row.hasKwitansi ? (
                        <span className="inline-block font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {row.noKwitansi}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-rose-600">Belum Ada</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
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
                    <option value="maleo">Kop Yayasan Maleo (/kop-maleo.png)</option>
                    <option value="robotic">Kop PT JT Robotic Explorer (/kop-surat.png)</option>
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
