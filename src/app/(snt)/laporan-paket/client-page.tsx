"use client";

import React, { useMemo, useState } from "react";
import {
  Printer,
  FileText,
  ClipboardCheck,
  Save,
  Loader2,
  CheckSquare,
  Square,
  SlidersHorizontal,
  FolderCheck,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { saveSntReportDraft } from "@/app/actions/snt-reports";
import {
  computeKwitansiAuditSummary,
  computeLocationActivityStats,
  computeRabRealizationSummary,
  KopSuratOption,
  RealizationBasisMode,
  SNT_PERIOD_OPTIONS,
  SNT_REPORT_TEMPLATES,
  SntFasilitatorRecord,
  SntLaporanKegiatanRecord,
  SntRabCategoryRecord,
  SntRekapRecord,
  SntReportProfile,
  SntTemplateCode,
} from "@/lib/snt-report-templates";
import { renderSntReportBundleHtml } from "@/lib/snt-report-pdf";
import { KwitansiAuditTab } from "./KwitansiAuditTab";
import { TemplateEditorTab } from "./TemplateEditorTab";
import { EvidenceDocsTab } from "./EvidenceDocsTab";
import { TargetStrategyTab } from "./TargetStrategyTab";
import { normalizeRabPosCode, RabPosCode } from "@/lib/snt-rab-pos-catalog";

interface DraftRecordItem {
  id: string;
  templateCode: string;
  periodKey: string;
  title: string;
  content: Record<string, unknown>;
  updatedAt: string;
}

interface WorkspaceInitialData {
  rabProject: {
    id: string;
    name: string;
    totalBudget: number;
    categories: SntRabCategoryRecord[];
  } | null;
  fasilitators: SntFasilitatorRecord[];
  laporanKegiatan: SntLaporanKegiatanRecord[];
  rekaps: SntRekapRecord[];
  profile: SntReportProfile;
  drafts: DraftRecordItem[];
}

export function PaketLaporanClientPage({ initialData }: { initialData: WorkspaceInitialData }) {
  const [activeTab, setActiveTab] = useState<"export" | "editor" | "kwitansi" | "evidence" | "strategy">("export");
  const [selectedRabPosCode, setSelectedRabPosCode] = useState<RabPosCode>("3");
  const [periodKey, setPeriodKey] = useState<string>("TAHAP_1");
  const [realizationBasis, setRealizationBasis] = useState<RealizationBasisMode>("PELAPORAN_SMART");
  const [selectedTemplates, setSelectedTemplates] = useState<SntTemplateCode[]>(["13", "02"]);
  const [includePpn11, setIncludePpn11] = useState<boolean>(false);
  const [includeExtraCategories, setIncludeExtraCategories] = useState<boolean>(false);
  const [includeKwitansiPages, setIncludeKwitansiPages] = useState<boolean>(false);
  const [includeReceiptAttachments, setIncludeReceiptAttachments] = useState<boolean>(false);

  const [profile, setProfile] = useState<SntReportProfile>(initialData.profile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [draftRecords, setDraftRecords] = useState<DraftRecordItem[]>(initialData.drafts || []);

  const categories = useMemo(
    () => initialData.rabProject?.categories || [],
    [initialData.rabProject]
  );

  const periodOption = useMemo(
    () => SNT_PERIOD_OPTIONS.find((p) => p.key === periodKey) || SNT_PERIOD_OPTIONS[0],
    [periodKey]
  );

  const rabSummary = useMemo(
    () =>
      computeRabRealizationSummary(categories, {
        monthKey: periodOption.monthPrefix,
        includePpn11,
        termin1Persen: profile.termin1Persen,
        termin2Persen: profile.termin2Persen,
        customPaguKontrak: profile.customPaguKontrak,
        basis: realizationBasis,
      }),
    [
      categories,
      periodOption.monthPrefix,
      includePpn11,
      profile.termin1Persen,
      profile.termin2Persen,
      profile.customPaguKontrak,
      realizationBasis,
    ]
  );

  const officialAudit = useMemo(
    () => computeKwitansiAuditSummary(categories, !includeExtraCategories, realizationBasis),
    [categories, includeExtraCategories, realizationBasis]
  );

  const locationStats = useMemo(
    () =>
      computeLocationActivityStats(
        initialData.fasilitators || [],
        initialData.laporanKegiatan || [],
        initialData.rekaps || [],
        periodOption.monthPrefix
      ),
    [initialData.fasilitators, initialData.laporanKegiatan, initialData.rekaps, periodOption.monthPrefix]
  );

  const draftsMap = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const tpl of SNT_REPORT_TEMPLATES) {
      const targetPeriod = tpl.hasPeriodSelector ? periodKey : "DEFAULT";
      const exact = draftRecords.find(
        (d) => d.templateCode === tpl.code && d.periodKey === targetPeriod
      );
      const fallback = draftRecords.find((d) => d.templateCode === tpl.code);
      if (exact?.content && typeof exact.content === "object") {
        map[tpl.code] = exact.content;
      } else if (fallback?.content && typeof fallback.content === "object") {
        map[tpl.code] = fallback.content;
      } else {
        map[tpl.code] = {};
      }
    }
    return map;
  }, [draftRecords, periodKey]);

  const savedTemplateCodes = useMemo(() => {
    const set = new Set<string>();
    for (const d of draftRecords) {
      if (d.templateCode !== "PROFILE" && !d.templateCode.startsWith("EVIDENCE_")) {
        set.add(d.templateCode);
      }
    }
    return set;
  }, [draftRecords]);

  const evidenceDraftsMap = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const d of draftRecords) {
      if (d.templateCode.startsWith("EVIDENCE_") && d.content && typeof d.content === "object") {
        map[d.templateCode] = d.content;
      }
    }
    return map;
  }, [draftRecords]);

  const handleEvidenceDraftSaved = (
    templateCode: string,
    targetPeriod: string,
    content: Record<string, unknown>
  ) => {
    setDraftRecords((prev) => {
      const idx = prev.findIndex(
        (d) => d.templateCode === templateCode && d.periodKey === targetPeriod
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], content, updatedAt: new Date().toISOString() };
        return next;
      }
      return [
        ...prev,
        {
          id: `local-${templateCode}-${targetPeriod}`,
          templateCode,
          periodKey: targetPeriod,
          title: templateCode,
          content,
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const toggleTemplateSelection = (code: SntTemplateCode) => {
    setSelectedTemplates((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await saveSntReportDraft({
        templateCode: "PROFILE",
        periodKey: "GLOBAL",
        title: "Profil Global Paket Laporan SNT Wilayah 2",
        content: profile as unknown as Record<string, unknown>,
      });
      if (!res.success) {
        setProfileMsg(`Gagal menyimpan profil: ${res.error}`);
        return;
      }
      setProfileMsg("Profil laporan & pengesahan berhasil disimpan ke database.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDraftUpdatedLocally = (
    templateCode: SntTemplateCode,
    content: Record<string, unknown>
  ) => {
    const tplMeta = SNT_REPORT_TEMPLATES.find((t) => t.code === templateCode);
    const targetPeriod = tplMeta?.hasPeriodSelector ? periodKey : "DEFAULT";
    setDraftRecords((prev) => {
      const idx = prev.findIndex(
        (d) => d.templateCode === templateCode && d.periodKey === targetPeriod
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], content, updatedAt: new Date().toISOString() };
        return next;
      }
      return [
        ...prev,
        {
          id: `local-${templateCode}-${targetPeriod}`,
          templateCode,
          periodKey: targetPeriod,
          title: tplMeta?.fullTitle || templateCode,
          content,
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const openPrintWindow = (templatesToExport: SntTemplateCode[]) => {
    if (templatesToExport.length === 0) {
      alert("Pilih minimal 1 template laporan untuk diekspor ke PDF.");
      return;
    }

    const html = renderSntReportBundleHtml({
      selectedTemplates: templatesToExport,
      periodKey,
      profile,
      rabSummary,
      auditRows: officialAudit.rows,
      locationStats,
      fasilitators: initialData.fasilitators || [],
      laporanKegiatan: initialData.laporanKegiatan || [],
      drafts: draftsMap,
      includePpn11,
      includeExtraCategories,
      includeKwitansiPages,
      includeReceiptAttachments,
    });

    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup diblokir browser. Izinkan popup untuk mencetak / menyimpan PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-2">
            KKA SNT 2026 · Wilayah 2 (6 Lokasi)
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Paket Laporan SNT &amp; Audit Kwitansi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lengkapi 8 template resmi KAK berbasis data RAB &amp; operasional aplikasi, audit kelengkapan kwitansi, lalu ekspor menjadi PDF A4 sesuai pilihan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => openPrintWindow(selectedTemplates)}
            disabled={selectedTemplates.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            <Printer className="w-4 h-4" />
            Export PDF Terpilih ({selectedTemplates.length})
          </Button>
        </div>
      </div>

      {/* Sakelar Basis Sumber Angka Laporan: Pelaporan Template vs Realisasi Real */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
        <div>
          <div className="text-xs font-bold text-slate-900">
            Basis Sumber Angka Laporan (PDF Template 02, 03, 12, 13 &amp; Target &gt; 80%)
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Real Kas: <strong className="text-emerald-700">{formatCurrency(rabSummary.subtotalOfficialRealizedReal)}</strong> ({rabSummary.realTxCount} tx) · Pelaporan Template: <strong className="text-blue-700">{formatCurrency(rabSummary.subtotalOfficialRealizedTemplate)}</strong> ({rabSummary.pelaporanTxCount} entri override) · Selisih: <strong className="text-amber-800">{rabSummary.varianceOfficialRealVsTemplate >= 0 ? "+" : ""}{formatCurrency(rabSummary.varianceOfficialRealVsTemplate)}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {([
            { key: "PELAPORAN_SMART" as const, label: "Pelaporan Template (Prioritas SPJ, Fallback Real)" },
            { key: "REAL" as const, label: "Khusus Realisasi Real (Kas)" },
            { key: "PELAPORAN_ONLY" as const, label: "Hanya Entri PELAPORAN" },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRealizationBasis(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                realizationBasis === opt.key
                  ? opt.key === "REAL"
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ringkasan KPI Live Wilayah 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Pagu RAB Wilayah 2 (A + B)</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(rabSummary.grandTotalBudget)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {includePpn11 ? "Termasuk PPN 11%" : "Tanpa PPN 11% (dapat diubah)"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4">
            <div className="text-xs text-blue-700 font-medium">
              Realisasi Kumulatif ({realizationBasis === "REAL" ? "Basis Real Kas" : realizationBasis === "PELAPORAN_ONLY" ? "Khusus Entri SPJ" : "Basis Pelaporan Template"})
            </div>
            <div className="text-xl font-bold text-blue-800 mt-1">
              {formatCurrency(rabSummary.grandTotalRealizedTotal)}
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              Serapan Total: {rabSummary.overallSerapanPct.toFixed(1)}% · Termin I: {rabSummary.serapanTerhadapTermin1Pct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4">
            <div className="text-xs text-amber-800 font-medium">Status Bukti &amp; Kwitansi (A + B)</div>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {officialAudit.withKwitansiCount}/{officialAudit.totalTx} Kwt · {officialAudit.withReceiptCount}/{officialAudit.totalTx} Nota
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              {officialAudit.missingKwitansiCount} belum berkwitansi · {officialAudit.missingReceiptCount} belum ada nota
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-800 font-medium">Data Operasional Terhubung</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {initialData.fasilitators.length} Fasilitator · {initialData.laporanKegiatan.length} Lap.
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              {initialData.rekaps.length} Rekap Honor · 6 Lokasi SNT Wilayah 2
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("export")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "export"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Printer className="w-4 h-4" />
          1. Pusat Export PDF &amp; Profil Laporan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "editor"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Lengkapi Isian 8 Template ({savedTemplateCodes.size}/8 Draft)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("kwitansi")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "kwitansi"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          3. Audit &amp; Kelengkapan Kwitansi
          {(officialAudit.missingKwitansiCount > 0 || officialAudit.missingReceiptCount > 0) && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
              {officialAudit.missingKwitansiCount + officialAudit.missingReceiptCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("evidence")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "evidence"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <FolderCheck className="w-4 h-4" />
          4. Dokumen Bukti per Pos RAB (23 Pos)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("strategy")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "strategy"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Target className="w-4 h-4" />
          5. Target &gt; 80% &amp; Strategi AI
        </button>
      </div>

      {/* TAB 1: EXPORT PDF & PROFIL */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kiri: Pemilih Paket Export PDF */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4 px-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Pilih Laporan &amp; Opsi Export PDF (A4)
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Centang 1 atau beberapa template untuk digabung sekaligus dalam satu dokumen cetak PDF.
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white h-7"
                      onClick={() => setSelectedTemplates(["13", "02", "03", "12"])}
                    >
                      Keuangan (4)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs bg-white h-7"
                      onClick={() => setSelectedTemplates(SNT_REPORT_TEMPLATES.map((t) => t.code))}
                    >
                      Semua (8)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => setSelectedTemplates([])}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Periode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Periode Pelaporan
                  </label>
                  <select
                    value={periodKey}
                    onChange={(e) => setPeriodKey(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium"
                  >
                    {SNT_PERIOD_OPTIONS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Daftar 8 Template Checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Checklist Template yang Akan Diekspor:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SNT_REPORT_TEMPLATES.map((tpl) => {
                      const checked = selectedTemplates.includes(tpl.code);
                      return (
                        <button
                          key={tpl.code}
                          type="button"
                          onClick={() => toggleTemplateSelection(tpl.code)}
                          className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                            checked
                              ? "bg-blue-50/70 border-blue-400"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">{tpl.shortTitle}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {tpl.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Opsi Keuangan & Bundle Lampiran */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    Opsi Pos Keuangan &amp; Bundle Lampiran PDF
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePpn11}
                      onChange={(e) => setIncludePpn11(e.target.checked)}
                    />
                    <span>Sertakan perhitungan baris <strong>PPN 11%</strong> pada tabel Penggunaan Dana</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExtraCategories}
                      onChange={(e) => setIncludeExtraCategories(e.target.checked)}
                    />
                    <span>Sertakan <strong>Lampiran Terpisah Pos C (Unbudgeted) &amp; Pengadaan IoT (D/E/F)</strong></span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeKwitansiPages}
                      onChange={(e) => setIncludeKwitansiPages(e.target.checked)}
                    />
                    <span>
                      Sertakan <strong>Bundle Halaman Kwitansi Resmi</strong> ({officialAudit.withKwitansiCount} kwitansi siap cetak)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReceiptAttachments}
                      onChange={(e) => setIncludeReceiptAttachments(e.target.checked)}
                    />
                    <span>
                      Sertakan <strong>Lampiran Foto / PDF Bukti Nota</strong> ({officialAudit.withReceiptCount} transaksi berlampiran)
                    </span>
                  </label>
                </div>

                <Button
                  type="button"
                  onClick={() => openPrintWindow(selectedTemplates)}
                  disabled={selectedTemplates.length === 0}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Buka Preview &amp; Export PDF A4 ({selectedTemplates.length} Template Terpilih)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Kanan: Profil Global Laporan & Pengesahan */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b py-4 px-5 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Profil &amp; Pengesahan Laporan
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dipakai otomatis pada seluruh 8 template saat ekspor PDF.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingProfile}
                  onClick={handleSaveProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Simpan
                </Button>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {profileMsg && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-xs font-medium">
                    {profileMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan Kop Surat PDF</label>
                  <select
                    value={profile.kopSurat}
                    onChange={(e) => setProfile({ ...profile, kopSurat: e.target.value as KopSuratOption })}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="maleo">Yayasan Maleo Talenta Cendekia</option>
                    <option value="lpd">LPD Jully Tjindrawan Robotik (Kop Baru)</option>
                    <option value="robotic">Robotic Explorer — PT Jully Tjindrawan Robotik (Kop Baru)</option>
                    <option value="none">Tanpa Kop Surat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Yayasan / Pelaksana Swakelola</label>
                  <Input
                    value={profile.namaYayasan}
                    onChange={(e) => setProfile({ ...profile, namaYayasan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor PKS Swakelola</label>
                    <Input
                      value={profile.nomorPks}
                      onChange={(e) => setProfile({ ...profile, nomorPks: e.target.value })}
                      placeholder="Nomor PKS..."
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal PKS</label>
                    <Input
                      value={profile.tanggalPks}
                      onChange={(e) => setProfile({ ...profile, tanggalPks: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ketua Tim Pelaksana</label>
                    <Input
                      value={profile.ketuaTimPelaksana}
                      onChange={(e) => setProfile({ ...profile, ketuaTimPelaksana: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Koordinator Wilayah 2</label>
                    <Input
                      value={profile.koordinatorWilayah}
                      onChange={(e) => setProfile({ ...profile, koordinatorWilayah: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bagian Administrasi</label>
                    <Input
                      value={profile.bagianAdministrasi}
                      onChange={(e) => setProfile({ ...profile, bagianAdministrasi: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama PPK</label>
                    <Input
                      value={profile.namaPpk}
                      onChange={(e) => setProfile({ ...profile, namaPpk: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kota Pengesahan</label>
                    <Input
                      value={profile.kotaPengesahan}
                      onChange={(e) => setProfile({ ...profile, kotaPengesahan: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Laporan</label>
                    <Input
                      type="date"
                      value={profile.tanggalLaporan}
                      onChange={(e) => setProfile({ ...profile, tanggalLaporan: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Termin I (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.termin1Persen}
                      onChange={(e) => setProfile({ ...profile, termin1Persen: Number(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Termin II (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profile.termin2Persen}
                      onChange={(e) => setProfile({ ...profile, termin2Persen: Number(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Override Pagu (0=Auto)</label>
                    <Input
                      type="number"
                      min={0}
                      value={profile.customPaguKontrak}
                      onChange={(e) => setProfile({ ...profile, customPaguKontrak: Number(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Pengaturan Kontak & Rekening Kop Baru (LPD & Robotic Explorer) */}
                <div className="pt-3 mt-2 border-t border-slate-200 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                    Kontak &amp; Rekening Kop LPD Jully Tjindrawan Robotik
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Telp / WA LPD</label>
                      <Input
                        value={profile.lpdTelp || ""}
                        onChange={(e) => setProfile({ ...profile, lpdTelp: e.target.value })}
                        placeholder="08xx-xxxx-xxxx"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email LPD</label>
                      <Input
                        value={profile.lpdEmail || ""}
                        onChange={(e) => setProfile({ ...profile, lpdEmail: e.target.value })}
                        placeholder="email@domain.com"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bank LPD</label>
                      <Input
                        value={profile.lpdBankName || ""}
                        onChange={(e) => setProfile({ ...profile, lpdBankName: e.target.value })}
                        placeholder="BCA / Mandiri"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. Rekening LPD</label>
                      <Input
                        value={profile.lpdBankAccount || ""}
                        onChange={(e) => setProfile({ ...profile, lpdBankAccount: e.target.value })}
                        placeholder="No. rekening..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Atas Nama LPD</label>
                      <Input
                        value={profile.lpdBankHolder || ""}
                        onChange={(e) => setProfile({ ...profile, lpdBankHolder: e.target.value })}
                        placeholder="LPD Jully Tjindrawan Robotik"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800 pt-1">
                    Kontak &amp; Rekening Kop Robotic Explorer (PT JTR)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">WhatsApp RE</label>
                      <Input
                        value={profile.reTelp || ""}
                        onChange={(e) => setProfile({ ...profile, reTelp: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Website RE</label>
                      <Input
                        value={profile.reWebsite || ""}
                        onChange={(e) => setProfile({ ...profile, reWebsite: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bank RE</label>
                      <Input
                        value={profile.reBankName || ""}
                        onChange={(e) => setProfile({ ...profile, reBankName: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. Rekening RE</label>
                      <Input
                        value={profile.reBankAccount || ""}
                        onChange={(e) => setProfile({ ...profile, reBankAccount: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Atas Nama RE</label>
                      <Input
                        value={profile.reBankHolder || ""}
                        onChange={(e) => setProfile({ ...profile, reBankHolder: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 pt-1">
                    Pengesahan &amp; Rekening Kop Yayasan Maleo Talenta Cendekia
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Ketua Yayasan (Penandatangan Invoice &amp; Kwitansi Maleo)
                    </label>
                    <Input
                      value={profile.ketuaYayasanMaleo || ""}
                      onChange={(e) => setProfile({ ...profile, ketuaYayasanMaleo: e.target.value })}
                      placeholder="Mutiara Hikma Mahendradatta, BBA., MBA."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bank Maleo</label>
                      <Input
                        value={profile.maleoBankName || ""}
                        onChange={(e) => setProfile({ ...profile, maleoBankName: e.target.value })}
                        placeholder="BANK MANDIRI"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">No. Rekening Maleo</label>
                      <Input
                        value={profile.maleoBankAccount || ""}
                        onChange={(e) => setProfile({ ...profile, maleoBankAccount: e.target.value })}
                        placeholder="No. rekening Mandiri..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Atas Nama Maleo</label>
                      <Input
                        value={profile.maleoBankHolder || ""}
                        onChange={(e) => setProfile({ ...profile, maleoBankHolder: e.target.value })}
                        placeholder="MALEO TALENTA CENDEKIA"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EDITOR 8 TEMPLATE */}
      {activeTab === "editor" && (
        <TemplateEditorTab
          periodKey={periodKey}
          draftsMap={draftsMap}
          savedTemplateCodes={savedTemplateCodes}
          rabSummary={rabSummary}
          locationStats={locationStats}
          fasilitators={initialData.fasilitators || []}
          onDraftSaved={handleDraftUpdatedLocally}
          onQuickExportSingle={(code) => openPrintWindow([code])}
        />
      )}

      {/* TAB 3: AUDIT & KELENGKAPAN KWITANSI */}
      {activeTab === "kwitansi" && (
        <KwitansiAuditTab
          categories={categories}
          rabSummary={rabSummary}
          profile={profile}
          realizationBasis={realizationBasis}
        />
      )}

      {/* TAB 4: DOKUMEN BUKTI PELAPORAN PER POS RAB (23 POS RESMI) */}
      {activeTab === "evidence" && (
        <EvidenceDocsTab
          activeRabCode={selectedRabPosCode}
          onSelectRabCode={setSelectedRabPosCode}
          profile={profile}
          categories={categories}
          rekaps={initialData.rekaps || []}
          fasilitators={initialData.fasilitators || []}
          evidenceDrafts={evidenceDraftsMap}
          onDraftSaved={handleEvidenceDraftSaved}
        />
      )}

      {/* TAB 5: TARGET > 80% RAB & STRATEGI EFISIENSI AI */}
      {activeTab === "strategy" && (
        <TargetStrategyTab
          rabSummary={rabSummary}
          onJumpToRabPos={(rabCode) => {
            const normalized = normalizeRabPosCode(rabCode);
            if (normalized) setSelectedRabPosCode(normalized);
            setActiveTab("evidence");
          }}
        />
      )}
    </div>
  );
}
