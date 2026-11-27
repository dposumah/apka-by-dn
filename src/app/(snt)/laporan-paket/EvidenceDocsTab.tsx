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
  allocateOfficialDocNumberForEvidence,
  recordEvidenceToRabExpense,
  saveSntReportDraft,
} from "@/app/actions/snt-reports";
import { resolveEntityCodeFromKop } from "@/lib/snt-doc-numbering";
import {
  buildDraftFromDriveMockupPreset,
  buildMonthlyFacilitatorHonorReceipt,
  buildMonthlyKorwilSlipHonorariumInputs,
  buildMonthlyPersonnelDraft,
  buildMonthlyRabUnitHonorReceipt,
  buildMonthlyTenagaAdminSlipHonorariumInputs,
  DRIVE_MOCKUP_PRESETS,
  DriveMockupPresetId,
  EVIDENCE_DOC_CATALOG,
  EvidenceDocType,
  EvidenceLineItem,
  GenericEvidenceDraft,
  getDefaultGenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  getHonorTimPresetByRabCode,
  getMonthLabelId,
  HonorPricingMode,
  matchWilayah2LocationId,
  MonthlyHonorReceiptRow,
  MonthlyPrintFilter,
  RecipientMode,
  SewaRumahContractDraft,
  SNT_HONOR_MONTH_OPTIONS,
  SNT_KORWIL_MONTHLY_SCHEDULE,
  SNT_RAB_HONOR_FASIL_UNIT_PRICE,
  SNT_RAB_TENAGA_ADMIN_UNIT_PRICE,
  SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE,
} from "@/lib/snt-evidence-docs";
import {
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  DEFAULT_SLIP_KEGIATAN_LABEL,
  isSlipHonorariumRabCode,
  KOP_OPTIONS_LIST,
  renderSlipHonorariumPdfDocumentHtml,
  resolveBrandKopTheme,
  resolvePersonnelRoleFromRab,
  SlipHonorariumInput,
} from "@/lib/snt-brand-kop";
import {
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderMultiMonthFacilitatorHonorPdfHtml,
  renderSewaRumahPdfHtml,
} from "@/lib/snt-evidence-pdf";
import {
  getValidKwitansiNumber,
  KopSuratOption,
  normalizeExpenseRealizationType,
  SNT_WILAYAH_2_LOCATIONS,
  SntExpenseRecord,
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
  const [recordTargetType, setRecordTargetType] = useState<"PELAPORAN" | "REAL">("PELAPORAN");
  const [newlyRecordedMap, setNewlyRecordedMap] = useState<
    Record<string, { noKwitansi?: string | null; realizationType: "PELAPORAN" | "REAL" }>
  >({});
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // State khusus Daftar Tanda Terima Honor Fasilitator Bulanan (A.4)
  const [honorMonth, setHonorMonth] = useState<string>("2026-10");
  const [honorPricingMode, setHonorPricingMode] = useState<HonorPricingMode>("RAB_SATUAN");
  const [honorKopSurat, setHonorKopSurat] = useState<KopSuratOption>(profile.kopSurat || "maleo");
  const [honorIncludeTransport, setHonorIncludeTransport] = useState<boolean>(false);
  const [honorRecipientMode, setHonorRecipientMode] = useState<RecipientMode>("MANUAL");
  const [honorIncludeKwitansi, setHonorIncludeKwitansi] = useState<boolean>(true);
  const [honorIncludeInvoice, setHonorIncludeInvoice] = useState<boolean>(false);
  const [honorInvoiceNo, setHonorInvoiceNo] = useState<string>("");
  const [honorInvoicePpnPct, setHonorInvoicePpnPct] = useState<number>(0);
  const [honorDitagihkanKepada, setHonorDitagihkanKepada] = useState<string>(
    "Yayasan Maleo Talenta Cendekia"
  );

  // State khusus SLIP HONORARIUM (Format Resmi Yayasan Maleo — Korwil A.3, Tenaga Admin A.5 & Satuan)
  const [slipDraft, setSlipDraft] = useState<SlipHonorariumInput>(() => {
    const saved = evidenceDrafts["EVIDENCE_SLIP_HONORARIUM"];
    if (saved && typeof saved === "object" && "namaPenerima" in saved) {
      return saved as unknown as SlipHonorariumInput;
    }
    const [defaultKorwil] = buildMonthlyKorwilSlipHonorariumInputs(profile, "maleo", "2026-10");
    return (
      defaultKorwil || {
        kopSurat: "maleo",
        periode: "Oktober 2026",
        namaPenerima: profile.koordinatorWilayah || "Jully Tjindrawan, MBA",
        nomorDokumen: "SLIP.2026.10.31.002",
        peranJabatan: "Koordinator Wilayah 2",
        kegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
        tanggalKegiatan: "Bulan Oktober 2026",
        tanggalBayar: "2026-10-31",
        npwpNik: "-",
        rekening: "-",
        components: [
          {
            komponen: "Honorarium",
            qty: "12 jam (1 bulan)",
            pendapatan: 10800000,
            potongan: 0,
            keterangan: "Koordinator Wilayah: 1 Orang × 12 jam × Rp900.000/jam",
          },
          { komponen: "Tambahan honorarium", qty: "-", pendapatan: 0, potongan: 0, keterangan: "-" },
          { komponen: "Pajak / potongan lainnya", qty: "-", pendapatan: 0, potongan: 0, keterangan: "-" },
        ],
        catatan: "Pagu RAB A.3: 1 Orang × 12 jam × 3,5 bulan × Rp900.000 = Rp37.800.000",
        disiapkanOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
      }
    );
  });
  const [slipBulkMonth, setSlipBulkMonth] = useState<string>("2026-10");
  const [honorTanggalCetak, setHonorTanggalCetak] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [customHonorRowsByKey, setCustomHonorRowsByKey] = useState<
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
      if (meta.type === "HONOR_FASIL_BULANAN" || meta.type === "SEWA_RUMAH" || meta.type === "SLIP_HONORARIUM") continue;
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

  // Build honor sheet untuk bulan terpilih (Mode RAB Satuan Rp5.729.876/lokasi atau Realisasi Real/JP DB)
  const rabUnitHonorSheet = useMemo(
    () => buildMonthlyRabUnitHonorReceipt(honorMonth, rekaps, fasilitators),
    [honorMonth, rekaps, fasilitators]
  );

  const dbHonorSheet = useMemo(
    () => buildMonthlyFacilitatorHonorReceipt(rekaps, honorMonth),
    [rekaps, honorMonth]
  );

  const honorStateKey = `${honorPricingMode}:${honorMonth}`;

  const activeHonorRows: MonthlyHonorReceiptRow[] = useMemo(() => {
    if (customHonorRowsByKey[honorStateKey]) {
      return customHonorRowsByKey[honorStateKey];
    }
    const savedKey = `EVIDENCE_HONOR_FASIL_${honorPricingMode}_${honorMonth}`;
    const saved = evidenceDrafts[savedKey];
    if (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)) {
      return (saved as { rows: MonthlyHonorReceiptRow[] }).rows;
    }
    if (honorPricingMode === "REAL_JP") {
      const legacySaved = evidenceDrafts[`EVIDENCE_HONOR_FASIL_${honorMonth}`];
      if (legacySaved && Array.isArray((legacySaved as { rows?: MonthlyHonorReceiptRow[] }).rows)) {
        return (legacySaved as { rows: MonthlyHonorReceiptRow[] }).rows;
      }
      return dbHonorSheet.rows;
    }
    return rabUnitHonorSheet.rows;
  }, [
    customHonorRowsByKey,
    honorStateKey,
    evidenceDrafts,
    honorPricingMode,
    honorMonth,
    dbHonorSheet.rows,
    rabUnitHonorSheet.rows,
  ]);

  const activeHonorSheet = useMemo(() => {
    return {
      monthKey: honorMonth,
      monthLabel: getMonthLabelId(honorMonth),
      pricingMode: honorPricingMode,
      rows: activeHonorRows,
      totalJpIntra: activeHonorRows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
      totalJpEkstra: activeHonorRows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
      totalJP: activeHonorRows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
      totalHonor: activeHonorRows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
      totalTransport: activeHonorRows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
    };
  }, [honorMonth, honorPricingMode, activeHonorRows]);

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
        templateCode = `EVIDENCE_HONOR_FASIL_${honorPricingMode}_${honorMonth}`;
        periodKey = honorMonth;
        content = { pricingMode: honorPricingMode, rows: activeHonorRows, tanggalCetak: honorTanggalCetak };
      } else if (activeType === "SEWA_RUMAH") {
        content = sewaDraft as unknown as Record<string, unknown>;
      } else if (activeType === "SLIP_HONORARIUM") {
        content = slipDraft as unknown as Record<string, unknown>;
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
        fasilitators,
        kopSuratOverride: honorKopSurat,
        includeTransportColumn: honorIncludeTransport,
        recipientMode: honorRecipientMode,
        tanggalCetak: honorTanggalCetak,
        includeIndividualKwitansi: honorIncludeKwitansi,
        includeInvoice: honorIncludeInvoice,
        invoiceNo: honorInvoiceNo,
        ppnPct: honorInvoicePpnPct,
        ditagihkanKepada: honorDitagihkanKepada,
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

    if (activeType === "SLIP_HONORARIUM") {
      const html = renderSlipHonorariumPdfDocumentHtml(
        [{ ...slipDraft, profile }],
        `Slip Honorarium — ${slipDraft.namaPenerima || slipDraft.periode}`
      );
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

  // Indeks transaksi APPROVED per kode RAB dari database untuk mendeteksi status checklist "Sudah Masuk RAB"
  const approvedExpensesByRabCode = useMemo(() => {
    const map = new Map<string, SntExpenseRecord[]>();
    for (const cat of categories || []) {
      for (const item of cat.items || []) {
        const codeKey = (item.code || "").trim().toLowerCase();
        const existing = map.get(codeKey) || [];
        const approved = (item.expenses || []).filter((e) => !e.status || e.status === "APPROVED");
        map.set(codeKey, [...existing, ...approved]);
      }
    }
    return map;
  }, [categories]);

  const checkHonorRowRecorded = (row: MonthlyHonorReceiptRow, monthKey: string) => {
    const localKey = `honor:${recordTargetType}:${monthKey}:${row.id}`;
    const list = (approvedExpensesByRabCode.get("4") || []).filter(
      (e) => normalizeExpenseRealizationType(e.realizationType) === recordTargetType
    );
    const monthLabelLower = getMonthLabelId(monthKey).toLowerCase();
    const lokasiLower = (row.lokasi || "").trim().toLowerCase();
    const matches = list.filter((e) => {
      const desc = (e.description || "").toLowerCase();
      return (
        lokasiLower.length > 0 &&
        desc.includes(lokasiLower) &&
        (desc.includes(monthLabelLower) || desc.includes(monthKey.toLowerCase()))
      );
    });
    const localRec = newlyRecordedMap[localKey];
    const count = Math.max(matches.length, localRec ? 1 : 0);
    const noKwitansi =
      (matches[0] ? getValidKwitansiNumber(matches[0]) : null) || localRec?.noKwitansi || null;
    return { isRecorded: count > 0, count, noKwitansi, localKey };
  };

  const checkGenericLineRecorded = (
    rabCode: string,
    rowId: string,
    description: string,
    amount: number
  ) => {
    const codeKey = (rabCode || "").trim().toLowerCase();
    const localKey = `gen:${recordTargetType}:${codeKey}:${rowId}`;
    const list = (approvedExpensesByRabCode.get(codeKey) || []).filter(
      (e) => normalizeExpenseRealizationType(e.realizationType) === recordTargetType
    );
    const descNorm = (description || "").trim().toLowerCase();
    const matches = list.filter((e) => {
      const expDesc = (e.description || "").trim().toLowerCase();
      return descNorm.length > 0 && expDesc === descNorm && Math.abs((Number(e.amount) || 0) - amount) < 1;
    });
    const localRec = newlyRecordedMap[localKey];
    const count = Math.max(matches.length, localRec ? 1 : 0);
    const noKwitansi =
      (matches[0] ? getValidKwitansiNumber(matches[0]) : null) || localRec?.noKwitansi || null;
    return { isRecorded: count > 0, count, noKwitansi, localKey };
  };

  const handleRecordLineToRab = async (
    rowKey: string,
    rabCode: string,
    date: string,
    description: string,
    amount: number,
    options?: { dedupeTokens?: string[]; localRecordKey?: string }
  ) => {
    if (amount <= 0) {
      setBanner({ type: "err", text: "Nominal harus lebih dari Rp 0 untuk dicatat ke RAB." });
      return;
    }
    if (
      !confirm(
        `Catat transaksi sebesar ${formatCurrency(amount)} ("${description}") ke Pos RAB ${rabCode} sebagai [${recordTargetType === "PELAPORAN" ? "PELAPORAN TEMPLATE — tidak menggandakan jurnal kas" : "REAL — kas aktual"}] (status APPROVED + auto buat nomor Kwitansi resmi)?`
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
        realizationType: recordTargetType,
        dedupeTokens: options?.dedupeTokens,
      });
      if (!res.success) {
        if ("duplicate" in res && res.duplicate && options?.localRecordKey) {
          setNewlyRecordedMap((prev) => ({
            ...prev,
            [options.localRecordKey as string]: {
              noKwitansi: "existingNoKwitansi" in res ? res.existingNoKwitansi : null,
              realizationType: recordTargetType,
            },
          }));
        }
        setBanner({ type: "err", text: res.error || "Gagal mencatat ke Realisasi RAB." });
        return;
      }
      if (options?.localRecordKey) {
        setNewlyRecordedMap((prev) => ({
          ...prev,
          [options.localRecordKey as string]: {
            noKwitansi: res.noKwitansi,
            realizationType: recordTargetType,
          },
        }));
      }
      setBanner({
        type: "ok",
        text: `Berhasil mencatat ke Pos RAB ${rabCode} sebagai ${recordTargetType} (${formatCurrency(amount)})${res.noKwitansi ? ` dengan Kwitansi ${res.noKwitansi}` : ""}.`,
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
          {EVIDENCE_DOC_CATALOG.length} Dokumen Bukti Wajib (Template 13)
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
              <div
                className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-semibold"
                title="Tag yang digunakan saat klik tombol + RAB"
              >
                <span className="px-1.5 text-[10px] text-slate-400">+RAB:</span>
                <button
                  type="button"
                  onClick={() => setRecordTargetType("PELAPORAN")}
                  className={`px-2 py-1 rounded ${
                    recordTargetType === "PELAPORAN"
                      ? "bg-blue-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Pelaporan
                </button>
                <button
                  type="button"
                  onClick={() => setRecordTargetType("REAL")}
                  className={`px-2 py-1 rounded ${
                    recordTargetType === "REAL"
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Real Kas
                </button>
              </div>
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
                {/* Switch Mode Perhitungan: Standar RAB Rp5.729.876/lokasi vs Realisasi Real/JP DB */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="text-xs">
                    <div className="font-bold text-emerald-950">Mode Perhitungan Honor Fasilitator (Pos A.4):</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      {honorPricingMode === "RAB_SATUAN"
                        ? `Harga Satuan RAB = ${formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE)}/lokasi/bln (6 lokasi = ${formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE * 6)}/bln). Lokasi dengan 2 fasilitator dikosongkan default — pilih dari dropdown atau biarkan kosong untuk blanko kwitansi.`
                        : "Menarik realisasi aktual per fasilitator & harga satuan real/JP dari Rekap Honorarium DB."}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHonorPricingMode("RAB_SATUAN")}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        honorPricingMode === "RAB_SATUAN"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Standar RAB (Rp5.729.876 / Lokasi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHonorPricingMode("REAL_JP")}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        honorPricingMode === "REAL_JP"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Realisasi Real / JP (Rekap DB)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kop Surat PDF</label>
                    <select
                      value={honorKopSurat}
                      onChange={(e) => setHonorKopSurat(e.target.value as KopSuratOption)}
                      className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold"
                    >
                      {KOP_OPTIONS_LIST.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Tanda Terima &amp; Kwitansi</label>
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
                        const freshRows =
                          honorPricingMode === "RAB_SATUAN" ? rabUnitHonorSheet.rows : dbHonorSheet.rows;
                        setCustomHonorRowsByKey((prev) => ({
                          ...prev,
                          [honorStateKey]: freshRows,
                        }));
                        setBanner({
                          type: "ok",
                          text:
                            honorPricingMode === "RAB_SATUAN"
                              ? `Daftar ${getMonthLabelId(honorMonth)} direset ke 6 lokasi standar RAB (${formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE)}/lokasi).`
                              : `Data ${getMonthLabelId(honorMonth)} disegarkan dari Rekap Honorarium (${dbHonorSheet.rows.length} fasilitator).`,
                        });
                      }}
                      className="text-xs h-9 bg-white gap-1 flex-1"
                    >
                      <Download className="w-3.5 h-3.5" /> {honorPricingMode === "RAB_SATUAN" ? "Reset 6 Lokasi" : "Muat Rekap DB"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const cleared = activeHonorRows.map((r) => ({ ...r, nama: "" }));
                        setCustomHonorRowsByKey((prev) => ({
                          ...prev,
                          [honorStateKey]: cleared,
                        }));
                        setBanner({
                          type: "ok",
                          text: "Semua nama fasilitator dikosongkan (akan tercetak blanko titik-titik pada Daftar Tanda Terima & Kwitansi).",
                        });
                      }}
                      className="text-xs h-9 bg-white gap-1 text-amber-800 border-amber-300 hover:bg-amber-50"
                      title="Kosongkan semua nama penerima di daftar & kwitansi"
                    >
                      <UserX className="w-3.5 h-3.5" /> Kosongkan Semua
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-900">
                    <input
                      type="checkbox"
                      checked={honorIncludeInvoice}
                      onChange={(e) => setHonorIncludeInvoice(e.target.checked)}
                    />
                    <span>Cetak INVOICE Resmi (per bulan)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-900">
                    <input
                      type="checkbox"
                      checked={honorIncludeKwitansi}
                      onChange={(e) => setHonorIncludeKwitansi(e.target.checked)}
                    />
                    <span>Lampirkan Slip Honorarium per baris (auto profil fasil)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honorRecipientMode === "BLANK"}
                      onChange={(e) => setHonorRecipientMode(e.target.checked ? "BLANK" : "MANUAL")}
                    />
                    <span>Paksa kosongkan semua nama saat cetak</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honorIncludeTransport}
                      onChange={(e) => setHonorIncludeTransport(e.target.checked)}
                    />
                    <span>Sertakan info kolom Transport</span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const monthInputs = SNT_HONOR_MONTH_OPTIONS.map((m) => {
                        const key = `${honorPricingMode}:${m.key}`;
                        const savedKey = `EVIDENCE_HONOR_FASIL_${honorPricingMode}_${m.key}`;
                        const saved = evidenceDrafts[savedKey];
                        const rows =
                          customHonorRowsByKey[key] ||
                          (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)
                            ? (saved as { rows: MonthlyHonorReceiptRow[] }).rows
                            : honorPricingMode === "RAB_SATUAN"
                              ? buildMonthlyRabUnitHonorReceipt(m.key, rekaps, fasilitators).rows
                              : buildMonthlyFacilitatorHonorReceipt(rekaps, m.key).rows);
                        return {
                          sheet: {
                            monthKey: m.key,
                            monthLabel: m.label,
                            pricingMode: honorPricingMode,
                            rows,
                            totalJpIntra: rows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
                            totalJpEkstra: rows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
                            totalJP: rows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
                            totalHonor: rows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
                            totalTransport: rows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
                          },
                          profile,
                          fasilitators,
                          kopSuratOverride: honorKopSurat,
                          includeTransportColumn: honorIncludeTransport,
                          recipientMode: honorRecipientMode,
                          tanggalCetak: m.defaultDate,
                          includeIndividualKwitansi: honorIncludeKwitansi,
                          includeInvoice: honorIncludeInvoice,
                          ppnPct: honorInvoicePpnPct,
                          ditagihkanKepada: honorDitagihkanKepada,
                        };
                      });
                      openHtmlWindow(renderMultiMonthFacilitatorHonorPdfHtml(monthInputs));
                    }}
                    className="ml-auto bg-white border-blue-300 text-blue-800 hover:bg-blue-50 text-[11px] h-7 gap-1"
                  >
                    <Printer className="w-3 h-3" /> Cetak Sekaligus 4 Bulan (Sep–Des)
                  </Button>
                </div>

                {honorIncludeInvoice && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-lg border border-blue-200 bg-blue-50/40 p-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        No. Invoice (Kosong = Otomatis per Bulan)
                      </label>
                      <Input
                        value={honorInvoiceNo}
                        onChange={(e) => setHonorInvoiceNo(e.target.value)}
                        placeholder={`INV/MTC/SNT-W2-A4/.../${honorMonth}`}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Ditagihkan Kepada
                      </label>
                      <Input
                        value={honorDitagihkanKepada}
                        onChange={(e) => setHonorDitagihkanKepada(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">PPN (%)</label>
                      <select
                        value={honorInvoicePpnPct}
                        onChange={(e) => setHonorInvoicePpnPct(Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value={0}>0% (Non-PPN)</option>
                        <option value={11}>11% (PPN)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Status Ringkasan Pencatatan Masuk RAB untuk Bulan Terpilih */}
                {(() => {
                  const statuses = activeHonorRows.map((r) => checkHonorRowRecorded(r, honorMonth));
                  const recordedCount = statuses.filter((s) => s.isRecorded).length;
                  const duplicateCount = statuses.filter((s) => s.count > 1).length;
                  return (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                        duplicateCount > 0
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : recordedCount > 0
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            duplicateCount > 0
                              ? "text-amber-600"
                              : recordedCount > 0
                                ? "text-emerald-600"
                                : "text-slate-400"
                          }`}
                        />
                        <span>
                          Status Masuk RAB ({getMonthLabelId(honorMonth)} · Mode{" "}
                          <strong>{recordTargetType === "PELAPORAN" ? "Pelaporan" : "Real Kas"}</strong>):{" "}
                          <strong>
                            {recordedCount}/{activeHonorRows.length} Lokasi Sudah Tercatat
                          </strong>
                        </span>
                      </div>
                      {duplicateCount > 0 && (
                        <span className="text-[11px] font-semibold text-amber-800">
                          ⚠ Terdeteksi {duplicateCount} lokasi tercatat &gt;1x (cek &amp; hapus duplikat di Pengeluaran Lapangan)
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b text-slate-700">
                      {honorPricingMode === "RAB_SATUAN" ? (
                        <tr>
                          <th className="py-2 px-2">Lokasi SNT &amp; Pilihan Nama Fasilitator (Daftar &amp; Kwitansi)</th>
                          <th className="py-2 px-2 text-center">Satuan</th>
                          <th className="py-2 px-2 text-right">Harga Satuan (Rp)</th>
                          <th className="py-2 px-2 text-right">Total Honor</th>
                          <th className="py-2 px-2 text-center">Aksi</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-2 px-2">Fasilitator &amp; Lokasi</th>
                          <th className="py-2 px-2 text-center">JP Intra</th>
                          <th className="py-2 px-2 text-center">JP Ekstra</th>
                          <th className="py-2 px-2 text-center">Total JP</th>
                          <th className="py-2 px-2 text-right">Harga Satuan Real/JP</th>
                          <th className="py-2 px-2 text-right">Total Honor</th>
                          <th className="py-2 px-2 w-10"></th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y bg-white">
                      {activeHonorRows.length === 0 ? (
                        <tr>
                          <td colSpan={honorPricingMode === "RAB_SATUAN" ? 5 : 7} className="py-6 text-center text-slate-500">
                            Belum ada data honorarium untuk {getMonthLabelId(honorMonth)}. Klik tombol &ldquo;+ Tambah Baris Manual&rdquo; untuk menyiapkan daftar bulan ini.
                          </td>
                        </tr>
                      ) : (
                        activeHonorRows.map((row, idx) => {
                          const locId = row.locationId || matchWilayah2LocationId(row.lokasi);
                          const localFasils = fasilitators.filter(
                            (f) => locId && matchWilayah2LocationId(f.lokasiSNT) === locId
                          );
                          const otherFasils = fasilitators.filter(
                            (f) => !locId || matchWilayah2LocationId(f.lokasiSNT) !== locId
                          );
                          const isSelectedInDb = fasilitators.some((f) => f.namaLengkap === row.nama);

                          const updateRow = (patch: Partial<MonthlyHonorReceiptRow>) => {
                            const next = [...activeHonorRows];
                            const merged = { ...row, ...patch };
                            if (honorPricingMode === "RAB_SATUAN") {
                              if (patch.hargaSatuanReal !== undefined && patch.totalHonor === undefined) {
                                merged.totalHonor = Number(patch.hargaSatuanReal) || 0;
                              } else if (patch.totalHonor !== undefined && patch.hargaSatuanReal === undefined) {
                                merged.hargaSatuanReal = Number(patch.totalHonor) || 0;
                              }
                            } else {
                              merged.totalJP = (Number(merged.jpIntra) || 0) + (Number(merged.jpEkstra) || 0);
                              if (patch.jpIntra !== undefined || patch.jpEkstra !== undefined || patch.hargaSatuanReal !== undefined) {
                                merged.totalHonor = merged.totalJP * (Number(merged.hargaSatuanReal) || 0);
                              } else if (patch.totalHonor !== undefined && merged.totalJP > 0) {
                                merged.hargaSatuanReal = Math.round((Number(patch.totalHonor) || 0) / merged.totalJP);
                              }
                            }
                            next[idx] = merged;
                            setCustomHonorRowsByKey((prev) => ({ ...prev, [honorStateKey]: next }));
                          };

                          const facilitatorSelectorCell = (
                            <td className="py-2 px-2 space-y-1.5 min-w-[240px]">
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  value={row.lokasi}
                                  onChange={(e) => updateRow({ lokasi: e.target.value })}
                                  className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                                  placeholder="Lokasi SNT..."
                                />
                                {honorPricingMode === "RAB_SATUAN" && (
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                      locId === "tidore"
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}
                                  >
                                    {locId === "tidore" ? "1 Fasil" : `${Math.max(2, localFasils.length)} Fasil`}
                                  </span>
                                )}
                              </div>
                              <select
                                value={row.nama === "" ? "" : isSelectedInDb ? row.nama : "__CUSTOM__"}
                                onChange={(e) => {
                                  if (e.target.value === "__CUSTOM__") return;
                                  updateRow({ nama: e.target.value });
                                }}
                                className={`w-full h-8 px-2 rounded border text-xs font-medium ${
                                  row.nama === ""
                                    ? "bg-amber-50/70 border-amber-300 text-amber-900"
                                    : "bg-white border-slate-200 text-slate-900"
                                }`}
                              >
                                <option value="">— Kosongkan Nama (Blanko ......) —</option>
                                {localFasils.length > 0 && (
                                  <optgroup label={`Fasilitator ${row.lokasi}`}>
                                    {localFasils.map((f) => (
                                      <option key={f.id} value={f.namaLengkap}>
                                        {f.namaLengkap}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {otherFasils.length > 0 && (
                                  <optgroup label="Fasilitator Lokasi Lainnya">
                                    {otherFasils.map((f) => (
                                      <option key={f.id} value={f.namaLengkap}>
                                        {f.namaLengkap} ({f.lokasiSNT})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {row.nama !== "" && !isSelectedInDb && (
                                  <option value="__CUSTOM__">Manual: {row.nama}</option>
                                )}
                              </select>
                              <input
                                type="text"
                                value={row.nama}
                                onChange={(e) => updateRow({ nama: e.target.value })}
                                placeholder="Kosong (garis titik-titik) atau ketik nama manual..."
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-600"
                              />
                            </td>
                          );

                          if (honorPricingMode === "RAB_SATUAN") {
                            const recStatus = checkHonorRowRecorded(row, honorMonth);
                            return (
                              <tr key={row.id || idx} className={recStatus.isRecorded ? "bg-emerald-50/30" : ""}>
                                {facilitatorSelectorCell}
                                <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                  <span className="font-semibold text-slate-700">1 Bulan</span>
                                  {row.totalJP > 0 && (
                                    <div className="text-[10px] text-slate-400">({row.totalJP} JP tercatat)</div>
                                  )}
                                </td>
                                <td className="py-1.5 px-1 text-right">
                                  <input
                                    type="number"
                                    value={row.hargaSatuanReal}
                                    onChange={(e) => updateRow({ hargaSatuanReal: Number(e.target.value) || 0 })}
                                    className="w-28 border rounded px-1.5 py-1 text-right text-xs"
                                  />
                                </td>
                                <td className="py-1.5 px-1 text-right">
                                  <input
                                    type="number"
                                    value={row.totalHonor}
                                    onChange={(e) => updateRow({ totalHonor: Number(e.target.value) || 0 })}
                                    className="w-28 border rounded px-1.5 py-1 text-right text-xs font-semibold text-emerald-900"
                                  />
                                </td>
                                <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    {recStatus.isRecorded ? (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${
                                          recStatus.count > 1
                                            ? "bg-amber-50 text-amber-800 border-amber-300"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                        }`}
                                        title={
                                          recStatus.count > 1
                                            ? `Tercatat ${recStatus.count}x di RAB Pos A.4 (${recordTargetType})${recStatus.noKwitansi ? ` · ${recStatus.noKwitansi}` : ""}. Hapus duplikat di Pengeluaran Lapangan.`
                                            : `Sudah masuk RAB Pos A.4 (${recordTargetType})${recStatus.noKwitansi ? ` · ${recStatus.noKwitansi}` : ""}. Terkunci agar tidak terklik 2x.`
                                        }
                                      >
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        {recStatus.count > 1 ? `${recStatus.count}x di RAB` : "Masuk RAB"}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={recordingId === row.id || row.totalHonor <= 0}
                                        onClick={() =>
                                          handleRecordLineToRab(
                                            row.id,
                                            "4",
                                            honorTanggalCetak,
                                            `Honorarium Fasilitator ${row.lokasi} (${row.nama || "Fasilitator SNT"}) - ${getMonthLabelId(honorMonth)}`,
                                            row.totalHonor,
                                            {
                                              dedupeTokens: [row.lokasi, getMonthLabelId(honorMonth)],
                                              localRecordKey: recStatus.localKey,
                                            }
                                          )
                                        }
                                        className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold disabled:opacity-40"
                                        title={`Catat honor ${getMonthLabelId(honorMonth)} ke Pos RAB A.4 (${recordTargetType})`}
                                      >
                                        {recordingId === row.id ? "..." : "+ RAB"}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = activeHonorRows.filter((_, i) => i !== idx);
                                        setCustomHonorRowsByKey((prev) => ({ ...prev, [honorStateKey]: next }));
                                      }}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                      title="Hapus baris"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={row.id || idx}>
                              {facilitatorSelectorCell}
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
                                    setCustomHonorRowsByKey((prev) => ({ ...prev, [honorStateKey]: next }));
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
                      {honorPricingMode === "RAB_SATUAN" ? (
                        <tr>
                          <td colSpan={3} className="py-2 px-2">
                            TOTAL ({activeHonorRows.length} Lokasi × {formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE)})
                          </td>
                          <td className="py-2 px-2 text-right text-blue-800 whitespace-nowrap">
                            {formatCurrency(activeHonorSheet.totalHonor)}
                          </td>
                          <td></td>
                        </tr>
                      ) : (
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
                      )}
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
                          jpIntra: honorPricingMode === "RAB_SATUAN" ? 0 : 32,
                          jpEkstra: honorPricingMode === "RAB_SATUAN" ? 0 : 16,
                          totalJP: honorPricingMode === "RAB_SATUAN" ? 0 : 48,
                          hargaSatuanReal: honorPricingMode === "RAB_SATUAN" ? SNT_RAB_HONOR_FASIL_UNIT_PRICE : 65000,
                          totalHonor: honorPricingMode === "RAB_SATUAN" ? SNT_RAB_HONOR_FASIL_UNIT_PRICE : 3120000,
                          totalTransport: 0,
                          status: "MANUAL",
                        },
                      ];
                      setCustomHonorRowsByKey((prev) => ({ ...prev, [honorStateKey]: next }));
                    }}
                    className="text-xs bg-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Manual
                  </Button>
                  <span className="text-[11px] text-slate-500">
                    {honorPricingMode === "RAB_SATUAN"
                      ? `Standar RAB A.4: Rp5.729.876/lokasi/bln × 6 lokasi × 4 bln = Rp137.517.024.`
                      : "Tips: Tarif real JP umum = Rp65.000/JP (otomatis terhitung dari Honor / Total JP)."}
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
                  {(() => {
                    const sewaDesc = `Bantuan Sewa Rumah Fasilitator ${sewaDraft.lokasiSnt} (${sewaDraft.jumlahBulan} bln)`;
                    const sewaAmount = sewaDraft.jumlahBulan * sewaDraft.tarifPerBulan;
                    const sewaRec = checkGenericLineRecorded("3b", `sewa-${sewaDraft.lokasiSnt}`, sewaDesc, sewaAmount);
                    if (sewaRec.isRecorded) {
                      return (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold"
                          title={`Sudah tercatat pada Pos RAB 3b (${recordTargetType})${sewaRec.noKwitansi ? ` · ${sewaRec.noKwitansi}` : ""}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sudah Masuk RAB (Pos 3b)
                        </span>
                      );
                    }
                    return (
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
                            sewaDesc,
                            sewaAmount,
                            {
                              dedupeTokens: [sewaDraft.lokasiSnt, "sewa rumah"],
                              localRecordKey: sewaRec.localKey,
                            }
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
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ==================== 2B. SLIP HONORARIUM BULANAN KORWIL (A.3), TENAGA ADMIN (A.5) & SATUAN ==================== */}
            {activeType === "SLIP_HONORARIUM" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-teal-950">
                        Slip Honorarium Bulanan Sesuai RAB — Pos A.3 (Korwil) &amp; Pos A.5 (Tenaga Administrasi)
                      </div>
                      <p className="text-[11px] text-teal-800/80">
                        Format resmi Yayasan Maleo (#0DA7A0). Pilih bulan untuk muat ke editor atau cetak langsung per bulan / seluruh periode 3,5 bulan (Sep–Des 2026).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={slipBulkMonth}
                        onChange={(e) => setSlipBulkMonth(e.target.value)}
                        className="h-8 px-2.5 rounded-md border border-teal-300 bg-white text-xs font-semibold text-teal-950"
                      >
                        {SNT_HONOR_MONTH_OPTIONS.map((m) => (
                          <option key={m.key} value={m.key}>
                            Bulan: {m.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={slipDraft.kopSurat}
                        onChange={(e) =>
                          setSlipDraft((p) => ({ ...p, kopSurat: e.target.value as KopSuratOption }))
                        }
                        className="h-8 px-2.5 rounded-md border border-teal-300 bg-white text-xs font-semibold text-teal-950"
                      >
                        {KOP_OPTIONS_LIST.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            Kop: {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2 Kartu Cetak Per Bulan Sesuai RAB: Pos A.3 Koordinator Wilayah & Pos A.5 Tenaga Administrasi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-teal-200/70">
                    {/* Kartu Pos A.3 — Koordinator Wilayah */}
                    <div className="rounded-lg border border-teal-300 bg-white p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-teal-950">Pos A.3 — Koordinator Wilayah</div>
                          <div className="text-[11px] text-slate-600">
                            RAB: 1 Orang × 12 jam × 3,5 bln × Rp900.000 = <strong>Rp37.800.000</strong>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0 bg-teal-100 text-teal-900">
                          3,5 Bln
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {SNT_KORWIL_MONTHLY_SCHEDULE.map((m) => {
                          const isSelected = m.key === slipBulkMonth;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => {
                                setSlipBulkMonth(m.key);
                                const [korwilSlip] = buildMonthlyKorwilSlipHonorariumInputs(
                                  profile,
                                  slipDraft.kopSurat,
                                  m.key,
                                  {
                                    namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                      ? slipDraft.namaPenerima
                                      : undefined,
                                    npwpNik: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                      ? slipDraft.npwpNik
                                      : undefined,
                                    rekening: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                      ? slipDraft.rekening
                                      : undefined,
                                    disiapkanOleh: slipDraft.disiapkanOleh,
                                  }
                                );
                                if (korwilSlip) {
                                  setSlipDraft(korwilSlip);
                                  setBanner({
                                    type: "ok",
                                    text: `Slip Korwil (A.3 · ${korwilSlip.periode}: ${korwilSlip.components[0]?.qty} × Rp900.000 = ${formatCurrency(korwilSlip.components[0]?.pendapatan || 0)}) dimuat ke editor.`,
                                  });
                                }
                              }}
                              className={`text-left px-2 py-1 rounded border transition-colors ${
                                isSelected
                                  ? "bg-teal-50 border-teal-400 text-teal-950 font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50/50"
                              }`}
                            >
                              <div>{m.label.replace(" 2026", "")} · {m.jam} jam</div>
                              <div className="text-[10px] text-teal-800">{formatCurrency(m.nominal)}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const slips = buildMonthlyKorwilSlipHonorariumInputs(
                              profile,
                              slipDraft.kopSurat,
                              slipBulkMonth,
                              {
                                namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.namaPenerima
                                  : undefined,
                                npwpNik: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.npwpNik
                                  : undefined,
                                rekening: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.rekening
                                  : undefined,
                                disiapkanOleh: slipDraft.disiapkanOleh,
                              }
                            );
                            openHtmlWindow(
                              renderSlipHonorariumPdfDocumentHtml(
                                slips,
                                `Slip Honorarium Koordinator Wilayah — ${getMonthLabelId(slipBulkMonth)}`
                              )
                            );
                          }}
                          className="bg-white border-teal-400 text-teal-900 hover:bg-teal-50 text-[11px] h-8 gap-1 flex-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak {getMonthLabelId(slipBulkMonth).replace(" 2026", "")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const slips = buildMonthlyKorwilSlipHonorariumInputs(
                              profile,
                              slipDraft.kopSurat,
                              undefined,
                              {
                                namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.namaPenerima
                                  : undefined,
                                npwpNik: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.npwpNik
                                  : undefined,
                                rekening: slipDraft.peranJabatan.toLowerCase().includes("koordinator")
                                  ? slipDraft.rekening
                                  : undefined,
                                disiapkanOleh: slipDraft.disiapkanOleh,
                              }
                            );
                            openHtmlWindow(
                              renderSlipHonorariumPdfDocumentHtml(
                                slips,
                                "Slip Honorarium Koordinator Wilayah — 3,5 Bulan (Sep–Des 2026)"
                              )
                            );
                          }}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] h-8 gap-1 flex-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak 3,5 Bln (Sep–Des)
                        </Button>
                      </div>
                    </div>

                    {/* Kartu Pos A.5 — Tenaga Administrasi */}
                    <div className="rounded-lg border border-emerald-300 bg-white p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-emerald-950">Pos A.5 — Tenaga Administrasi</div>
                          <div className="text-[11px] text-slate-600">
                            RAB: 1 Orang × 3,5 bln × Rp5.729.876 = <strong>Rp20.054.566</strong>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0 bg-emerald-100 text-emerald-900">
                          3,5 Bln
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {SNT_TENAGA_ADMIN_MONTHLY_SCHEDULE.map((m) => {
                          const isSelected = m.key === slipBulkMonth;
                          const blnShort = m.bulanFraction === 0.5 ? "0,5 bln" : "1 bln";
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => {
                                setSlipBulkMonth(m.key);
                                const [adminSlip] = buildMonthlyTenagaAdminSlipHonorariumInputs(
                                  profile,
                                  slipDraft.kopSurat,
                                  m.key,
                                  {
                                    namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                      ? slipDraft.namaPenerima
                                      : undefined,
                                    npwpNik: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                      ? slipDraft.npwpNik
                                      : undefined,
                                    rekening: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                      ? slipDraft.rekening
                                      : undefined,
                                    disiapkanOleh: slipDraft.disiapkanOleh,
                                  }
                                );
                                if (adminSlip) {
                                  setSlipDraft(adminSlip);
                                  setBanner({
                                    type: "ok",
                                    text: `Slip Tenaga Administrasi (A.5 · ${adminSlip.periode}: ${adminSlip.components[0]?.qty} × Rp5.729.876 = ${formatCurrency(adminSlip.components[0]?.pendapatan || 0)}) dimuat ke editor.`,
                                  });
                                }
                              }}
                              className={`text-left px-2 py-1 rounded border transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50/50"
                              }`}
                            >
                              <div>{m.label.replace(" 2026", "")} · {blnShort}</div>
                              <div className="text-[10px] text-emerald-800">{formatCurrency(m.nominal)}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const slips = buildMonthlyTenagaAdminSlipHonorariumInputs(
                              profile,
                              slipDraft.kopSurat,
                              slipBulkMonth,
                              {
                                namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.namaPenerima
                                  : undefined,
                                npwpNik: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.npwpNik
                                  : undefined,
                                rekening: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.rekening
                                  : undefined,
                                disiapkanOleh: slipDraft.disiapkanOleh,
                              }
                            );
                            openHtmlWindow(
                              renderSlipHonorariumPdfDocumentHtml(
                                slips,
                                `Slip Honorarium Tenaga Administrasi — ${getMonthLabelId(slipBulkMonth)}`
                              )
                            );
                          }}
                          className="bg-white border-emerald-400 text-emerald-900 hover:bg-emerald-50 text-[11px] h-8 gap-1 flex-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak {getMonthLabelId(slipBulkMonth).replace(" 2026", "")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const slips = buildMonthlyTenagaAdminSlipHonorariumInputs(
                              profile,
                              slipDraft.kopSurat,
                              undefined,
                              {
                                namaPenerima: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.namaPenerima
                                  : undefined,
                                npwpNik: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.npwpNik
                                  : undefined,
                                rekening: slipDraft.peranJabatan.toLowerCase().includes("administrasi")
                                  ? slipDraft.rekening
                                  : undefined,
                                disiapkanOleh: slipDraft.disiapkanOleh,
                              }
                            );
                            openHtmlWindow(
                              renderSlipHonorariumPdfDocumentHtml(
                                slips,
                                "Slip Honorarium Tenaga Administrasi — 3,5 Bulan (Sep–Des 2026)"
                              )
                            );
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] h-8 gap-1 flex-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak 3,5 Bln (Sep–Des)
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Utilitas Slip Satuan Custom + Akses Cepat Menu Honor Fasilitator (Pos A.4) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-200/70">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const f = fasilitators.find((x) => x.id === e.target.value);
                          if (!f) return;
                          const bankStr = [f.bankName, f.bankAccount].filter(Boolean).join(" — ");
                          setSlipDraft((p) => ({
                            ...p,
                            namaPenerima: f.namaLengkap,
                            peranJabatan: resolvePersonnelRoleFromRab("4", undefined, f.lokasiSNT || "Wilayah 2"),
                            kegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
                            npwpNik: f.npwpNik || p.npwpNik,
                            rekening: bankStr || p.rekening,
                          }));
                          setBanner({
                            type: "ok",
                            text: `Data ${f.namaLengkap} (NPWP/NIK & Rekening) dimuat ke editor slip satuan.`,
                          });
                        }}
                        className="h-8 px-2.5 rounded-md border border-teal-300 bg-white text-xs font-medium min-w-[220px]"
                      >
                        <option value="">-- Slip Satuan: Tarik Profil Fasil DB --</option>
                        {fasilitators.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.namaLengkap} ({f.lokasiSNT || "Wilayah 2"})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setSlipDraft((p) => ({
                            ...p,
                            peranJabatan: "Pembina Kompetisi KKA & Robotika (Pos B.6a)",
                            kegiatan: DEFAULT_SLIP_KEGIATAN_LABEL,
                            components: [
                              { komponen: "Honorarium", qty: "24 Pertemuan", pendapatan: 16800000, potongan: 0, keterangan: "24 pertemuan × Rp700.000 (Tahap I 80%)" },
                              { komponen: "Tambahan honorarium", qty: "-", pendapatan: 0, potongan: 0, keterangan: "" },
                              { komponen: "Pajak / potongan lainnya", qty: "-", pendapatan: 0, potongan: 0, keterangan: "" },
                            ],
                          }))
                        }
                        className="px-2 py-1 rounded bg-white hover:bg-teal-100 border border-teal-300 text-teal-900 font-semibold text-[11px]"
                      >
                        Preset B.6a Kompetisi (Rp16,8 jt)
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveType("HONOR_FASIL_BULANAN")}
                      className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline"
                    >
                      Honor Fasilitator 6 Lokasi (Pos A.4) → Buka Menu Bulanan
                    </button>
                  </div>
                </div>

                {/* Form Identitas Slip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Periode</label>
                    <Input
                      value={slipDraft.periode}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, periode: e.target.value }))}
                      placeholder="Oktober 2026"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Nomor Dokumen</label>
                      <button
                        type="button"
                        onClick={async () => {
                          const totalNet = slipDraft.components.reduce(
                            (s, c) => s + (Number(c.pendapatan) || 0) - (Number(c.potongan) || 0),
                            0
                          );
                          const res = await allocateOfficialDocNumberForEvidence({
                            kind: "KW",
                            entityCode: resolveEntityCodeFromKop(slipDraft.kopSurat),
                            date: slipDraft.tanggalBayar || new Date().toISOString().slice(0, 10),
                            perihal: `Slip Honorarium ${slipDraft.namaPenerima || slipDraft.peranJabatan} (${slipDraft.periode})`,
                            nominal: Math.max(0, totalNet),
                          });
                          if (!res.success || !("docNumber" in res)) {
                            setBanner({ type: "err", text: ("error" in res && res.error) || "Gagal mengambil nomor." });
                            return;
                          }
                          setSlipDraft((p) => ({ ...p, nomorDokumen: res.docNumber }));
                          setBanner({ type: "ok", text: `Nomor resmi terdaftar: ${res.docNumber}` });
                          router.refresh();
                        }}
                        className="text-[10px] font-bold text-teal-700 hover:underline"
                      >
                        + Ambil No. Resmi
                      </button>
                    </div>
                    <Input
                      value={slipDraft.nomorDokumen}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, nomorDokumen: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Penerima</label>
                    <Input
                      value={slipDraft.namaPenerima}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, namaPenerima: e.target.value }))}
                      placeholder="Nama lengkap..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Peran / Jabatan</label>
                    <Input
                      value={slipDraft.peranJabatan}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, peranJabatan: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Kegiatan</label>
                    <Input
                      value={slipDraft.kegiatan}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, kegiatan: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Kegiatan</label>
                    <Input
                      value={slipDraft.tanggalKegiatan}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, tanggalKegiatan: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Bayar</label>
                    <Input
                      type="date"
                      value={slipDraft.tanggalBayar}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, tanggalBayar: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPWP / NIK</label>
                    <Input
                      value={slipDraft.npwpNik}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, npwpNik: e.target.value }))}
                      placeholder="NIK / NPWP penerima..."
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Rekening (Bank &amp; Nomor)</label>
                    <Input
                      value={slipDraft.rekening}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, rekening: e.target.value }))}
                      placeholder="BRI / BCA / Mandiri — No. Rekening"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Disiapkan oleh (Admin)</label>
                    <Input
                      value={slipDraft.disiapkanOleh || ""}
                      onChange={(e) => setSlipDraft((p) => ({ ...p, disiapkanOleh: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Tabel Komponen Pendapatan & Potongan */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-teal-700 text-white">
                      <tr>
                        <th className="py-2 px-3">Komponen</th>
                        <th className="py-2 px-2 w-24 text-center">Qty</th>
                        <th className="py-2 px-2 w-36 text-right">Pendapatan (Rp)</th>
                        <th className="py-2 px-2 w-36 text-right">Potongan (Rp)</th>
                        <th className="py-2 px-2">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {slipDraft.components.map((comp, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2">
                            <Input
                              value={comp.komponen}
                              onChange={(e) =>
                                setSlipDraft((p) => ({
                                  ...p,
                                  components: p.components.map((c, i) =>
                                    i === idx ? { ...c, komponen: e.target.value } : c
                                  ),
                                }))
                              }
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={comp.qty}
                              onChange={(e) =>
                                setSlipDraft((p) => ({
                                  ...p,
                                  components: p.components.map((c, i) =>
                                    i === idx ? { ...c, qty: e.target.value } : c
                                  ),
                                }))
                              }
                              className="h-7 text-xs text-center"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              value={comp.pendapatan}
                              onChange={(e) =>
                                setSlipDraft((p) => ({
                                  ...p,
                                  components: p.components.map((c, i) =>
                                    i === idx ? { ...c, pendapatan: Number(e.target.value) || 0 } : c
                                  ),
                                }))
                              }
                              className="h-7 text-xs text-right"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              value={comp.potongan}
                              onChange={(e) =>
                                setSlipDraft((p) => ({
                                  ...p,
                                  components: p.components.map((c, i) =>
                                    i === idx ? { ...c, potongan: Number(e.target.value) || 0 } : c
                                  ),
                                }))
                              }
                              className="h-7 text-xs text-right"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={comp.keterangan}
                              onChange={(e) =>
                                setSlipDraft((p) => ({
                                  ...p,
                                  components: p.components.map((c, i) =>
                                    i === idx ? { ...c, keterangan: e.target.value } : c
                                  ),
                                }))
                              }
                              className="h-7 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-teal-50 border-t-2 border-teal-200 font-bold">
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-right text-teal-950">
                          HONORARIUM BERSIH DITERIMA:
                        </td>
                        <td className="py-2 px-2 text-right text-teal-800">
                          {formatCurrency(
                            slipDraft.components.reduce((s, c) => s + (Number(c.pendapatan) || 0), 0)
                          )}
                        </td>
                        <td className="py-2 px-2 text-right text-rose-700">
                          {formatCurrency(
                            slipDraft.components.reduce((s, c) => s + (Number(c.potongan) || 0), 0)
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-sm text-teal-900">
                          {formatCurrency(
                            Math.max(
                              0,
                              slipDraft.components.reduce(
                                (s, c) => s + (Number(c.pendapatan) || 0) - (Number(c.potongan) || 0),
                                0
                              )
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                  <Input
                    value={slipDraft.catatan || ""}
                    onChange={(e) => setSlipDraft((p) => ({ ...p, catatan: e.target.value }))}
                    placeholder="Catatan tambahan (opsional)..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {/* ==================== 3. INVOICE MITRA & 8 DOKUMEN BUKTI WAJIB LAINNYA ==================== */}
            {activeType !== "HONOR_FASIL_BULANAN" && activeType !== "SEWA_RUMAH" && activeType !== "SLIP_HONORARIUM" && (
              <div className="space-y-4">
                {/* Preset 1-Klik 10 Paket Tahap I / Mockup Drive (LPD, Robotic Explorer & Maleo) */}
                {activeType === "INVOICE_KUITANSI_MITRA" && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-indigo-950">
                          Preset 1-Klik Paket Tahap I &amp; Mockup Drive (Kop LPD, Robotic Explorer &amp; Maleo)
                        </div>
                        <p className="text-[11px] text-indigo-800/80">
                          Klik salah satu paket di bawah untuk mengisi otomatis Invoice, Kuitansi &amp; Daftar Tanda Terima sesuai Target Realisasi Tahap I (tanpa label MOCKUP saat dicetak).
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {DRIVE_MOCKUP_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            const built = buildDraftFromDriveMockupPreset(
                              preset.id as DriveMockupPresetId,
                              profile
                            );
                            updateGenericDraft(() => built);
                            setGenericIncludeKwitansi(true);
                            setBanner({
                              type: "ok",
                              text: `Preset "${preset.badge} — ${preset.title}" (${formatCurrency(preset.totalAmount)}) dimuat dengan Kop ${preset.kopSurat === "lpd" ? "LPD Jully Tjindrawan Robotik" : preset.kopSurat === "maleo" ? "Yayasan Maleo Talenta Cendekia" : "Robotic Explorer"}.`,
                            });
                          }}
                          className="text-left p-2.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                preset.kopSurat === "lpd"
                                  ? "bg-slate-900 text-white"
                                  : preset.kopSurat === "maleo"
                                    ? "bg-emerald-700 text-white"
                                    : "bg-sky-600 text-white"
                              }`}
                            >
                              {preset.badge}
                            </span>
                            <span className="text-[11px] font-bold text-slate-900">
                              {formatCurrency(preset.totalAmount)}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                            {preset.title}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{preset.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Pilihan Kop Surat & Opsi Cetak Dokumen */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kop Surat Dokumen</label>
                    <select
                      value={currentGenericDraft.kopSurat || profile.kopSurat}
                      onChange={(e) => {
                        const nextKop = e.target.value as KopSuratOption;
                        const theme = resolveBrandKopTheme(nextKop, profile);
                        updateGenericDraft((p) => ({
                          ...p,
                          kopSurat: nextKop,
                          bankName: p.bankName || theme.defaultBankName,
                          bankAccount: p.bankAccount || theme.defaultBankAccount,
                          bankHolder: p.bankHolder || theme.defaultBankHolder,
                        }));
                      }}
                      className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold"
                    >
                      {KOP_OPTIONS_LIST.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(activeType === "HONOR_TIM" || activeType === "INVOICE_KUITANSI_MITRA") && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pos RAB Target</label>
                      <select
                        value={currentGenericDraft.rabCode}
                        onChange={(e) => {
                          const nextCode = e.target.value;
                          if (activeType === "HONOR_TIM") {
                            const preset = getHonorTimPresetByRabCode(nextCode, currentGenericDraft.tanggalDokumen);
                            updateGenericDraft((p) => ({
                              ...p,
                              rabCode: nextCode,
                              items: preset.length > 0 ? preset : p.items,
                            }));
                            if (nextCode === "5") {
                              setBanner({
                                type: "ok",
                                text: `Preset Tenaga Administrasi (Pos A.5) dimuat: 3,5 bulan × ${formatCurrency(SNT_RAB_TENAGA_ADMIN_UNIT_PRICE)} = Rp20.054.566 (Sep–Nov 1 bln, Des 0,5 bln).`,
                              });
                            }
                          } else {
                            updateGenericDraft((p) => ({ ...p, rabCode: nextCode }));
                          }
                        }}
                        className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold"
                      >
                        <option value="1">A.1 — Ketua Tim Pelaksana (Rp3,6 jt/bln)</option>
                        <option value="2">A.2 — Tim Program Koding KA Robotika</option>
                        <option value="3">A.3 — Koordinator Wilayah (3,5 bln · Rp37,8 jt)</option>
                        <option value="5">A.5 — Tenaga Administrasi (3,5 bln · Rp20,05 jt)</option>
                        <option value="1a">B.1a — Laporan Pendahuluan</option>
                        <option value="1b">B.1b — Laporan Bulanan</option>
                        <option value="1c">B.1c — Laporan Akhir</option>
                        <option value="4a">B.4a — Pelatihan In / Narasumber</option>
                        <option value="4b">B.4b — Sertifikasi STEM.org</option>
                        <option value="6a">B.6a — Pembinaan Kompetisi</option>
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

                {/* Panel Cetak Per Bulan khusus A.3, A.5 & Dokumen Bulanan (Invoice + Tanda Terima + Kuitansi) */}
                {(activeType === "INVOICE_KUITANSI_MITRA" || activeType === "HONOR_TIM") && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-emerald-950">
                          Cetak Per Bulan (Invoice, Daftar Tanda Terima &amp; Slip Honorarium — Pos A.3 &amp; A.5)
                        </div>
                        <p className="text-[11px] text-emerald-800/80">
                          Pilih bulan tertentu atau &ldquo;Pisah Per Bulan&rdquo; agar setiap bulan tercetak 1 paket lengkap tersendiri.
                        </p>
                      </div>
                      <select
                        value={currentGenericDraft.monthlyPrintFilter || "ALL"}
                        onChange={(e) =>
                          updateGenericDraft((p) => ({
                            ...p,
                            monthlyPrintFilter: e.target.value as MonthlyPrintFilter,
                          }))
                        }
                        className="h-8 px-2.5 rounded-md border border-emerald-300 bg-white text-xs font-semibold text-emerald-950 min-w-[210px]"
                      >
                        <option value="ALL">Gabungan / Semua Baris</option>
                        <option value="SPLIT_EACH_MONTH">Pisah Paket Per Bulan (Sep, Okt, Nov, Des)</option>
                        {SNT_HONOR_MONTH_OPTIONS.map((m) => (
                          <option key={m.key} value={m.key}>
                            Cetak Khusus {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-200/70">
                      <span className="text-[11px] font-semibold text-emerald-900 mr-1">Isi Rincian Per Bulan:</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateGenericDraft(() => buildMonthlyPersonnelDraft("3", "RAB_4_BULAN", profile));
                          setGenericIncludeKwitansi(true);
                          setBanner({
                            type: "ok",
                            text: "Rincian bulanan Pos A.3 (Korwil · 3,5 bln: Sep–Nov 12 jam @Rp10,8 jt + Des 6 jam Rp5,4 jt = Rp37.800.000) siap dicetak per bulan (Invoice + Tanda Terima + Slip Honorarium).",
                          });
                        }}
                        className="px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold"
                      >
                        A.3 Per Bulan RAB (3,5 bln = Rp37,8 jt)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateGenericDraft(() => buildMonthlyPersonnelDraft("3", "LPD_3_BULAN", profile));
                          setGenericIncludeKwitansi(true);
                          setBanner({
                            type: "ok",
                            text: "Rincian bulanan Pos A.3 Simulasi LPD (3 bln × Rp10.672.941 = Rp32.018.823) siap dicetak per bulan.",
                          });
                        }}
                        className="px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold"
                      >
                        A.3 Per Bulan LPD (3× Rp10,67 jt)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateGenericDraft(() => buildMonthlyPersonnelDraft("5", "RAB_4_BULAN", profile));
                          setGenericIncludeKwitansi(true);
                          setBanner({
                            type: "ok",
                            text: "Rincian bulanan Pos A.5 (Tenaga Admin · 3,5 bln: Sep–Nov 1 bln @Rp5.729.876 + Des 0,5 bln Rp2.864.938 = Rp20.054.566) siap dicetak per bulan (Invoice + Tanda Terima + Slip Honorarium).",
                          });
                        }}
                        className="px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold"
                      >
                        A.5 Per Bulan RAB (3,5 bln = Rp20,05 jt)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateGenericDraft(() => buildMonthlyPersonnelDraft("5", "LPD_3_BULAN", profile));
                          setGenericIncludeKwitansi(true);
                          setBanner({
                            type: "ok",
                            text: "Rincian bulanan Pos A.5 Simulasi LPD (3 bln = Rp9.987.397) siap dicetak per bulan.",
                          });
                        }}
                        className="px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold"
                      >
                        A.5 Per Bulan LPD (3 bln = Rp9,98 jt)
                      </button>
                    </div>
                  </div>
                )}

                {/* Sakelar Output Cetak: Invoice, Daftar Tanda Terima, Kuitansi, Kode RAB, PPh */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-900">
                    <input
                      type="checkbox"
                      checked={Boolean(currentGenericDraft.includeInvoice)}
                      onChange={(e) =>
                        updateGenericDraft((p) => ({ ...p, includeInvoice: e.target.checked }))
                      }
                    />
                    <span>Cetak INVOICE Resmi</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={currentGenericDraft.includeDaftarTandaTerima ?? !currentGenericDraft.includeInvoice}
                      onChange={(e) =>
                        updateGenericDraft((p) => ({
                          ...p,
                          includeDaftarTandaTerima: e.target.checked,
                        }))
                      }
                    />
                    <span>Cetak Daftar Tanda Terima</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={genericIncludeKwitansi}
                      onChange={(e) => setGenericIncludeKwitansi(e.target.checked)}
                    />
                    <span>
                      {isSlipHonorariumRabCode(currentGenericDraft.rabCode, currentGenericDraft.judulDokumen)
                        ? "Cetak Slip Honorarium"
                        : "Cetak Kuitansi"}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentGenericDraft.showRabCode ?? true}
                      onChange={(e) =>
                        updateGenericDraft((p) => ({ ...p, showRabCode: e.target.checked }))
                      }
                    />
                    <span>Tampilkan Kode RAB</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(currentGenericDraft.includePphColumn)}
                      onChange={(e) =>
                        updateGenericDraft((p) => ({ ...p, includePphColumn: e.target.checked }))
                      }
                    />
                    <span>Kolom PPh % (Neto)</span>
                  </label>
                  {currentGenericDraft.includePphColumn && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-slate-600">Tarif PPh (%):</span>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={currentGenericDraft.pphPct ?? 0}
                        onChange={(e) =>
                          updateGenericDraft((p) => ({ ...p, pphPct: Number(e.target.value) || 0 }))
                        }
                        className="w-16 h-7 px-1.5 border rounded bg-white text-xs text-center font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Pengaturan Khusus INVOICE (tampil bila Cetak INVOICE Resmi dicentang) */}
                {currentGenericDraft.includeInvoice && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5 space-y-2.5 text-xs">
                    <div className="font-bold text-blue-950">Pengaturan INVOICE Resmi &amp; Rekening Transfer</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-slate-700">No. Invoice</label>
                          <button
                            type="button"
                            onClick={async () => {
                              const activeKop = currentGenericDraft.kopSurat || profile.kopSurat;
                              const entityCode = resolveEntityCodeFromKop(activeKop);
                              const totalAmt = currentGenericDraft.items.reduce(
                                (s, it) => s + (Number(it.nominal) || 0),
                                0
                              );
                              const res = await allocateOfficialDocNumberForEvidence({
                                kind: "INV",
                                entityCode,
                                date: currentGenericDraft.tanggalDokumen,
                                perihal: currentGenericDraft.judulDokumen,
                                nominal: totalAmt,
                              });
                              if (!res.success || !("docNumber" in res)) {
                                setBanner({
                                  type: "err",
                                  text: ("error" in res && res.error) || "Gagal mengambil nomor invoice resmi.",
                                });
                                return;
                              }
                              updateGenericDraft((p) => ({ ...p, invoiceNo: res.docNumber }));
                              setBanner({
                                type: "ok",
                                text: `Nomor Invoice resmi terdaftar di Buku Register: ${res.docNumber}`,
                              });
                              router.refresh();
                            }}
                            className="text-[10px] font-bold text-blue-700 hover:underline"
                          >
                            + Ambil No. Resmi
                          </button>
                        </div>
                        <Input
                          value={currentGenericDraft.invoiceNo || ""}
                          onChange={(e) => updateGenericDraft((p) => ({ ...p, invoiceNo: e.target.value }))}
                          placeholder="INV/LPD/SNT-W2/001/XI/2026"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-slate-700">No. Kuitansi</label>
                          <button
                            type="button"
                            onClick={async () => {
                              const activeKop = currentGenericDraft.kopSurat || profile.kopSurat;
                              const entityCode = resolveEntityCodeFromKop(activeKop);
                              const totalAmt = currentGenericDraft.items.reduce(
                                (s, it) => s + (Number(it.nominal) || 0),
                                0
                              );
                              const res = await allocateOfficialDocNumberForEvidence({
                                kind: "KW",
                                entityCode,
                                date: currentGenericDraft.tanggalDokumen,
                                perihal: currentGenericDraft.judulDokumen,
                                nominal: totalAmt,
                              });
                              if (!res.success || !("docNumber" in res)) {
                                setBanner({
                                  type: "err",
                                  text: ("error" in res && res.error) || "Gagal mengambil nomor kuitansi resmi.",
                                });
                                return;
                              }
                              updateGenericDraft((p) => ({ ...p, kuitansiNoPrefix: res.docNumber }));
                              setBanner({
                                type: "ok",
                                text: `Nomor Kuitansi resmi terdaftar di Buku Register: ${res.docNumber}`,
                              });
                              router.refresh();
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:underline"
                          >
                            + Ambil No. Resmi
                          </button>
                        </div>
                        <Input
                          value={currentGenericDraft.kuitansiNoPrefix || ""}
                          onChange={(e) =>
                            updateGenericDraft((p) => ({ ...p, kuitansiNoPrefix: e.target.value }))
                          }
                          placeholder="KW/LPD/SNT-W2/001/XI/2026"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Jatuh Tempo</label>
                        <Input
                          type="date"
                          value={currentGenericDraft.jatuhTempo || ""}
                          onChange={(e) => updateGenericDraft((p) => ({ ...p, jatuhTempo: e.target.value }))}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">PPN (%)</label>
                        <select
                          value={currentGenericDraft.ppnPct ?? 0}
                          onChange={(e) =>
                            updateGenericDraft((p) => ({ ...p, ppnPct: Number(e.target.value) || 0 }))
                          }
                          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs font-semibold"
                        >
                          <option value={0}>0% (Non-PPN)</option>
                          <option value={11}>11% (PPN)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Ditagihkan Kepada</label>
                        <Input
                          value={currentGenericDraft.ditagihkanKepada || "Yayasan Maleo Talenta Cendekia"}
                          onChange={(e) =>
                            updateGenericDraft((p) => ({
                              ...p,
                              ditagihkanKepada: e.target.value,
                              sudahTerimaDari: e.target.value,
                            }))
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Label Kode RAB</label>
                        <Input
                          value={currentGenericDraft.rabCodeLabel || currentGenericDraft.rabCode}
                          onChange={(e) =>
                            updateGenericDraft((p) => ({ ...p, rabCodeLabel: e.target.value }))
                          }
                          placeholder="A.3 / B.4a / B.1a, B.1b, B.1c"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Penandatangan</label>
                        <Input
                          value={currentGenericDraft.signerName || profile.ketuaTimPelaksana}
                          onChange={(e) =>
                            updateGenericDraft((p) => ({ ...p, signerName: e.target.value }))
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Bank Transfer</label>
                        <Input
                          value={currentGenericDraft.bankName ?? ""}
                          onChange={(e) => updateGenericDraft((p) => ({ ...p, bankName: e.target.value }))}
                          placeholder="BCA / Mandiri..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">No. Rekening</label>
                        <Input
                          value={currentGenericDraft.bankAccount ?? ""}
                          onChange={(e) => updateGenericDraft((p) => ({ ...p, bankAccount: e.target.value }))}
                          placeholder="7040827000"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Atas Nama Rekening</label>
                        <Input
                          value={currentGenericDraft.bankHolder ?? ""}
                          onChange={(e) => updateGenericDraft((p) => ({ ...p, bankHolder: e.target.value }))}
                          placeholder="PT Jully Tjindrawan Robotik"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                    {activeType === "HONOR_TIM" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const preset = getHonorTimPresetByRabCode(
                            currentGenericDraft.rabCode,
                            currentGenericDraft.tanggalDokumen
                          );
                          if (preset.length > 0) {
                            updateGenericDraft((p) => ({ ...p, items: preset }));
                            setBanner({
                              type: "ok",
                              text: `Preset RAB Pos ${currentGenericDraft.rabCode} dimuat (${preset.length} baris).`,
                            });
                          }
                        }}
                        className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs h-8 gap-1"
                      >
                        Muat Preset RAB Pos {currentGenericDraft.rabCode}
                      </Button>
                    )}
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
                    <span>
                      {isSlipHonorariumRabCode(currentGenericDraft.rabCode, currentGenericDraft.judulDokumen)
                        ? "Sertakan Slip Honorarium tiap baris"
                        : "Sertakan lembar Kwitansi tiap baris"}
                    </span>
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
                                {(() => {
                                  const lineDesc = it.uraian || activeMeta.shortTitle;
                                  const lineRec = checkGenericLineRecorded(
                                    currentGenericDraft.rabCode,
                                    it.id,
                                    lineDesc,
                                    it.nominal
                                  );
                                  if (lineRec.isRecorded) {
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${
                                          lineRec.count > 1
                                            ? "bg-amber-50 text-amber-800 border-amber-300"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                        }`}
                                        title={`Sudah masuk Pos RAB ${currentGenericDraft.rabCode} (${recordTargetType})${lineRec.noKwitansi ? ` · ${lineRec.noKwitansi}` : ""}. Terkunci agar tidak terklik 2x.`}
                                      >
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        {lineRec.count > 1 ? `${lineRec.count}x` : "Masuk RAB"}
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      type="button"
                                      disabled={recordingId === it.id || it.nominal <= 0}
                                      onClick={() =>
                                        handleRecordLineToRab(
                                          it.id,
                                          currentGenericDraft.rabCode,
                                          it.tanggal,
                                          lineDesc,
                                          it.nominal,
                                          { localRecordKey: lineRec.localKey }
                                        )
                                      }
                                      className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold disabled:opacity-40"
                                      title={`Catat baris ini ke Realisasi Pos RAB ${currentGenericDraft.rabCode}`}
                                    >
                                      {recordingId === it.id ? "..." : "+ RAB"}
                                    </button>
                                  );
                                })()}
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
