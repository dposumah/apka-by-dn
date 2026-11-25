"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Printer,
  Save,
  Plus,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  Send,
  UserX,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  recordEvidenceToRabExpense,
  saveSntReportDraft,
} from "@/app/actions/snt-reports";
import {
  buildMonthlyFacilitatorHonorReceipt,
  EVIDENCE_DOC_CATALOG,
  EvidenceDocType,
  EvidenceLineItem,
  GenericEvidenceDraft,
  getDefaultGenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  getMonthLabelId,
  MonthlyHonorReceiptRow,
  RecipientMode,
  SewaRumahContractDraft,
} from "@/lib/snt-evidence-docs";
import {
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderSewaRumahPdfHtml,
} from "@/lib/snt-evidence-pdf";
import {
  SNT_WILAYAH_2_LOCATIONS,
  SntFasilitatorRecord,
  SntRabCategoryRecord,
  SntRekapRecord,
  SntReportProfile,
} from "@/lib/snt-report-templates";

interface EvidenceDocsTabProps {
  activeDocType: EvidenceDocType;
  onSelectDocType: (docType: EvidenceDocType) => void;
  profile: SntReportProfile;
  categories: SntRabCategoryRecord[];
  rekaps: SntRekapRecord[];
  fasilitators: SntFasilitatorRecord[];
  evidenceDrafts: Record<string, Record<string, unknown>>;
  onDraftSaved: (templateCode: string, periodKey: string, content: Record<string, unknown>) => void;
}

const HONOR_MONTHS = ["2026-09", "2026-10", "2026-11", "2026-12"] as const;

export function EvidenceDocsTab({
  activeDocType: activeType,
  onSelectDocType: setActiveType,
  profile,
  categories,
  rekaps,
  fasilitators,
  evidenceDrafts,
  onDraftSaved,
}: EvidenceDocsTabProps) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // State khusus Daftar Tanda Terima Honor Fasilitator Bulanan (A.4)
  const [honorMonth, setHonorMonth] = useState<string>("2026-10");
  const [honorIncludeTransport, setHonorIncludeTransport] = useState<boolean>(false);
  const [honorRecipientMode, setHonorRecipientMode] = useState<RecipientMode>("MANUAL");
  const [honorIncludeKwitansi, setHonorIncludeKwitansi] = useState<boolean>(false);
  const [honorTanggalCetak, setHonorTanggalCetak] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [customHonorRowsByMonth, setCustomHonorRowsByMonth] = useState<
    Record<string, MonthlyHonorReceiptRow[]>
  >({});

  // State khusus Kontrak Sewa & Kwitansi Bulanan (B.3b)
  const [sewaDraft, setSewaDraft] = useState<SewaRumahContractDraft>(() => {
    const saved = evidenceDrafts["EVIDENCE_SEWA_RUMAH"];
    if (saved && typeof saved === "object") {
      return { ...getDefaultSewaRumahDraft(), ...(saved as Partial<SewaRumahContractDraft>) };
    }
    return getDefaultSewaRumahDraft();
  });
  const [sewaIncludeMonthlyKwt, setSewaIncludeMonthlyKwt] = useState<boolean>(true);

  // State generik untuk 8 dokumen lainnya
  const defaultPayer =
    profile.kopSurat === "maleo" ? "Yayasan Maleo Talenta Cendekia" : profile.namaYayasan;

  const [genericDrafts, setGenericDrafts] = useState<Record<string, GenericEvidenceDraft>>(() => {
    const map: Record<string, GenericEvidenceDraft> = {};
    for (const meta of EVIDENCE_DOC_CATALOG) {
      if (meta.type === "HONOR_FASIL_BULANAN" || meta.type === "SEWA_RUMAH") continue;
      const saved = evidenceDrafts[`EVIDENCE_${meta.type}`];
      if (saved && typeof saved === "object" && Array.isArray((saved as Record<string, unknown>).items)) {
        map[meta.type] = saved as unknown as GenericEvidenceDraft;
      } else {
        map[meta.type] = getDefaultGenericEvidenceDraft(meta.type, defaultPayer);
      }
    }
    return map;
  });
  const [genericIncludeKwitansi, setGenericIncludeKwitansi] = useState<boolean>(true);

  const activeMeta =
    EVIDENCE_DOC_CATALOG.find((m) => m.type === activeType) || EVIDENCE_DOC_CATALOG[0];

  // Build honor sheet untuk bulan terpilih (DB RekapHonorarium + override draft manual jika ada)
  const dbHonorSheet = useMemo(
    () => buildMonthlyFacilitatorHonorReceipt(rekaps, honorMonth),
    [rekaps, honorMonth]
  );

  const activeHonorRows: MonthlyHonorReceiptRow[] = useMemo(() => {
    if (customHonorRowsByMonth[honorMonth]) {
      return customHonorRowsByMonth[honorMonth];
    }
    const savedKey = `EVIDENCE_HONOR_FASIL_${honorMonth}`;
    const saved = evidenceDrafts[savedKey];
    if (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)) {
      return (saved as { rows: MonthlyHonorReceiptRow[] }).rows;
    }
    return dbHonorSheet.rows;
  }, [customHonorRowsByMonth, evidenceDrafts, honorMonth, dbHonorSheet.rows]);

  const activeHonorSheet = useMemo(() => {
    return {
      monthKey: honorMonth,
      monthLabel: getMonthLabelId(honorMonth),
      rows: activeHonorRows,
      totalJpIntra: activeHonorRows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
      totalJpEkstra: activeHonorRows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
      totalJP: activeHonorRows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
      totalHonor: activeHonorRows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
      totalTransport: activeHonorRows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
    };
  }, [honorMonth, activeHonorRows]);

  const currentGenericDraft =
    genericDrafts[activeType] || getDefaultGenericEvidenceDraft(activeType, defaultPayer);

  const updateGenericDraft = (updater: (prev: GenericEvidenceDraft) => GenericEvidenceDraft) => {
    setGenericDrafts((prev) => ({
      ...prev,
      [activeType]: updater(prev[activeType] || getDefaultGenericEvidenceDraft(activeType, defaultPayer)),
    }));
  };

  const openHtmlWindow = (html: string) => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup diblokir browser. Izinkan popup untuk mencetak / menyimpan PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handleSaveCurrentDraft = async () => {
    setIsSaving(true);
    setBanner(null);
    try {
      let templateCode = `EVIDENCE_${activeType}`;
      let periodKey = "DEFAULT";
      let content: Record<string, unknown> = {};

      if (activeType === "HONOR_FASIL_BULANAN") {
        templateCode = `EVIDENCE_HONOR_FASIL_${honorMonth}`;
        periodKey = honorMonth;
        content = { rows: activeHonorRows, tanggalCetak: honorTanggalCetak };
      } else if (activeType === "SEWA_RUMAH") {
        content = sewaDraft as unknown as Record<string, unknown>;
      } else {
        content = currentGenericDraft as unknown as Record<string, unknown>;
      }

      const res = await saveSntReportDraft({
        templateCode,
        periodKey,
        title: activeMeta.fullTitle,
        content,
      });

      if (!res.success) {
        setBanner({ type: "err", text: res.error || "Gagal menyimpan draft dokumen bukti." });
        return;
      }

      onDraftSaved(templateCode, periodKey, content);
      setBanner({
        type: "ok",
        text: `Draft "${activeMeta.shortTitle}" berhasil disimpan ke database.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintActiveDoc = () => {
    if (activeType === "HONOR_FASIL_BULANAN") {
      const html = renderMonthlyFacilitatorHonorPdfHtml({
        sheet: activeHonorSheet,
        profile,
        includeTransportColumn: honorIncludeTransport,
        recipientMode: honorRecipientMode,
        tanggalCetak: honorTanggalCetak,
        includeIndividualKwitansi: honorIncludeKwitansi,
      });
      openHtmlWindow(html);
      return;
    }

    if (activeType === "SEWA_RUMAH") {
      const html = renderSewaRumahPdfHtml({
        draft: sewaDraft,
        profile,
        includeMonthlyKwitansi: sewaIncludeMonthlyKwt,
      });
      openHtmlWindow(html);
      return;
    }

    const html = renderGenericEvidencePdfHtml({
      type: activeType,
      draft: currentGenericDraft,
      profile,
      includeKwitansiSlips: genericIncludeKwitansi,
    });
    openHtmlWindow(html);
  };

  const handlePullFromExistingRab = () => {
    const targetCode = currentGenericDraft.rabCode.trim().toLowerCase();
    const pulled: EvidenceLineItem[] = [];

    for (const cat of categories) {
      for (const item of cat.items || []) {
        if (item.code.trim().toLowerCase() !== targetCode) continue;
        for (const exp of item.expenses || []) {
          if (exp.status && exp.status !== "APPROVED") continue;
          const d = exp.date || exp.createdAt;
          pulled.push({
            id: `db-${exp.id}`,
            tanggal: d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            lokasi: exp.fasilitator?.lokasiSNT || "Wilayah 2",
            uraian: exp.description || item.name,
            penerima: exp.fasilitator?.namaLengkap || exp.createdBy?.name || "",
            volume: 1,
            satuan: "paket",
            hargaSatuan: Number(exp.amount) || 0,
            nominal: Number(exp.amount) || 0,
          });
        }
      }
    }

    if (pulled.length === 0) {
      setBanner({
        type: "err",
        text: `Belum ada transaksi APPROVED di pos RAB ${currentGenericDraft.rabCode}. Silakan isi manual atau gunakan preset.`,
      });
      return;
    }

    updateGenericDraft((prev) => ({ ...prev, items: pulled }));
    setBanner({
      type: "ok",
      text: `Berhasil menarik ${pulled.length} transaksi riil dari Pos RAB ${currentGenericDraft.rabCode}.`,
    });
  };

  const handleRecordLineToRab = async (
    rowKey: string,
    rabCode: string,
    date: string,
    description: string,
    amount: number
  ) => {
    if (amount <= 0) {
      setBanner({ type: "err", text: "Nominal harus lebih dari Rp 0 untuk dicatat ke RAB." });
      return;
    }
    if (
      !confirm(
        `Catat transaksi sebesar ${formatCurrency(amount)} ("${description}") ke Realisasi Pos RAB ${rabCode} (status APPROVED + auto buat nomor Kwitansi resmi)? Pastikan transaksi ini belum tercatat sebelumnya agar tidak ganda.`
      )
    ) {
      return;
    }

    setRecordingId(rowKey);
    setBanner(null);
    try {
      const res = await recordEvidenceToRabExpense({
        rabCode,
        date,
        description,
        amount,
        generateKwitansi: true,
        kwitansiOwner: defaultPayer,
      });
      if (!res.success) {
        setBanner({ type: "err", text: res.error || "Gagal mencatat ke Realisasi RAB." });
        return;
      }
      setBanner({
        type: "ok",
        text: `Berhasil mencatat ke Pos RAB ${rabCode} (${formatCurrency(amount)})${res.noKwitansi ? ` dengan Kwitansi ${res.noKwitansi}` : ""}.`,
      });
      router.refresh();
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Katalog 10 Jenis Dokumen Bukti Wajib */}
      <div className="lg:col-span-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
          10 Dokumen Bukti Wajib (Template 13)
        </div>
        {EVIDENCE_DOC_CATALOG.map((doc) => {
          const isActive = doc.type === activeType;
          const isSaved = Boolean(evidenceDrafts[`EVIDENCE_${doc.type}`]);
          return (
            <button
              key={doc.type}
              type="button"
              onClick={() => {
                setActiveType(doc.type);
                setBanner(null);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-emerald-50 border-emerald-400 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${isActive ? "text-emerald-950" : "text-slate-800"}`}>
                  {doc.shortTitle}
                </span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Pos {doc.rabCode}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
              {isSaved && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Draft Tersimpan
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Area Editor & Cetak Dokumen Aktif */}
      <div className="lg:col-span-8">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-4 px-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <CardTitle className="text-base font-bold text-slate-900">
                  {activeMeta.fullTitle}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeMeta.template13Ref}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={handleSaveCurrentDraft}
                className="bg-white text-xs gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Draft
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePrintActiveDoc}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / PDF A4
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {banner && (
              <div
                className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium flex items-center justify-between gap-2 ${
                  banner.type === "ok"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <span>{banner.text}</span>
                <button type="button" onClick={() => setBanner(null)} className="underline font-bold">
                  Tutup
                </button>
              </div>
            )}

            {/* ==================== 1. DAFTAR TANDA TERIMA HONOR FASILITATOR BULANAN (A.4) ==================== */}
            {activeType === "HONOR_FASIL_BULANAN" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Bulan Honorarium</label>
                    <select
                      value={honorMonth}
                      onChange={(e) => setHonorMonth(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold"
                    >
                      {HONOR_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {getMonthLabelId(m)} ({m})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Tanda Terima</label>
                    <Input
                      type="date"
                      value={honorTanggalCetak}
                      onChange={(e) => setHonorTanggalCetak(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomHonorRowsByMonth((prev) => ({
                          ...prev,
                          [honorMonth]: dbHonorSheet.rows,
                        }));
                        setBanner({
                          type: "ok",
                          text: `Data ${getMonthLabelId(honorMonth)} disegarkan dari Rekap Honorarium (${dbHonorSheet.rows.length} fasilitator).`,
                        });
                      }}
                      className="text-xs h-9 bg-white gap-1 w-full"
                    >
                      <Download className="w-3.5 h-3.5" /> Muat dari Rekap DB
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honorRecipientMode === "BLANK"}
                      onChange={(e) => setHonorRecipientMode(e.target.checked ? "BLANK" : "MANUAL")}
                    />
                    <span>Kosongkan kolom Nama Penerima (blanko tulis tangan)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honorIncludeTransport}
                      onChange={(e) => setHonorIncludeTransport(e.target.checked)}
                    />
                    <span>Sertakan info kolom Transport</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honorIncludeKwitansi}
                      onChange={(e) => setHonorIncludeKwitansi(e.target.checked)}
                    />
                    <span>Lampirkan lembar Kwitansi Honor per fasilitator</span>
                  </label>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b text-slate-700">
                      <tr>
                        <th className="py-2 px-2">Fasilitator &amp; Lokasi</th>
                        <th className="py-2 px-2 text-center">JP Intra</th>
                        <th className="py-2 px-2 text-center">JP Ekstra</th>
                        <th className="py-2 px-2 text-center">Total JP</th>
                        <th className="py-2 px-2 text-right">Harga Satuan Real/JP</th>
                        <th className="py-2 px-2 text-right">Total Honor</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {activeHonorRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500">
                            Belum ada Rekap Honorarium DB untuk {getMonthLabelId(honorMonth)}. Klik tombol &ldquo;+ Tambah Baris Manual&rdquo; untuk menyiapkan daftar bulan ini.
                          </td>
                        </tr>
                      ) : (
                        activeHonorRows.map((row, idx) => {
                          const updateRow = (patch: Partial<MonthlyHonorReceiptRow>) => {
                            const next = [...activeHonorRows];
                            const merged = { ...row, ...patch };
                            merged.totalJP = (Number(merged.jpIntra) || 0) + (Number(merged.jpEkstra) || 0);
                            if (patch.jpIntra !== undefined || patch.jpEkstra !== undefined || patch.hargaSatuanReal !== undefined) {
                              merged.totalHonor = merged.totalJP * (Number(merged.hargaSatuanReal) || 0);
                            } else if (patch.totalHonor !== undefined && merged.totalJP > 0) {
                              merged.hargaSatuanReal = Math.round((Number(patch.totalHonor) || 0) / merged.totalJP);
                            }
                            next[idx] = merged;
                            setCustomHonorRowsByMonth((prev) => ({ ...prev, [honorMonth]: next }));
                          };
                          return (
                            <tr key={row.id || idx}>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  value={row.nama}
                                  onChange={(e) => updateRow({ nama: e.target.value })}
                                  className="w-full min-w-[140px] border rounded px-1.5 py-1 text-xs font-medium"
                                />
                                <input
                                  type="text"
                                  value={row.lokasi}
                                  onChange={(e) => updateRow({ lokasi: e.target.value })}
                                  className="w-full mt-1 border rounded px-1.5 py-0.5 text-[10px] text-slate-500"
                                />
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                <input
                                  type="number"
                                  value={row.jpIntra}
                                  onChange={(e) => updateRow({ jpIntra: Number(e.target.value) || 0 })}
                                  className="w-14 border rounded px-1 py-1 text-center text-xs"
                                />
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                <input
                                  type="number"
                                  value={row.jpEkstra}
                                  onChange={(e) => updateRow({ jpEkstra: Number(e.target.value) || 0 })}
                                  className="w-14 border rounded px-1 py-1 text-center text-xs"
                                />
                              </td>
                              <td className="py-1.5 px-2 text-center font-bold">{row.totalJP}</td>
                              <td className="py-1.5 px-1 text-right">
                                <input
                                  type="number"
                                  value={row.hargaSatuanReal}
                                  onChange={(e) => updateRow({ hargaSatuanReal: Number(e.target.value) || 0 })}
                                  className="w-24 border rounded px-1.5 py-1 text-right text-xs"
                                />
                              </td>
                              <td className="py-1.5 px-1 text-right">
                                <input
                                  type="number"
                                  value={row.totalHonor}
                                  onChange={(e) => updateRow({ totalHonor: Number(e.target.value) || 0 })}
                                  className="w-28 border rounded px-1.5 py-1 text-right text-xs font-semibold"
                                />
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = activeHonorRows.filter((_, i) => i !== idx);
                                    setCustomHonorRowsByMonth((prev) => ({ ...prev, [honorMonth]: next }));
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                  title="Hapus baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-blue-50/70 border-t font-bold">
                      <tr>
                        <td className="py-2 px-2">TOTAL ({activeHonorRows.length} Fasilitator)</td>
                        <td className="py-2 px-2 text-center">{activeHonorSheet.totalJpIntra}</td>
                        <td className="py-2 px-2 text-center">{activeHonorSheet.totalJpEkstra}</td>
                        <td className="py-2 px-2 text-center">{activeHonorSheet.totalJP}</td>
                        <td className="py-2 px-2 text-right">-</td>
                        <td className="py-2 px-2 text-right text-blue-800 whitespace-nowrap">
                          {formatCurrency(activeHonorSheet.totalHonor)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next: MonthlyHonorReceiptRow[] = [
                        ...activeHonorRows,
                        {
                          id: `manual-${Date.now()}`,
                          nama: "",
                          lokasi: SNT_WILAYAH_2_LOCATIONS[0].label,
                          jpIntra: 32,
                          jpEkstra: 16,
                          totalJP: 48,
                          hargaSatuanReal: 65000,
                          totalHonor: 3120000,
                          totalTransport: 0,
                          status: "MANUAL",
                        },
                      ];
                      setCustomHonorRowsByMonth((prev) => ({ ...prev, [honorMonth]: next }));
                    }}
                    className="text-xs bg-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Manual
                  </Button>
                  <span className="text-[11px] text-slate-500">
                    Tips: Tarif real JP umum = Rp65.000/JP (otomatis terhitung dari `Honor / Total JP`).
                  </span>
                </div>
              </div>
            )}

            {/* ==================== 2. KONTRAK SEWA RUMAH & KWITANSI BULANAN (B.3b) ==================== */}
            {activeType === "SEWA_RUMAH" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                  <div className="text-xs font-semibold text-amber-900">
                    Mode Nama Pemilik Rumah &amp; Fasilitator di Dokumen Cetak:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSewaDraft({ ...sewaDraft, recipientMode: "BLANK" })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                        sewaDraft.recipientMode === "BLANK"
                          ? "bg-slate-900 text-white"
                          : "bg-white border text-slate-700"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" /> Kosongkan (Blanko Tulis Tangan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSewaDraft({ ...sewaDraft, recipientMode: "MANUAL" })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                        sewaDraft.recipientMode === "MANUAL"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border text-slate-700"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Isi Manual
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Kontrak Sewa</label>
                    <Input
                      value={sewaDraft.nomorKontrak}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, nomorKontrak: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lokasi SNT (Wilayah 2)</label>
                    <select
                      value={sewaDraft.lokasiSnt}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, lokasiSnt: e.target.value })}
                      className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs"
                    >
                      {SNT_WILAYAH_2_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.label}>
                          {loc.label} ({loc.province})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Pemilik Rumah {sewaDraft.recipientMode === "BLANK" && "(Akan dicetak kosong)"}
                    </label>
                    <Input
                      value={sewaDraft.namaPemilik}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, namaPemilik: e.target.value })}
                      placeholder="Kosongkan untuk blanko atau ketik manual..."
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Fasilitator Penghuni {sewaDraft.recipientMode === "BLANK" && "(Akan dicetak kosong)"}
                    </label>
                    <div className="flex gap-1.5">
                      <Input
                        value={sewaDraft.namaFasilitator}
                        onChange={(e) => setSewaDraft({ ...sewaDraft, namaFasilitator: e.target.value })}
                        placeholder="Ketik atau pilih..."
                        className="h-9 text-xs flex-1"
                      />
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setSewaDraft({
                              ...sewaDraft,
                              recipientMode: "MANUAL",
                              namaFasilitator: e.target.value,
                            });
                          }
                        }}
                        className="h-9 px-2 rounded-md border border-slate-200 bg-white text-[11px] max-w-[110px]"
                      >
                        <option value="">Pilih DB</option>
                        {fasilitators.map((f) => (
                          <option key={f.id} value={f.namaLengkap}>
                            {f.namaLengkap}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Rumah / Kost Sewa</label>
                    <Input
                      value={sewaDraft.alamatRumahSewa}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, alamatRumahSewa: e.target.value })}
                      placeholder="Alamat lengkap atau kosongkan untuk ditulis tangan..."
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Kontrak</label>
                    <Input
                      type="date"
                      value={sewaDraft.tanggalKontrak}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, tanggalKontrak: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jumlah Bulan (1–4)</label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={sewaDraft.jumlahBulan}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, jumlahBulan: Number(e.target.value) || 1 })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tarif Sewa / Bulan (Maks RAB Rp2.000.000)</label>
                    <Input
                      type="number"
                      min={0}
                      value={sewaDraft.tarifPerBulan}
                      onChange={(e) => setSewaDraft({ ...sewaDraft, tarifPerBulan: Number(e.target.value) || 0 })}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-blue-50/60 border-blue-200 p-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-blue-900 font-medium">
                    <input
                      type="checkbox"
                      checked={sewaIncludeMonthlyKwt}
                      onChange={(e) => setSewaIncludeMonthlyKwt(e.target.checked)}
                    />
                    <span>
                      Sertakan cetak <strong>{sewaDraft.jumlahBulan} lembar Kwitansi Bulanan Sewa Rumah</strong> (Total: {formatCurrency(sewaDraft.jumlahBulan * sewaDraft.tarifPerBulan)})
                    </span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={recordingId === "sewa-total"}
                    onClick={() =>
                      handleRecordLineToRab(
                        "sewa-total",
                        "3b",
                        sewaDraft.tanggalKontrak,
                        `Bantuan Sewa Rumah Fasilitator ${sewaDraft.lokasiSnt} (${sewaDraft.jumlahBulan} bln)`,
                        sewaDraft.jumlahBulan * sewaDraft.tarifPerBulan
                      )
                    }
                    className="bg-white border-blue-300 text-blue-800 hover:bg-blue-100 text-xs h-8 gap-1"
                  >
                    {recordingId === "sewa-total" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Catat ke Realisasi RAB (Pos 3b)
                  </Button>
                </div>
              </div>
            )}

            {/* ==================== 3. 8 DOKUMEN BUKTI WAJIB LAINNYA (GENERIC TABLE + KWITANSI SLIPS) ==================== */}
            {activeType !== "HONOR_FASIL_BULANAN" && activeType !== "SEWA_RUMAH" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                  <div className="text-xs font-semibold text-amber-900">
                    Mode Nama Penerima pada Daftar &amp; Kwitansi:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateGenericDraft((p) => ({ ...p, recipientMode: "BLANK" }))}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                        currentGenericDraft.recipientMode === "BLANK"
                          ? "bg-slate-900 text-white"
                          : "bg-white border text-slate-700"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" /> Kosongkan (Blanko)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGenericDraft((p) => ({ ...p, recipientMode: "MANUAL" }))}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                        currentGenericDraft.recipientMode === "MANUAL"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border text-slate-700"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Isi Manual
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {activeType === "HONOR_TIM" && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pos RAB Target</label>
                      <select
                        value={currentGenericDraft.rabCode}
                        onChange={(e) => updateGenericDraft((p) => ({ ...p, rabCode: e.target.value }))}
                        className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="1">A.1 — Ketua Tim Pelaksana</option>
                        <option value="2">A.2 — Tim Program Koding KA Robotika</option>
                        <option value="3">A.3 — Koordinator Wilayah</option>
                        <option value="5">A.5 — Tenaga Administrasi</option>
                        <option value="4a">B.4a — Narasumber Pelatihan In</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Periode Dokumen</label>
                    <Input
                      value={currentGenericDraft.periodeLabel}
                      onChange={(e) => updateGenericDraft((p) => ({ ...p, periodeLabel: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Pengesahan</label>
                    <Input
                      type="date"
                      value={currentGenericDraft.tanggalDokumen}
                      onChange={(e) => updateGenericDraft((p) => ({ ...p, tanggalDokumen: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePullFromExistingRab}
                      className="bg-white text-xs h-8 gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Tarik dari Transaksi Pos {currentGenericDraft.rabCode}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateGenericDraft((p) => ({
                          ...p,
                          items: [
                            ...p.items,
                            {
                              id: `line-${Date.now()}`,
                              tanggal: p.tanggalDokumen,
                              lokasi: SNT_WILAYAH_2_LOCATIONS[0].label,
                              uraian: "",
                              penerima: "",
                              volume: 1,
                              satuan: "paket",
                              hargaSatuan: 0,
                              nominal: 0,
                            },
                          ],
                        }))
                      }
                      className="bg-white text-xs h-8 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </Button>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genericIncludeKwitansi}
                      onChange={(e) => setGenericIncludeKwitansi(e.target.checked)}
                    />
                    <span>Sertakan lembar Kwitansi tiap baris</span>
                  </label>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b text-slate-700">
                      <tr>
                        <th className="py-2 px-2">Tanggal &amp; Lokasi</th>
                        <th className="py-2 px-2">Uraian &amp; Penerima</th>
                        <th className="py-2 px-2 text-center">Vol × Harga</th>
                        <th className="py-2 px-2 text-right">Jumlah</th>
                        <th className="py-2 px-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {currentGenericDraft.items.map((it, idx) => {
                        const patchItem = (patch: Partial<EvidenceLineItem>) => {
                          updateGenericDraft((p) => {
                            const next = [...p.items];
                            const merged = { ...it, ...patch };
                            if (patch.volume !== undefined || patch.hargaSatuan !== undefined) {
                              merged.nominal = (Number(merged.volume) || 0) * (Number(merged.hargaSatuan) || 0);
                            }
                            next[idx] = merged;
                            return { ...p, items: next };
                          });
                        };
                        return (
                          <tr key={it.id || idx}>
                            <td className="py-1.5 px-2 space-y-1">
                              <input
                                type="date"
                                value={it.tanggal}
                                onChange={(e) => patchItem({ tanggal: e.target.value })}
                                className="w-32 border rounded px-1.5 py-1 text-[11px]"
                              />
                              <input
                                type="text"
                                value={it.lokasi}
                                onChange={(e) => patchItem({ lokasi: e.target.value })}
                                placeholder="Lokasi SNT..."
                                className="w-32 block border rounded px-1.5 py-0.5 text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 space-y-1">
                              <input
                                type="text"
                                value={it.uraian}
                                onChange={(e) => patchItem({ uraian: e.target.value })}
                                placeholder="Uraian pengeluaran..."
                                className="w-full min-w-[170px] border rounded px-1.5 py-1 text-xs"
                              />
                              <input
                                type="text"
                                value={it.penerima}
                                onChange={(e) => patchItem({ penerima: e.target.value })}
                                placeholder={
                                  currentGenericDraft.recipientMode === "BLANK"
                                    ? "(Mode Blanko: akan dicetak garis kosong)"
                                    : "Nama penerima manual..."
                                }
                                className="w-full border rounded px-1.5 py-0.5 text-[11px] text-slate-600"
                              />
                            </td>
                            <td className="py-1.5 px-1 text-center space-y-1">
                              <div className="flex items-center gap-1 justify-center">
                                <input
                                  type="number"
                                  value={it.volume}
                                  onChange={(e) => patchItem({ volume: Number(e.target.value) || 0 })}
                                  className="w-12 border rounded px-1 py-0.5 text-center text-[11px]"
                                />
                                <input
                                  type="text"
                                  value={it.satuan}
                                  onChange={(e) => patchItem({ satuan: e.target.value })}
                                  className="w-14 border rounded px-1 py-0.5 text-center text-[11px]"
                                />
                              </div>
                              <input
                                type="number"
                                value={it.hargaSatuan}
                                onChange={(e) => patchItem({ hargaSatuan: Number(e.target.value) || 0 })}
                                className="w-24 border rounded px-1.5 py-0.5 text-right text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-right font-semibold whitespace-nowrap">
                              {formatCurrency(it.nominal)}
                            </td>
                            <td className="py-1.5 px-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={recordingId === it.id || it.nominal <= 0}
                                  onClick={() =>
                                    handleRecordLineToRab(
                                      it.id,
                                      currentGenericDraft.rabCode,
                                      it.tanggal,
                                      it.uraian || activeMeta.shortTitle,
                                      it.nominal
                                    )
                                  }
                                  className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold disabled:opacity-40"
                                  title={`Catat baris ini ke Realisasi Pos RAB ${currentGenericDraft.rabCode}`}
                                >
                                  {recordingId === it.id ? "..." : "+ RAB"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateGenericDraft((p) => ({
                                      ...p,
                                      items: p.items.filter((_, i) => i !== idx),
                                    }))
                                  }
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                  title="Hapus baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t font-bold">
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right">
                          TOTAL DOKUMEN:
                        </td>
                        <td className="py-2 px-2 text-right text-blue-800 whitespace-nowrap">
                          {formatCurrency(
                            currentGenericDraft.items.reduce((s, it) => s + (Number(it.nominal) || 0), 0)
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
