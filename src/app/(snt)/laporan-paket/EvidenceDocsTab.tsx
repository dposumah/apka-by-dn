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
  UserX,
  UserCheck,
  Search,
  Sparkles,
  RotateCcw,
  Paperclip,
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
import { formatKwitansiNumber, resolveEntityCodeFromKop } from "@/lib/snt-doc-numbering";
import {
  buildMonthlyFacilitatorHonorReceipt,
  buildMonthlyRabUnitHonorReceipt,
  DEFAULT_SNT_ADMIN_PROFILE,
  DEFAULT_SNT_KORWIL_PROFILE,
  EvidenceLineItem,
  GenericEvidenceDraft,
  getDefaultSewaRumahDraft,
  getMonthLabelId,
  HonorPricingMode,
  matchWilayah2LocationId,
  MonthlyHonorReceiptRow,
  MonthlyPrintFilter,
  RecipientMode,
  SewaRumahContractDraft,
  SNT_HONOR_MONTH_OPTIONS,
  SNT_RAB_HONOR_FASIL_UNIT_PRICE,
} from "@/lib/snt-evidence-docs";
import {
  buildDefaultRabPosDraft,
  buildRealExpenseLineItems,
  buildTahap1RabPosDraft,
  getRabPosMeta,
  isKorwilRealExpensePos,
  RAB_POS_CATALOG,
  RabPosCode,
} from "@/lib/snt-rab-pos-catalog";
import { getExpenseReceiptUrls, normalizeReceiptUrlList } from "@/lib/expense-receipts";
import {
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  DEFAULT_SLIP_KEGIATAN_LABEL,
  KOP_OPTIONS_LIST,
} from "@/lib/snt-brand-kop";
import {
  buildSewaRumahContractPageHtml,
  renderGenericEvidencePdfHtml,
  renderMonthlyFacilitatorHonorPdfHtml,
  renderMultiBundleGenericEvidencePdfHtml,
  renderMultiMonthFacilitatorHonorPdfHtml,
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
  activeRabCode: RabPosCode;
  onSelectRabCode: (code: RabPosCode) => void;
  profile: SntReportProfile;
  categories: SntRabCategoryRecord[];
  rekaps: SntRekapRecord[];
  fasilitators: SntFasilitatorRecord[];
  evidenceDrafts: Record<string, Record<string, unknown>>;
  onDraftSaved: (templateCode: string, periodKey: string, content: Record<string, unknown>) => void;
}

const HONOR_MONTHS = ["2026-09", "2026-10", "2026-11", "2026-12"] as const;

const TANDA_TERIMA_PAYER_OPTIONS = [
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  "Yayasan Maleo Talenta Cendekia",
] as const;

export function EvidenceDocsTab({
  activeRabCode,
  onSelectRabCode,
  profile,
  categories,
  rekaps,
  fasilitators,
  evidenceDrafts,
  onDraftSaved,
}: EvidenceDocsTabProps) {
  const router = useRouter();

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarGroup, setSidebarGroup] = useState<"ALL" | "A" | "B">("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [newlyRecordedMap, setNewlyRecordedMap] = useState<
    Record<string, { noKwitansi?: string | null }>
  >({});
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ==================== STATE POS A.4 (FASILITATOR — 6 LOKASI SNT) ====================
  const [a4Month, setA4Month] = useState<string>("2026-10");
  const [a4PrintMode, setA4PrintMode] = useState<"SINGLE_MONTH" | "SPLIT_ALL_MONTHS" | "COMBINED_ALL">("SINGLE_MONTH");
  const [a4PricingMode, setA4PricingMode] = useState<HonorPricingMode>("RAB_SATUAN");
  const [a4KopSurat, setA4KopSurat] = useState<KopSuratOption>("maleo");
  const [a4IncludeInvoice, setA4IncludeInvoice] = useState<boolean>(false);
  const [a4IncludeTandaTerima, setA4IncludeTandaTerima] = useState<boolean>(true);
  const [a4IncludeSlipGaji, setA4IncludeSlipGaji] = useState<boolean>(true);
  const [a4IncludeKwitansi, setA4IncludeKwitansi] = useState<boolean>(false);
  const [a4IncludeTransport, setA4IncludeTransport] = useState<boolean>(false);
  const [a4RecipientMode, setA4RecipientMode] = useState<RecipientMode>("MANUAL");
  const [a4InvoiceNo, setA4InvoiceNo] = useState<string>("");
  const [a4InvoicePpnPct, setA4InvoicePpnPct] = useState<number>(0);
  const [a4DitagihkanKepada, setA4DitagihkanKepada] = useState<string>("Yayasan Maleo Talenta Cendekia");
  const [a4BankName, setA4BankName] = useState<string>(profile.lpdBankName || "");
  const [a4BankAccount, setA4BankAccount] = useState<string>(DEFAULT_SNT_KORWIL_PROFILE.rekening);
  const [a4BankHolder, setA4BankHolder] = useState<string>(DEFAULT_SNT_KORWIL_PROFILE.nama);
  const [a4DibayarkanOleh, setA4DibayarkanOleh] = useState<string>(DEFAULT_ROBOTIC_PREPARER_LABEL);
  const [a4TanggalCetak, setA4TanggalCetak] = useState<string>("2026-10-31");
  const [customA4RowsByKey, setCustomA4RowsByKey] = useState<Record<string, MonthlyHonorReceiptRow[]>>({});

  // ==================== STATE KHUSUS KONTRAK & PER LOKASI SEWA RUMAH (POS B.3b) ====================
  const [sewaIncludeKontrak, setSewaIncludeKontrak] = useState<boolean>(true);
  const [sewaLocationFilter, setSewaLocationFilter] = useState<string>("SPLIT_ALL_LOCATIONS");
  const [sewaDraftsByLoc, setSewaDraftsByLoc] = useState<Record<string, SewaRumahContractDraft>>(() => {
    const savedByLoc = evidenceDrafts["EVIDENCE_SEWA_RUMAH_BY_LOC"] as
      | Record<string, Partial<SewaRumahContractDraft>>
      | undefined;
    const legacySaved = evidenceDrafts["EVIDENCE_SEWA_RUMAH"] as
      | Partial<SewaRumahContractDraft>
      | undefined;
    const base = getDefaultSewaRumahDraft();
    const map: Record<string, SewaRumahContractDraft> = {};
    SNT_WILAYAH_2_LOCATIONS.forEach((loc, idx) => {
      const matchedFasil = fasilitators.find(
        (f) => matchWilayah2LocationId(f.lokasiSNT) === loc.id
      );
      const fromSaved = savedByLoc?.[loc.id];
      const fromLegacy =
        legacySaved && matchWilayah2LocationId(legacySaved.lokasiSnt) === loc.id
          ? legacySaved
          : undefined;
      map[loc.id] = {
        ...base,
        lokasiSnt: loc.label,
        nomorKontrak: `PKS-SEWA/SNT-W2/2026/${String(idx + 1).padStart(3, "0")}`,
        namaFasilitator: matchedFasil?.namaLengkap || "",
        ...(fromLegacy || {}),
        ...(fromSaved || {}),
      };
    });
    return map;
  });

  const activeSewaLocId = SNT_WILAYAH_2_LOCATIONS.some((l) => l.id === sewaLocationFilter)
    ? sewaLocationFilter
    : SNT_WILAYAH_2_LOCATIONS[0].id;
  const activeSewaDraft = sewaDraftsByLoc[activeSewaLocId] || getDefaultSewaRumahDraft();
  const updateActiveSewaDraft = (patch: Partial<SewaRumahContractDraft>) => {
    setSewaDraftsByLoc((prev) => ({
      ...prev,
      [activeSewaLocId]: { ...(prev[activeSewaLocId] || getDefaultSewaRumahDraft()), ...patch },
    }));
  };

  // ==================== INDEKS TRANSAKSI REAL & PELAPORAN DB PER KODE RAB ====================
  const realExpensesByRabCode = useMemo(() => {
    const map = new Map<string, SntExpenseRecord[]>();
    for (const cat of categories || []) {
      for (const item of cat.items || []) {
        const codeKey = (item.code || "").trim().toLowerCase();
        const existing = map.get(codeKey) || [];
        const realApproved = (item.expenses || []).filter(
          (e) =>
            (!e.status || e.status === "APPROVED") &&
            normalizeExpenseRealizationType(e.realizationType) === "REAL"
        );
        map.set(codeKey, [...existing, ...realApproved]);
      }
    }
    return map;
  }, [categories]);

  const pelaporanExpensesByRabCode = useMemo(() => {
    const map = new Map<string, SntExpenseRecord[]>();
    for (const cat of categories || []) {
      for (const item of cat.items || []) {
        const codeKey = (item.code || "").trim().toLowerCase();
        const existing = map.get(codeKey) || [];
        const pelaporanApproved = (item.expenses || []).filter(
          (e) =>
            (!e.status || e.status === "APPROVED") &&
            normalizeExpenseRealizationType(e.realizationType) === "PELAPORAN"
        );
        map.set(codeKey, [...existing, ...pelaporanApproved]);
      }
    }
    return map;
  }, [categories]);

  // ==================== STATE GENERIK UNTUK SEMUA POS RAB (23 POS) ====================
  const [posDrafts, setPosDrafts] = useState<Record<string, GenericEvidenceDraft>>(() => {
    const map: Record<string, GenericEvidenceDraft> = {};
    for (const meta of RAB_POS_CATALOG) {
      if (meta.code === "4") continue;
      const freshDefault = buildDefaultRabPosDraft(meta.code, profile);
      const isKorwilRealPos = isKorwilRealExpensePos(meta.code);
      const realList = realExpensesByRabCode.get(meta.code.toLowerCase()) || [];
      const realItems = isKorwilRealPos
        ? buildRealExpenseLineItems(realList, meta.shortTitle, DEFAULT_SNT_KORWIL_PROFILE.nama)
        : [];
      const defaultWithReal: GenericEvidenceDraft =
        isKorwilRealPos && realItems.length > 0
          ? {
              ...freshDefault,
              items: realItems,
              includeReceiptAttachments: true,
              recipientMode: "MANUAL",
              periodeLabel: "September – Desember 2026 (Data Pengeluaran Riil)",
            }
          : freshDefault;

      const saved = evidenceDrafts[`EVIDENCE_RAB_${meta.code}`];
      if (saved && typeof saved === "object" && Array.isArray((saved as Record<string, unknown>).items)) {
        const savedDraft = saved as unknown as GenericEvidenceDraft;
        // Auto-upgrade legacy B.3b draft (4 baris gabungan 6 lokasi) menjadi 24 baris per lokasi SNT
        const isLegacyCombinedSewa =
          meta.code === "3b" &&
          savedDraft.items.length <= 4 &&
          savedDraft.items.every((it) => !matchWilayah2LocationId(it.lokasi));
        // Auto-upgrade Pos B.2a (Tiket) & B.2c (Penginapan) ke data pengeluaran riil jika draft lama belum memuat transaksi riil
        const isLegacyGenericKorwilTravel =
          isKorwilRealPos &&
          realItems.length > 0 &&
          !savedDraft.items.some((it) => it.id.startsWith("real-") || (it.receiptUrls && it.receiptUrls.length > 0));

        const baseItems = isLegacyCombinedSewa
          ? freshDefault.items
          : isLegacyGenericKorwilTravel
            ? realItems
            : savedDraft.items.map((it) => {
                if (!isKorwilRealPos || !it.id.startsWith("real-")) return it;
                const live = realItems.find((r) => r.id === it.id);
                if (!live) return it;
                return {
                  ...it,
                  receiptUrls:
                    it.receiptUrls && it.receiptUrls.length > 0 ? it.receiptUrls : live.receiptUrls,
                };
              });

        const mergedDraft: GenericEvidenceDraft = {
          ...defaultWithReal,
          ...savedDraft,
          items: baseItems,
          includeReceiptAttachments:
            savedDraft.includeReceiptAttachments ?? (isKorwilRealPos ? true : defaultWithReal.includeReceiptAttachments),
        };
        // Pastikan default profil & tujuan rekening Korwil (dan Admin untuk A.5) terisi bila draft lama masih kosong/lama
        const isBlank = (v?: string) => !v || v.trim() === "" || v.trim() === "-";
        const isLegacyGenericBank =
          isBlank(mergedDraft.bankAccount) ||
          mergedDraft.bankHolder?.trim().toUpperCase() === "MALEO TALENTA CENDEKIA" ||
          mergedDraft.bankHolder?.trim().toLowerCase() === "lpd jully tjindrawan robotik";
        if (isLegacyGenericBank) {
          mergedDraft.bankName = freshDefault.bankName;
          mergedDraft.bankAccount = freshDefault.bankAccount;
          mergedDraft.bankHolder = freshDefault.bankHolder;
        }
        if (isBlank(mergedDraft.slipNamaPenerima) || (meta.code === "5" && mergedDraft.slipNamaPenerima?.toLowerCase().includes("bagian administrasi"))) {
          mergedDraft.slipNamaPenerima = freshDefault.slipNamaPenerima;
        }
        if (isBlank(mergedDraft.slipNpwpNik)) {
          mergedDraft.slipNpwpNik = freshDefault.slipNpwpNik;
        }
        if (isBlank(mergedDraft.slipRekening) || mergedDraft.slipRekening?.trim().toUpperCase() === "BANK MANDIRI") {
          mergedDraft.slipRekening = freshDefault.slipRekening;
        }
        if (meta.code === "3" || meta.code === "5") {
          mergedDraft.items = mergedDraft.items.map((it) => ({
            ...it,
            penerima: isBlank(it.penerima) ? mergedDraft.slipNamaPenerima || "" : it.penerima,
          }));
        }
        // Auto-upgrade nomor kwitansi format garis miring lama (KW/... atau KWT/...) ke format resmi KWT.YYYY.MM.DD.NNN
        if (mergedDraft.kuitansiNoPrefix && /^KWT?\//i.test(mergedDraft.kuitansiNoPrefix.trim())) {
          mergedDraft.kuitansiNoPrefix = formatKwitansiNumber(mergedDraft.tanggalDokumen, 1);
        }
        mergedDraft.items = mergedDraft.items.map((it, idx) =>
          it.noDokumen && /^KWT?\//i.test(it.noDokumen.trim())
            ? { ...it, noDokumen: formatKwitansiNumber(it.tanggal || mergedDraft.tanggalDokumen, idx + 1) }
            : it
        );
        map[meta.code] = mergedDraft;
      } else {
        map[meta.code] = defaultWithReal;
      }
    }
    return map;
  });

  const activeMeta = getRabPosMeta(activeRabCode);
  const currentDraft =
    posDrafts[activeRabCode] || buildDefaultRabPosDraft(activeRabCode, profile);

  const updateCurrentDraft = (updater: (prev: GenericEvidenceDraft) => GenericEvidenceDraft) => {
    setPosDrafts((prev) => ({
      ...prev,
      [activeRabCode]: updater(prev[activeRabCode] || buildDefaultRabPosDraft(activeRabCode, profile)),
    }));
  };

  // ==================== FILTER SIDEBAR 23 POS RAB ====================
  const filteredCatalog = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    return RAB_POS_CATALOG.filter((m) => {
      if (sidebarGroup !== "ALL" && m.group !== sidebarGroup) return false;
      if (!q) return true;
      return (
        m.displayCode.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.shortTitle.toLowerCase().includes(q) ||
        m.fullTitle.toLowerCase().includes(q)
      );
    });
  }, [sidebarSearch, sidebarGroup]);

  const catalogGroupA = filteredCatalog.filter((m) => m.group === "A");
  const catalogGroupB = filteredCatalog.filter((m) => m.group === "B");

  // ==================== COMPUTED POS A.4 (FASILITATOR) ====================
  const rabUnitA4Sheet = useMemo(
    () => buildMonthlyRabUnitHonorReceipt(a4Month, rekaps, fasilitators),
    [a4Month, rekaps, fasilitators]
  );
  const dbA4Sheet = useMemo(
    () => buildMonthlyFacilitatorHonorReceipt(rekaps, a4Month),
    [rekaps, a4Month]
  );
  const a4StateKey = `${a4PricingMode}:${a4Month}`;

  const activeA4Rows: MonthlyHonorReceiptRow[] = useMemo(() => {
    if (customA4RowsByKey[a4StateKey]) return customA4RowsByKey[a4StateKey];
    const savedKey = `EVIDENCE_HONOR_FASIL_${a4PricingMode}_${a4Month}`;
    const saved = evidenceDrafts[savedKey];
    if (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)) {
      return (saved as { rows: MonthlyHonorReceiptRow[] }).rows;
    }
    return a4PricingMode === "REAL_JP" ? dbA4Sheet.rows : rabUnitA4Sheet.rows;
  }, [customA4RowsByKey, a4StateKey, evidenceDrafts, a4PricingMode, a4Month, dbA4Sheet.rows, rabUnitA4Sheet.rows]);

  const activeA4Sheet = useMemo(
    () => ({
      monthKey: a4Month,
      monthLabel: getMonthLabelId(a4Month),
      pricingMode: a4PricingMode,
      rows: activeA4Rows,
      totalJpIntra: activeA4Rows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
      totalJpEkstra: activeA4Rows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
      totalJP: activeA4Rows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
      totalHonor: activeA4Rows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
      totalTransport: activeA4Rows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
    }),
    [a4Month, a4PricingMode, activeA4Rows]
  );

  // ==================== HELPERS ====================
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

  const checkA4RowRecorded = (row: MonthlyHonorReceiptRow, monthKey: string) => {
    const localKey = `honor:PELAPORAN:${monthKey}:${row.id}`;
    const list = pelaporanExpensesByRabCode.get("4") || [];
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
    const noKwitansi = (matches[0] ? getValidKwitansiNumber(matches[0]) : null) || localRec?.noKwitansi || null;
    return { isRecorded: count > 0, count, noKwitansi, localKey };
  };

  const checkGenericLineRecorded = (rabCode: string, rowId: string, description: string, amount: number) => {
    const codeKey = (rabCode || "").trim().toLowerCase();
    const localKey = `gen:PELAPORAN:${codeKey}:${rowId}`;
    const list = pelaporanExpensesByRabCode.get(codeKey) || [];
    const descNorm = (description || "").trim().toLowerCase();
    const matches = list.filter((e) => {
      const expDesc = (e.description || "").trim().toLowerCase();
      return descNorm.length > 0 && expDesc === descNorm && Math.abs((Number(e.amount) || 0) - amount) < 1;
    });
    const localRec = newlyRecordedMap[localKey];
    const count = Math.max(matches.length, localRec ? 1 : 0);
    const noKwitansi = (matches[0] ? getValidKwitansiNumber(matches[0]) : null) || localRec?.noKwitansi || null;
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
      setBanner({ type: "err", text: "Nominal harus lebih dari Rp 0 untuk dicatat ke Pelaporan RAB." });
      return;
    }
    if (
      !confirm(
        `Catat transaksi sebesar ${formatCurrency(amount)} ("${description}") ke Pos RAB ${activeMeta.displayCode} sebagai PELAPORAN (tidak mengubah transaksi Real Kas)?`
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
        kwitansiOwner: "Yayasan Maleo Talenta Cendekia",
        realizationType: "PELAPORAN",
        dedupeTokens: options?.dedupeTokens,
      });
      if (!res.success) {
        if ("duplicate" in res && res.duplicate && options?.localRecordKey) {
          setNewlyRecordedMap((prev) => ({
            ...prev,
            [options.localRecordKey as string]: {
              noKwitansi: "existingNoKwitansi" in res ? res.existingNoKwitansi : null,
            },
          }));
        }
        setBanner({ type: "err", text: res.error || "Gagal mencatat ke Pelaporan RAB." });
        return;
      }
      if (options?.localRecordKey) {
        setNewlyRecordedMap((prev) => ({
          ...prev,
          [options.localRecordKey as string]: { noKwitansi: res.noKwitansi },
        }));
      }
      setBanner({
        type: "ok",
        text: `Berhasil mencatat ke Pos ${activeMeta.displayCode} sebagai PELAPORAN (${formatCurrency(amount)})${res.noKwitansi ? ` · ${res.noKwitansi}` : ""}.`,
      });
      router.refresh();
    } finally {
      setRecordingId(null);
    }
  };

  const handleSaveCurrentDraft = async () => {
    setIsSaving(true);
    setBanner(null);
    try {
      if (activeRabCode === "4") {
        const templateCode = `EVIDENCE_HONOR_FASIL_${a4PricingMode}_${a4Month}`;
        const content = {
          pricingMode: a4PricingMode,
          rows: activeA4Rows,
          tanggalCetak: a4TanggalCetak,
        };
        const res = await saveSntReportDraft({
          templateCode,
          periodKey: a4Month,
          title: activeMeta.fullTitle,
          content,
        });
        if (!res.success) {
          setBanner({ type: "err", text: res.error || "Gagal menyimpan draft Pos A.4." });
          return;
        }
        onDraftSaved(templateCode, a4Month, content);
        setBanner({ type: "ok", text: `Draft Pos A.4 (${getMonthLabelId(a4Month)}) berhasil disimpan.` });
        return;
      }

      if (activeRabCode === "3b") {
        await saveSntReportDraft({
          templateCode: "EVIDENCE_SEWA_RUMAH_BY_LOC",
          periodKey: "DEFAULT",
          title: "Kontrak Sewa Rumah Fasilitator Per Lokasi SNT (B.3b)",
          content: sewaDraftsByLoc as unknown as Record<string, unknown>,
        });
        onDraftSaved(
          "EVIDENCE_SEWA_RUMAH_BY_LOC",
          "DEFAULT",
          sewaDraftsByLoc as unknown as Record<string, unknown>
        );
      }

      const templateCode = `EVIDENCE_RAB_${activeRabCode}`;
      const content = currentDraft as unknown as Record<string, unknown>;
      const res = await saveSntReportDraft({
        templateCode,
        periodKey: "DEFAULT",
        title: activeMeta.fullTitle,
        content,
      });
      if (!res.success) {
        setBanner({ type: "err", text: res.error || `Gagal menyimpan draft ${activeMeta.displayCode}.` });
        return;
      }
      onDraftSaved(templateCode, "DEFAULT", content);
      setBanner({ type: "ok", text: `Draft ${activeMeta.displayCode} (${activeMeta.shortTitle}) berhasil disimpan ke database.` });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintActivePos = () => {
    if (activeRabCode === "4") {
      if (!a4IncludeInvoice && !a4IncludeTandaTerima && !a4IncludeSlipGaji && !a4IncludeKwitansi) {
        setBanner({ type: "err", text: "Centang minimal 1 jenis dokumen (Invoice / Tanda Terima / Slip Gaji / Kwitansi) sebelum mencetak." });
        return;
      }
      if (a4PrintMode === "SINGLE_MONTH") {
        const html = renderMonthlyFacilitatorHonorPdfHtml({
          sheet: activeA4Sheet,
          profile,
          fasilitators,
          kopSuratOverride: a4KopSurat,
          includeTransportColumn: a4IncludeTransport,
          recipientMode: a4RecipientMode,
          tanggalCetak: a4TanggalCetak,
          includeInvoice: a4IncludeInvoice,
          includeTandaTerima: a4IncludeTandaTerima,
          includeSlipGaji: a4IncludeSlipGaji,
          includeKwitansi: a4IncludeKwitansi,
          dibayarkanOleh: a4DibayarkanOleh,
          invoiceNo: a4InvoiceNo,
          ppnPct: a4InvoicePpnPct,
          ditagihkanKepada: a4DitagihkanKepada,
          bankName: a4BankName,
          bankAccount: a4BankAccount,
          bankHolder: a4BankHolder,
        });
        openHtmlWindow(html);
        return;
      }
      if (a4PrintMode === "SPLIT_ALL_MONTHS") {
        const monthInputs = SNT_HONOR_MONTH_OPTIONS.map((m) => {
          const key = `${a4PricingMode}:${m.key}`;
          const saved = evidenceDrafts[`EVIDENCE_HONOR_FASIL_${a4PricingMode}_${m.key}`];
          const rows =
            customA4RowsByKey[key] ||
            (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)
              ? (saved as { rows: MonthlyHonorReceiptRow[] }).rows
              : a4PricingMode === "RAB_SATUAN"
                ? buildMonthlyRabUnitHonorReceipt(m.key, rekaps, fasilitators).rows
                : buildMonthlyFacilitatorHonorReceipt(rekaps, m.key).rows);
          return {
            sheet: {
              monthKey: m.key,
              monthLabel: m.label,
              pricingMode: a4PricingMode,
              rows,
              totalJpIntra: rows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
              totalJpEkstra: rows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
              totalJP: rows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
              totalHonor: rows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
              totalTransport: rows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
            },
            profile,
            fasilitators,
            kopSuratOverride: a4KopSurat,
            includeTransportColumn: a4IncludeTransport,
            recipientMode: a4RecipientMode,
            tanggalCetak: m.defaultDate,
            includeInvoice: a4IncludeInvoice,
            includeTandaTerima: a4IncludeTandaTerima,
            includeSlipGaji: a4IncludeSlipGaji,
            includeKwitansi: a4IncludeKwitansi,
            dibayarkanOleh: a4DibayarkanOleh,
            ppnPct: a4InvoicePpnPct,
            ditagihkanKepada: a4DitagihkanKepada,
            bankName: a4BankName,
            bankAccount: a4BankAccount,
            bankHolder: a4BankHolder,
          };
        });
        openHtmlWindow(renderMultiMonthFacilitatorHonorPdfHtml(monthInputs));
        return;
      }
      // COMBINED_ALL: gabungkan semua bulan Sep–Des menjadi 1 rekap gabungan
      const combinedRows: MonthlyHonorReceiptRow[] = [];
      for (const m of SNT_HONOR_MONTH_OPTIONS) {
        const key = `${a4PricingMode}:${m.key}`;
        const saved = evidenceDrafts[`EVIDENCE_HONOR_FASIL_${a4PricingMode}_${m.key}`];
        const rows =
          customA4RowsByKey[key] ||
          (saved && Array.isArray((saved as { rows?: MonthlyHonorReceiptRow[] }).rows)
            ? (saved as { rows: MonthlyHonorReceiptRow[] }).rows
            : a4PricingMode === "RAB_SATUAN"
              ? buildMonthlyRabUnitHonorReceipt(m.key, rekaps, fasilitators).rows
              : buildMonthlyFacilitatorHonorReceipt(rekaps, m.key).rows);
        for (const r of rows) {
          combinedRows.push({ ...r, lokasi: `${r.lokasi} (${m.short})` });
        }
      }
      openHtmlWindow(
        renderMonthlyFacilitatorHonorPdfHtml({
          sheet: {
            monthKey: "2026-09",
            monthLabel: "September – Desember 2026 (4 Bulan)",
            pricingMode: a4PricingMode,
            rows: combinedRows,
            totalJpIntra: combinedRows.reduce((s, r) => s + (Number(r.jpIntra) || 0), 0),
            totalJpEkstra: combinedRows.reduce((s, r) => s + (Number(r.jpEkstra) || 0), 0),
            totalJP: combinedRows.reduce((s, r) => s + (Number(r.totalJP) || 0), 0),
            totalHonor: combinedRows.reduce((s, r) => s + (Number(r.totalHonor) || 0), 0),
            totalTransport: combinedRows.reduce((s, r) => s + (Number(r.totalTransport) || 0), 0),
          },
          profile,
          fasilitators,
          kopSuratOverride: a4KopSurat,
          includeTransportColumn: a4IncludeTransport,
          recipientMode: a4RecipientMode,
          tanggalCetak: a4TanggalCetak,
          includeInvoice: a4IncludeInvoice,
          includeTandaTerima: a4IncludeTandaTerima,
          includeSlipGaji: a4IncludeSlipGaji,
          includeKwitansi: a4IncludeKwitansi,
          dibayarkanOleh: a4DibayarkanOleh,
          invoiceNo: a4InvoiceNo,
          ppnPct: a4InvoicePpnPct,
          ditagihkanKepada: a4DitagihkanKepada,
          bankName: a4BankName,
          bankAccount: a4BankAccount,
          bankHolder: a4BankHolder,
        })
      );
      return;
    }

    const anyDocChecked =
      Boolean(currentDraft.includeInvoice) ||
      Boolean(currentDraft.includeDaftarTandaTerima) ||
      Boolean(currentDraft.includeSlipGaji) ||
      Boolean(currentDraft.includeKwitansi) ||
      Boolean(currentDraft.includeReceiptAttachments && activeReceiptUrls.length > 0) ||
      (activeRabCode === "3b" && sewaIncludeKontrak);

    if (!anyDocChecked) {
      setBanner({
        type: "err",
        text: "Centang minimal 1 jenis dokumen (Invoice / Tanda Terima / Slip Gaji / Kwitansi) sebelum mencetak.",
      });
      return;
    }

    // Khusus Pos B.3b (Bantuan Sewa Rumah): cetak per lokasi SNT (1 lokasi terpilih atau pisah 6 lokasi)
    if (activeRabCode === "3b" && sewaLocationFilter !== "ALL_COMBINED") {
      const targetLocs =
        sewaLocationFilter === "SPLIT_ALL_LOCATIONS"
          ? [...SNT_WILAYAH_2_LOCATIONS]
          : SNT_WILAYAH_2_LOCATIONS.filter((l) => l.id === sewaLocationFilter);

      const bundles = targetLocs.map((loc) => {
        const locItems = currentDraft.items.filter(
          (it) => matchWilayah2LocationId(it.lokasi) === loc.id
        );
        const locSewa = sewaDraftsByLoc[loc.id] || {
          ...getDefaultSewaRumahDraft(),
          lokasiSnt: loc.label,
        };
        const itemsWithOwner = locItems.map((it) => ({
          ...it,
          penerima: it.penerima || locSewa.namaPemilik || "",
        }));
        return {
          type: activeMeta.pdfDocType,
          draft: {
            ...currentDraft,
            judulDokumen: `Bantuan Sewa Rumah / Kost Fasilitator — ${loc.label}`,
            items: itemsWithOwner,
          },
          includeKwitansiSlips: Boolean(currentDraft.includeSlipGaji || currentDraft.includeKwitansi),
          prependPagesHtml: sewaIncludeKontrak
            ? [buildSewaRumahContractPageHtml({ ...locSewa, recipientMode: currentDraft.recipientMode }, profile)]
            : undefined,
        };
      });

      const title =
        targetLocs.length === 1
          ? `Bantuan Sewa Rumah Fasilitator — ${targetLocs[0].label}`
          : "Bantuan Sewa Rumah Fasilitator — Per Lokasi SNT (6 Lokasi)";
      openHtmlWindow(renderMultiBundleGenericEvidencePdfHtml(bundles, profile, title));
      return;
    }

    const prependPagesHtml =
      activeRabCode === "3b" && sewaIncludeKontrak
        ? [buildSewaRumahContractPageHtml({ ...activeSewaDraft, recipientMode: currentDraft.recipientMode }, profile)]
        : undefined;

    const html = renderGenericEvidencePdfHtml({
      type: activeMeta.pdfDocType,
      draft: currentDraft,
      profile,
      includeKwitansiSlips: Boolean(currentDraft.includeSlipGaji || currentDraft.includeKwitansi),
      prependPagesHtml,
    });
    openHtmlWindow(html);
  };

  const handlePullRealFromDb = () => {
    const list = realExpensesByRabCode.get(activeRabCode.toLowerCase()) || [];
    if (list.length === 0) {
      setBanner({
        type: "err",
        text: `Belum ada transaksi pengeluaran RIIL (APPROVED) di Pos ${activeMeta.displayCode}.`,
      });
      return;
    }
    const pulled = buildRealExpenseLineItems(
      list,
      activeMeta.shortTitle,
      currentDraft.slipNamaPenerima || DEFAULT_SNT_KORWIL_PROFILE.nama
    );
    const totalReceipts = normalizeReceiptUrlList(pulled.flatMap((it) => it.receiptUrls || [])).length;
    updateCurrentDraft((p) => ({
      ...p,
      items: pulled,
      recipientMode: "MANUAL",
      includeReceiptAttachments: totalReceipts > 0 ? true : p.includeReceiptAttachments,
      periodeLabel: "September – Desember 2026 (Data Pengeluaran Riil)",
    }));
    setBanner({
      type: "ok",
      text: `Berhasil memuat ${pulled.length} transaksi pengeluaran RIIL Pos ${activeMeta.displayCode} (${formatCurrency(pulled.reduce((s, it) => s + it.nominal, 0))}) beserta ${totalReceipts} lampiran receipt terupload.`,
    });
  };

  const handlePullPelaporanFromDb = () => {
    const list = pelaporanExpensesByRabCode.get(activeRabCode.toLowerCase()) || [];
    if (list.length === 0) {
      setBanner({
        type: "err",
        text: `Belum ada transaksi PELAPORAN di Pos ${activeMeta.displayCode}. Gunakan "Muat Rincian RAB" atau "Muat Preset Tahap I".`,
      });
      return;
    }
    const pulled: EvidenceLineItem[] = list.map((exp) => {
      const d = exp.date || exp.createdAt;
      return {
        id: `db-${exp.id}`,
        tanggal: d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        lokasi: exp.fasilitator?.lokasiSNT || "Wilayah 2",
        uraian: exp.description || activeMeta.shortTitle,
        penerima: exp.fasilitator?.namaLengkap || currentDraft.slipNamaPenerima || "",
        volume: 1,
        satuan: "paket",
        hargaSatuan: Number(exp.amount) || 0,
        nominal: Number(exp.amount) || 0,
        receiptUrls: getExpenseReceiptUrls(exp),
      };
    });
    updateCurrentDraft((p) => ({ ...p, items: pulled }));
    setBanner({
      type: "ok",
      text: `Berhasil menarik ${pulled.length} entri PELAPORAN dari DB Pos ${activeMeta.displayCode} (transaksi Real tidak terpengaruh).`,
    });
  };

  const activeReceiptUrls =
    activeRabCode === "4"
      ? []
      : normalizeReceiptUrlList(currentDraft.items.flatMap((it) => it.receiptUrls || []));

  const showReceiptCheckbox =
    activeRabCode !== "4" &&
    (isKorwilRealExpensePos(activeRabCode) || activeReceiptUrls.length > 0);

  // Ringkasan label dokumen yang dicentang untuk preview tombol Cetak
  const activeCheckedLabels = (() => {
    const arr: string[] = [];
    if (activeRabCode === "4") {
      if (a4IncludeInvoice) arr.push("Invoice");
      if (a4IncludeTandaTerima) arr.push("Tanda Terima");
      if (a4IncludeSlipGaji) arr.push("Slip Gaji");
      if (a4IncludeKwitansi) arr.push("Kwitansi");
      return arr;
    }
    if (activeRabCode === "3b" && sewaIncludeKontrak) arr.push("Kontrak Sewa");
    if (currentDraft.includeInvoice) arr.push("Invoice");
    if (currentDraft.includeDaftarTandaTerima) arr.push("Tanda Terima");
    if (currentDraft.includeSlipGaji) arr.push("Slip Gaji");
    if (currentDraft.includeKwitansi) arr.push("Kwitansi");
    if (currentDraft.includeReceiptAttachments && activeReceiptUrls.length > 0) {
      arr.push(`Lampiran Receipt (${activeReceiptUrls.length})`);
    }
    return arr;
  })();

  const renderSidebarCard = (meta: (typeof RAB_POS_CATALOG)[number]) => {
    const isActive = meta.code === activeRabCode;
    const isSaved =
      meta.code === "4"
        ? Boolean(evidenceDrafts[`EVIDENCE_HONOR_FASIL_${a4PricingMode}_${a4Month}`])
        : Boolean(evidenceDrafts[`EVIDENCE_RAB_${meta.code}`]);
    const pelaporanList = pelaporanExpensesByRabCode.get(meta.code.toLowerCase()) || [];
    const pelaporanSum = pelaporanList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return (
      <button
        key={meta.code}
        type="button"
        onClick={() => {
          onSelectRabCode(meta.code);
          setBanner(null);
        }}
        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
          isActive
            ? "bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-400/50"
            : "bg-white border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge
              variant="secondary"
              className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : meta.group === "A"
                    ? "bg-teal-100 text-teal-900"
                    : "bg-slate-100 text-slate-800"
              }`}
            >
              {meta.displayCode}
            </Badge>
            <span className={`text-xs font-bold truncate ${isActive ? "text-emerald-950" : "text-slate-800"}`}>
              {meta.shortTitle}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-600 shrink-0">
            {formatCurrency(meta.rabBudget)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[10px] text-slate-500 truncate">{meta.rabFormula}</span>
          <div className="flex items-center gap-1 shrink-0">
            {pelaporanSum > 0 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SPJ {Math.round((pelaporanSum / Math.max(1, meta.rabBudget)) * 100)}%
              </span>
            )}
            {isSaved && (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-label="Draft Tersimpan" />
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ==================== SIDEBAR KIRI: 23 POS RAB RESMI (1 POS = 1 MENU) ==================== */}
      <div className="lg:col-span-4 space-y-2.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pos RAB Pelaporan ({RAB_POS_CATALOG.length} Pos)
            </span>
            <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-blue-50">
              Khusus Pelaporan
            </Badge>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <Input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Cari pos (mis. A.3, Korwil, Sewa, LMS)..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex gap-1">
            {(
              [
                { id: "ALL", label: `Semua (${RAB_POS_CATALOG.length})` },
                { id: "A", label: "A. Personel (5)" },
                { id: "B", label: "B. Nonpersonel (18)" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSidebarGroup(f.id)}
                className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-colors ${
                  sidebarGroup === f.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
          {catalogGroupA.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 px-1">
                A. Biaya Personel ({catalogGroupA.length})
              </div>
              {catalogGroupA.map(renderSidebarCard)}
            </div>
          )}
          {catalogGroupB.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-1 pt-1">
                B. Biaya Nonpersonel ({catalogGroupB.length})
              </div>
              {catalogGroupB.map(renderSidebarCard)}
            </div>
          )}
          {filteredCatalog.length === 0 && (
            <div className="text-center text-xs text-slate-500 py-8 bg-white rounded-xl border border-dashed">
              Pos RAB tidak ditemukan untuk &ldquo;{sidebarSearch}&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* ==================== PANEL KANAN: EDITOR & CETAK KHUSUS POS TERPILIH ==================== */}
      <div className="lg:col-span-8">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-4 px-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-700 text-white text-xs font-bold">
                  {activeMeta.displayCode}
                </Badge>
                <CardTitle className="text-base font-bold text-slate-900">
                  {activeMeta.shortTitle}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Pagu RAB: <strong className="text-slate-900">{formatCurrency(activeMeta.rabBudget)}</strong> ({activeMeta.rabFormula})
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{activeMeta.template13Ref}</p>
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
                onClick={handlePrintActivePos}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / PDF A4 ({activeCheckedLabels.length})
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

            {/* ==================== KOTAK 1: CHECKLIST 4 DOKUMEN RESMI (ADMIN BEBAS CENTANG) ==================== */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-teal-950">
                    1. Pilih Dokumen yang Akan Dicetak — Format Resmi Administrasi
                  </div>
                  <p className="text-[11px] text-teal-800/80">
                    Centang satu atau lebih dokumen sesuai kebutuhan SPJ Pos {activeMeta.displayCode}. Tab ini khusus untuk Pelaporan (kas Real tetap di Nota &amp; Pengeluaran).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={activeRabCode === "4" ? a4KopSurat : currentDraft.kopSurat || activeMeta.defaultKop}
                    onChange={(e) => {
                      const nextKop = e.target.value as KopSuratOption;
                      if (activeRabCode === "4") {
                        setA4KopSurat(nextKop);
                      } else {
                        updateCurrentDraft((p) => ({
                          ...p,
                          kopSurat: nextKop,
                        }));
                      }
                    }}
                    className="h-8 px-2.5 rounded-md border border-teal-300 bg-white text-xs font-semibold text-teal-950"
                  >
                    {KOP_OPTIONS_LIST.map((k) => (
                      <option key={k.value} value={k.value}>
                        Kop: {k.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 Checklist Utama (+ Kontrak Sewa khusus B.3b / Lampiran Receipt untuk B.2a, B.2c & pos berlampiran) */}
              <div
                className={`grid grid-cols-2 ${
                  activeRabCode === "3b" || showReceiptCheckbox ? "sm:grid-cols-5" : "sm:grid-cols-4"
                } gap-2 text-xs`}
              >
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    (activeRabCode === "4" ? a4IncludeInvoice : Boolean(currentDraft.includeInvoice))
                      ? "bg-blue-600 text-white border-blue-700 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeRabCode === "4" ? a4IncludeInvoice : Boolean(currentDraft.includeInvoice)}
                    onChange={(e) => {
                      if (activeRabCode === "4") setA4IncludeInvoice(e.target.checked);
                      else updateCurrentDraft((p) => ({ ...p, includeInvoice: e.target.checked }));
                    }}
                    className="accent-white"
                  />
                  <span>Invoice</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    (activeRabCode === "4" ? a4IncludeTandaTerima : Boolean(currentDraft.includeDaftarTandaTerima))
                      ? "bg-cyan-700 text-white border-cyan-800 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeRabCode === "4" ? a4IncludeTandaTerima : Boolean(currentDraft.includeDaftarTandaTerima)}
                    onChange={(e) => {
                      if (activeRabCode === "4") setA4IncludeTandaTerima(e.target.checked);
                      else updateCurrentDraft((p) => ({ ...p, includeDaftarTandaTerima: e.target.checked }));
                    }}
                    className="accent-white"
                  />
                  <span>Tanda Terima</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    (activeRabCode === "4" ? a4IncludeSlipGaji : Boolean(currentDraft.includeSlipGaji))
                      ? "bg-teal-700 text-white border-teal-800 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeRabCode === "4" ? a4IncludeSlipGaji : Boolean(currentDraft.includeSlipGaji)}
                    onChange={(e) => {
                      if (activeRabCode === "4") setA4IncludeSlipGaji(e.target.checked);
                      else updateCurrentDraft((p) => ({ ...p, includeSlipGaji: e.target.checked }));
                    }}
                    className="accent-white"
                  />
                  <span>Slip Gaji</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    (activeRabCode === "4" ? a4IncludeKwitansi : Boolean(currentDraft.includeKwitansi))
                      ? "bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeRabCode === "4" ? a4IncludeKwitansi : Boolean(currentDraft.includeKwitansi)}
                    onChange={(e) => {
                      if (activeRabCode === "4") setA4IncludeKwitansi(e.target.checked);
                      else updateCurrentDraft((p) => ({ ...p, includeKwitansi: e.target.checked }));
                    }}
                    className="accent-white"
                  />
                  <span>Kwitansi</span>
                </label>

                {activeRabCode === "3b" && (
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      sewaIncludeKontrak
                        ? "bg-indigo-700 text-white border-indigo-800 font-bold shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sewaIncludeKontrak}
                      onChange={(e) => setSewaIncludeKontrak(e.target.checked)}
                      className="accent-white"
                    />
                    <span>Kontrak Sewa</span>
                  </label>
                )}

                {showReceiptCheckbox && (
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      currentDraft.includeReceiptAttachments
                        ? "bg-amber-600 text-white border-amber-700 font-bold shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(currentDraft.includeReceiptAttachments)}
                      onChange={(e) =>
                        updateCurrentDraft((p) => ({
                          ...p,
                          includeReceiptAttachments: e.target.checked,
                        }))
                      }
                      className="accent-white"
                    />
                    <span className="truncate">Lampiran Receipt ({activeReceiptUrls.length})</span>
                  </label>
                )}
              </div>

              {/* ==================== KOTAK 2: PILIHAN MODE PERIODE CETAK (PER BULAN / SEMUA PISAH / SEMUA GABUNGAN) ==================== */}
              <div className="pt-2.5 border-t border-teal-200/70 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-950">2. Periode Cetak:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeRabCode === "4" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setA4PrintMode("SINGLE_MONTH")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            a4PrintMode === "SINGLE_MONTH"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Per Bulan
                        </button>
                        <button
                          type="button"
                          onClick={() => setA4PrintMode("SPLIT_ALL_MONTHS")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            a4PrintMode === "SPLIT_ALL_MONTHS"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Semua — Pisah Per Bulan (Sep–Des)
                        </button>
                        <button
                          type="button"
                          onClick={() => setA4PrintMode("COMBINED_ALL")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            a4PrintMode === "COMBINED_ALL"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Semua — Gabungan / Rekap
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = currentDraft.monthlyPrintFilter;
                            const nextMonth: MonthlyPrintFilter =
                              cur && cur.startsWith("2026-") ? cur : "2026-10";
                            updateCurrentDraft((p) => ({ ...p, monthlyPrintFilter: nextMonth }));
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            (currentDraft.monthlyPrintFilter || "ALL").startsWith("2026-")
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Per Bulan
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrentDraft((p) => ({ ...p, monthlyPrintFilter: "SPLIT_EACH_MONTH" }))
                          }
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            currentDraft.monthlyPrintFilter === "SPLIT_EACH_MONTH"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Semua — Pisah Per Bulan (Sep–Des)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentDraft((p) => ({ ...p, monthlyPrintFilter: "ALL" }))}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            (currentDraft.monthlyPrintFilter || "ALL") === "ALL"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Cetak Semua — Gabungan / Rekap
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Pilihan Bulan (tampil saat mode Per Bulan) */}
                {((activeRabCode === "4" && a4PrintMode === "SINGLE_MONTH") ||
                  (activeRabCode !== "4" && (currentDraft.monthlyPrintFilter || "ALL").startsWith("2026-"))) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-teal-900 mr-1">Pilih Bulan:</span>
                    {SNT_HONOR_MONTH_OPTIONS.map((m) => {
                      const isSel =
                        activeRabCode === "4"
                          ? a4Month === m.key
                          : currentDraft.monthlyPrintFilter === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            if (activeRabCode === "4") {
                              setA4Month(m.key);
                              setA4TanggalCetak(m.defaultDate);
                            } else {
                              updateCurrentDraft((p) => ({ ...p, monthlyPrintFilter: m.key }));
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            isSel
                              ? "bg-teal-700 text-white border-teal-800"
                              : "bg-white text-slate-700 border-teal-200 hover:bg-teal-100"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-teal-900 bg-white/80 rounded-md px-2.5 py-1.5 border border-teal-200/70">
                  <span>
                    Ringkasan cetak:{" "}
                    <strong>
                      {activeCheckedLabels.length > 0 ? activeCheckedLabels.join(" + ") : "Belum ada dokumen dicentang"}
                    </strong>{" "}
                    ·{" "}
                    {activeRabCode === "4"
                      ? a4PrintMode === "SINGLE_MONTH"
                        ? `Khusus ${getMonthLabelId(a4Month)}`
                        : a4PrintMode === "SPLIT_ALL_MONTHS"
                          ? "Pisah per bulan (Sep, Okt, Nov, Des)"
                          : "Gabungan 4 bulan (Rekap)"
                      : currentDraft.monthlyPrintFilter === "SPLIT_EACH_MONTH"
                        ? "Pisah per bulan (Sep–Des)"
                        : (currentDraft.monthlyPrintFilter || "ALL").startsWith("2026-")
                          ? `Khusus ${getMonthLabelId(currentDraft.monthlyPrintFilter || "")}`
                          : "Gabungan / Semua Baris"}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintActivePos}
                    className="font-bold text-teal-800 hover:text-teal-950 underline inline-flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> Cetak Sekarang
                  </button>
                </div>
              </div>
            </div>

            {/* ==================== EDITOR KHUSUS POS A.4: FASILITATOR (6 LOKASI SNT) ==================== */}
            {activeRabCode === "4" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="text-xs">
                    <div className="font-bold text-emerald-950">Basis Rincian Pos A.4 (6 Lokasi SNT):</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      {a4PricingMode === "RAB_SATUAN"
                        ? `Standar Pelaporan RAB = ${formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE)}/lokasi/bln (6 lokasi = ${formatCurrency(SNT_RAB_HONOR_FASIL_UNIT_PRICE * 6)}/bln). NPWP/NIK & Rekening otomatis diambil dari Profil Fasilitator DB.`
                        : "Referensi realisasi per fasilitator & harga satuan real/JP dari Rekap Honorarium DB."}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setA4PricingMode("RAB_SATUAN")}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        a4PricingMode === "RAB_SATUAN"
                          ? "bg-emerald-700 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Standar RAB (Rp5.729.876 / Lokasi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setA4PricingMode("REAL_JP")}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        a4PricingMode === "REAL_JP"
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Referensi Real / JP (Rekap DB)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bulan Editor</label>
                    <select
                      value={a4Month}
                      onChange={(e) => {
                        setA4Month(e.target.value);
                        const opt = SNT_HONOR_MONTH_OPTIONS.find((m) => m.key === e.target.value);
                        if (opt) setA4TanggalCetak(opt.defaultDate);
                      }}
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
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Bayar / Dokumen</label>
                    <Input
                      type="date"
                      value={a4TanggalCetak}
                      onChange={(e) => setA4TanggalCetak(e.target.value)}
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
                          a4PricingMode === "RAB_SATUAN" ? rabUnitA4Sheet.rows : dbA4Sheet.rows;
                        setCustomA4RowsByKey((prev) => ({ ...prev, [a4StateKey]: freshRows }));
                        setBanner({
                          type: "ok",
                          text: `Data ${getMonthLabelId(a4Month)} disegarkan (${freshRows.length} baris).`,
                        });
                      }}
                      className="text-xs h-9 bg-white gap-1 flex-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset 6 Lokasi
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomA4RowsByKey((prev) => ({
                          ...prev,
                          [a4StateKey]: activeA4Rows.map((r) => ({ ...r, nama: "" })),
                        }));
                        setBanner({ type: "ok", text: "Semua nama fasilitator dikosongkan (blanko)." });
                      }}
                      className="text-xs h-9 bg-white gap-1 text-amber-800 border-amber-300"
                    >
                      <UserX className="w-3.5 h-3.5" /> Kosongkan
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={a4RecipientMode === "BLANK"}
                      onChange={(e) => setA4RecipientMode(e.target.checked ? "BLANK" : "MANUAL")}
                    />
                    <span>Paksa kosongkan semua nama saat cetak</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={a4IncludeTransport}
                      onChange={(e) => setA4IncludeTransport(e.target.checked)}
                    />
                    <span>Sertakan info kolom Transport</span>
                  </label>
                </div>

                {a4IncludeTandaTerima && (
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-3 space-y-2 text-xs">
                    <div className="font-bold text-cyan-950">Pengaturan Tanda Terima (Pos A.4)</div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cyan-950 mb-1">
                        Dibayarkan oleh (Teks Penandatangan Kiri)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                        {TANDA_TERIMA_PAYER_OPTIONS.map((opt) => {
                          const isSelected = a4DibayarkanOleh.trim() === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setA4DibayarkanOleh(opt)}
                              className={`text-left px-2.5 py-1.5 rounded-md border text-[11px] font-semibold transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? "bg-cyan-700 text-white border-cyan-800 shadow-xs"
                                  : "bg-white text-slate-700 border-cyan-200 hover:bg-cyan-50"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full border shrink-0 flex items-center justify-center ${
                                  isSelected ? "border-white bg-white" : "border-slate-400"
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-700" />}
                              </span>
                              <span className="truncate">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        value={a4DibayarkanOleh}
                        onChange={(e) => setA4DibayarkanOleh(e.target.value)}
                        placeholder={DEFAULT_ROBOTIC_PREPARER_LABEL}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {a4IncludeInvoice && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2.5 text-xs">
                    <div className="font-bold text-blue-950">Pengaturan Invoice &amp; Rekening Penerima (Pos A.4)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          No. Invoice (Kosong = Otomatis per Bulan)
                        </label>
                        <Input
                          value={a4InvoiceNo}
                          onChange={(e) => setA4InvoiceNo(e.target.value)}
                          placeholder={`INV/MTC/SNT-W2-A4/.../${a4Month}`}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Ditagihkan Kepada
                        </label>
                        <Input
                          value={a4DitagihkanKepada}
                          onChange={(e) => setA4DitagihkanKepada(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">PPN (%)</label>
                        <select
                          value={a4InvoicePpnPct}
                          onChange={(e) => setA4InvoicePpnPct(Number(e.target.value) || 0)}
                          className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs font-semibold"
                        >
                          <option value={0}>0% (Non-PPN)</option>
                          <option value={11}>11% (PPN)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Bank Penerima</label>
                        <Input
                          value={a4BankName}
                          onChange={(e) => setA4BankName(e.target.value)}
                          placeholder="BCA / BANK MANDIRI"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">No. Rekening Penerima</label>
                        <Input
                          value={a4BankAccount}
                          onChange={(e) => setA4BankAccount(e.target.value)}
                          placeholder="No. rekening transfer..."
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Atas Nama Rekening Penerima</label>
                        <Input
                          value={a4BankHolder}
                          onChange={(e) => setA4BankHolder(e.target.value)}
                          placeholder="Atas nama pemilik rekening..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b text-slate-700">
                      <tr>
                        <th className="py-2 px-2">Lokasi SNT &amp; Pilih Profil Fasilitator DB</th>
                        <th className="py-2 px-2 text-center">Satuan</th>
                        <th className="py-2 px-2 text-right">Harga Satuan (Rp)</th>
                        <th className="py-2 px-2 text-right">Total Honor</th>
                        <th className="py-2 px-2 text-center">Pelaporan RAB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {activeA4Rows.map((row, idx) => {
                        const locId = row.locationId || matchWilayah2LocationId(row.lokasi);
                        const localFasils = fasilitators.filter(
                          (f) => locId && matchWilayah2LocationId(f.lokasiSNT) === locId
                        );
                        const otherFasils = fasilitators.filter(
                          (f) => !locId || matchWilayah2LocationId(f.lokasiSNT) !== locId
                        );
                        const isSelectedInDb = fasilitators.some((f) => f.namaLengkap === row.nama);
                        const recStatus = checkA4RowRecorded(row, a4Month);

                        const updateRow = (patch: Partial<MonthlyHonorReceiptRow>) => {
                          const next = [...activeA4Rows];
                          const merged = { ...row, ...patch };
                          if (a4PricingMode === "RAB_SATUAN") {
                            if (patch.hargaSatuanReal !== undefined && patch.totalHonor === undefined) {
                              merged.totalHonor = Number(patch.hargaSatuanReal) || 0;
                            } else if (patch.totalHonor !== undefined && patch.hargaSatuanReal === undefined) {
                              merged.hargaSatuanReal = Number(patch.totalHonor) || 0;
                            }
                          }
                          next[idx] = merged;
                          setCustomA4RowsByKey((prev) => ({ ...prev, [a4StateKey]: next }));
                        };

                        return (
                          <tr key={row.id || idx} className={recStatus.isRecorded ? "bg-emerald-50/30" : ""}>
                            <td className="py-2 px-2 space-y-1.5 min-w-[240px]">
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  value={row.lokasi}
                                  onChange={(e) => updateRow({ lokasi: e.target.value })}
                                  className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                                />
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
                            </td>
                            <td className="py-1.5 px-2 text-center whitespace-nowrap">
                              <span className="font-semibold text-slate-700">
                                {a4PricingMode === "RAB_SATUAN" ? "1 Bulan" : `${row.totalJP} JP`}
                              </span>
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
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300"
                                    title={`Sudah tercatat pada Pos A.4 (PELAPORAN)${recStatus.noKwitansi ? ` · ${recStatus.noKwitansi}` : ""}`}
                                  >
                                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Masuk SPJ
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={recordingId === row.id || row.totalHonor <= 0}
                                    onClick={() =>
                                      handleRecordLineToRab(
                                        row.id,
                                        "4",
                                        a4TanggalCetak,
                                        `Honorarium Fasilitator ${row.lokasi} (${row.nama || "Fasilitator SNT"}) - ${getMonthLabelId(a4Month)}`,
                                        row.totalHonor,
                                        {
                                          dedupeTokens: [row.lokasi, getMonthLabelId(a4Month)],
                                          localRecordKey: recStatus.localKey,
                                        }
                                      )
                                    }
                                    className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold disabled:opacity-40"
                                  >
                                    {recordingId === row.id ? "..." : "+ SPJ"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCustomA4RowsByKey((prev) => ({
                                      ...prev,
                                      [a4StateKey]: activeA4Rows.filter((_, i) => i !== idx),
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
                    <tfoot className="bg-blue-50/70 border-t font-bold">
                      <tr>
                        <td colSpan={3} className="py-2 px-2">
                          TOTAL BULAN {getMonthLabelId(a4Month).toUpperCase()} ({activeA4Rows.length} Lokasi)
                        </td>
                        <td className="py-2 px-2 text-right text-blue-800 whitespace-nowrap">
                          {formatCurrency(activeA4Sheet.totalHonor)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              /* ==================== EDITOR STANDAR 22 POS RAB LAINNYA (A.1–A.3, A.5, B.1a–B.7d) ==================== */
              <div className="space-y-4">
                {/* Info khusus Pos B.2a (Tiket) & B.2c (Penginapan) — menggunakan data pengeluaran riil + lampiran receipt */}
                {isKorwilRealExpensePos(activeRabCode) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong>Basis Pengeluaran Riil ({activeMeta.displayCode}):</strong>{" "}
                      Menggunakan data pengeluaran riil terverifikasi ({(realExpensesByRabCode.get(activeRabCode.toLowerCase()) || []).length} transaksi) beserta{" "}
                      <strong>{activeReceiptUrls.length} dokumen receipt terupload</strong> (otomatis terlampir saat cetak PDF).
                    </div>
                  </div>
                )}

                {/* Bar Sumber Data Pelaporan Khusus Pos Ini */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isKorwilRealExpensePos(activeRabCode) && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handlePullRealFromDb}
                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-[11px] gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Muat Data Riil DB ({(realExpensesByRabCode.get(activeRabCode.toLowerCase()) || []).length} tx)
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const fresh = buildDefaultRabPosDraft(activeRabCode, profile);
                        updateCurrentDraft((p) => ({
                          ...fresh,
                          kopSurat: p.kopSurat || fresh.kopSurat,
                          includeInvoice: p.includeInvoice,
                          includeDaftarTandaTerima: p.includeDaftarTandaTerima,
                          includeSlipGaji: p.includeSlipGaji,
                          includeKwitansi: p.includeKwitansi,
                          monthlyPrintFilter: p.monthlyPrintFilter,
                          slipNamaPenerima: p.slipNamaPenerima || fresh.slipNamaPenerima,
                          slipNpwpNik: p.slipNpwpNik || fresh.slipNpwpNik,
                          slipRekening: p.slipRekening || fresh.slipRekening,
                        }));
                        setBanner({
                          type: "ok",
                          text: `Rincian Pagu RAB ${activeMeta.displayCode} (${formatCurrency(activeMeta.rabBudget)}) dimuat.`,
                        });
                      }}
                      className="h-8 bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50 text-[11px] gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Muat Rincian RAB ({formatCurrency(activeMeta.rabBudget)})
                    </Button>

                    {activeMeta.hasTahap1Preset && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const t1 = buildTahap1RabPosDraft(activeRabCode, profile);
                          if (!t1) return;
                          updateCurrentDraft((p) => ({
                            ...t1,
                            includeInvoice: p.includeInvoice,
                            includeDaftarTandaTerima: p.includeDaftarTandaTerima,
                            includeSlipGaji: p.includeSlipGaji,
                            includeKwitansi: p.includeKwitansi,
                            slipNamaPenerima: p.slipNamaPenerima || t1.slipNamaPenerima,
                            slipNpwpNik: p.slipNpwpNik || t1.slipNpwpNik,
                            slipRekening: p.slipRekening || t1.slipRekening,
                          }));
                          setBanner({
                            type: "ok",
                            text: `Preset ${activeMeta.tahap1Label || "Tahap I (80%)"} untuk ${activeMeta.displayCode} dimuat.`,
                          });
                        }}
                        className="h-8 bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100 text-[11px] gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> {activeMeta.tahap1Label || "Preset Tahap I (80%)"}
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePullPelaporanFromDb}
                      className="h-8 bg-white text-[11px] gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Tarik Pelaporan DB
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCurrentDraft((p) => ({ ...p, recipientMode: "MANUAL" }))}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${
                        currentDraft.recipientMode === "MANUAL"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border text-slate-600"
                      }`}
                    >
                      <UserCheck className="w-3 h-3" /> Isi Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentDraft((p) => ({ ...p, recipientMode: "BLANK" }))}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${
                        currentDraft.recipientMode === "BLANK"
                          ? "bg-slate-900 text-white"
                          : "bg-white border text-slate-600"
                      }`}
                    >
                      <UserX className="w-3 h-3" /> Blanko
                    </button>
                  </div>
                </div>

                {/* Filter & Cetak Per Lokasi SNT khusus Pos B.3b (Bantuan Sewa Rumah Fasilitator) */}
                {activeRabCode === "3b" && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-indigo-950">
                          Cetak Per Lokasi SNT — Bantuan Sewa Rumah (6 Lokasi × 4 Bln × Rp2.000.000)
                        </div>
                        <p className="text-[11px] text-indigo-800/80">
                          Pilih satu lokasi SNT untuk edit &amp; cetak khusus lokasi tersebut, atau &ldquo;Semua 6 Lokasi (Pisah Per Lokasi)&rdquo; agar tiap lokasi tercetak paket kontrak, tanda terima &amp; kwitansinya sendiri.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSewaLocationFilter("SPLIT_ALL_LOCATIONS")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                          sewaLocationFilter === "SPLIT_ALL_LOCATIONS"
                            ? "bg-indigo-700 text-white border-indigo-800"
                            : "bg-white text-slate-700 border-indigo-200 hover:bg-indigo-100"
                        }`}
                      >
                        Semua 6 Lokasi (Pisah Per Lokasi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSewaLocationFilter("ALL_COMBINED")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                          sewaLocationFilter === "ALL_COMBINED"
                            ? "bg-indigo-700 text-white border-indigo-800"
                            : "bg-white text-slate-700 border-indigo-200 hover:bg-indigo-100"
                        }`}
                      >
                        Gabungan 6 Lokasi
                      </button>
                      {SNT_WILAYAH_2_LOCATIONS.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => setSewaLocationFilter(loc.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                            sewaLocationFilter === loc.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"
                          }`}
                        >
                          {loc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Khusus Kontrak Sewa Rumah (muncul bila Pos B.3b & Kontrak Sewa dicentang) */}
                {activeRabCode === "3b" && sewaIncludeKontrak && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Kontrak Sewa Rumah — {activeSewaDraft.lokasiSnt}
                      </div>
                      <select
                        value={activeSewaLocId}
                        onChange={(e) => setSewaLocationFilter(e.target.value)}
                        className="h-7 px-2 rounded border border-indigo-300 bg-white text-[11px] font-semibold text-indigo-950"
                      >
                        {SNT_WILAYAH_2_LOCATIONS.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            Edit Kontrak: {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nomor Kontrak</label>
                        <Input
                          value={activeSewaDraft.nomorKontrak}
                          onChange={(e) => updateActiveSewaDraft({ nomorKontrak: e.target.value })}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Pemilik Rumah</label>
                        <Input
                          value={activeSewaDraft.namaPemilik}
                          onChange={(e) => {
                            const nextOwner = e.target.value;
                            updateActiveSewaDraft({ namaPemilik: nextOwner });
                            updateCurrentDraft((p) => ({
                              ...p,
                              items: p.items.map((it) =>
                                matchWilayah2LocationId(it.lokasi) === activeSewaLocId &&
                                (!it.penerima || it.penerima === activeSewaDraft.namaPemilik)
                                  ? { ...it, penerima: nextOwner }
                                  : it
                              ),
                            }));
                          }}
                          placeholder="Kosongkan untuk blanko..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Fasilitator Penghuni</label>
                        <Input
                          value={activeSewaDraft.namaFasilitator}
                          onChange={(e) => updateActiveSewaDraft({ namaFasilitator: e.target.value })}
                          placeholder="Nama fasilitator..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">NIK Pemilik Rumah</label>
                        <Input
                          value={activeSewaDraft.nikPemilik}
                          onChange={(e) => updateActiveSewaDraft({ nikPemilik: e.target.value })}
                          placeholder="NIK pemilik rumah..."
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Alamat Rumah Sewa</label>
                        <Input
                          value={activeSewaDraft.alamatRumahSewa}
                          onChange={(e) => updateActiveSewaDraft({ alamatRumahSewa: e.target.value })}
                          placeholder="Alamat lengkap..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Bulan</label>
                          <Input
                            type="number"
                            min={1}
                            max={6}
                            value={activeSewaDraft.jumlahBulan}
                            onChange={(e) => updateActiveSewaDraft({ jumlahBulan: Number(e.target.value) || 1 })}
                            className="h-8 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tarif/Bln</label>
                          <Input
                            type="number"
                            value={activeSewaDraft.tarifPerBulan}
                            onChange={(e) => updateActiveSewaDraft({ tarifPerBulan: Number(e.target.value) || 0 })}
                            className="h-8 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kotak Profil Penerima Slip Gaji / Honorarium (auto muncul saat Slip Gaji dicentang) */}
                {currentDraft.includeSlipGaji && (
                  <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3.5 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-teal-950">
                        Profil Penerima Slip Gaji / Honorarium ({activeMeta.displayCode})
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          const f = fasilitators.find((x) => x.id === e.target.value);
                          if (!f) return;
                          const bankStr = [f.bankName, f.bankAccount].filter(Boolean).join(" — ");
                          updateCurrentDraft((p) => ({
                            ...p,
                            slipNamaPenerima: f.namaLengkap,
                            slipNpwpNik: f.npwpNik || p.slipNpwpNik,
                            slipRekening: bankStr || p.slipRekening,
                          }));
                        }}
                        className="h-7 px-2 rounded border border-teal-300 bg-white text-[11px] font-medium"
                      >
                        <option value="">-- Tarik dari Profil Fasilitator DB (Opsional) --</option>
                        {fasilitators.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.namaLengkap} ({f.lokasiSNT || "Wilayah 2"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Penerima Default</label>
                        <Input
                          value={currentDraft.slipNamaPenerima || ""}
                          onChange={(e) =>
                            updateCurrentDraft((p) => ({
                              ...p,
                              slipNamaPenerima: e.target.value,
                              items: p.items.map((it) =>
                                !it.penerima || it.penerima === p.slipNamaPenerima
                                  ? { ...it, penerima: e.target.value }
                                  : it
                              ),
                            }))
                          }
                          placeholder="Nama lengkap penerima..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Peran / Jabatan</label>
                        <Input
                          value={currentDraft.slipPeranJabatan || ""}
                          onChange={(e) => updateCurrentDraft((p) => ({ ...p, slipPeranJabatan: e.target.value }))}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Kegiatan</label>
                        <Input
                          value={currentDraft.slipKegiatan || DEFAULT_SLIP_KEGIATAN_LABEL}
                          onChange={(e) => updateCurrentDraft((p) => ({ ...p, slipKegiatan: e.target.value }))}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">NPWP / NIK</label>
                        <Input
                          value={currentDraft.slipNpwpNik || ""}
                          onChange={(e) => updateCurrentDraft((p) => ({ ...p, slipNpwpNik: e.target.value }))}
                          placeholder="NPWP / NIK penerima..."
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Rekening Penerima</label>
                        <Input
                          value={currentDraft.slipRekening || ""}
                          onChange={(e) => updateCurrentDraft((p) => ({ ...p, slipRekening: e.target.value }))}
                          placeholder="Bank — No. Rekening"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Disiapkan oleh</label>
                        <Input
                          value={currentDraft.slipDisiapkanOleh || DEFAULT_ROBOTIC_PREPARER_LABEL}
                          onChange={(e) => updateCurrentDraft((p) => ({ ...p, slipDisiapkanOleh: e.target.value }))}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pengaturan Nomor Dokumen, Periode, Tanggal & Invoice */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-semibold text-slate-700">No. Invoice</label>
                        <button
                          type="button"
                          onClick={async () => {
                            const activeKop = currentDraft.kopSurat || activeMeta.defaultKop;
                            const totalAmt = currentDraft.items.reduce((s, it) => s + (Number(it.nominal) || 0), 0);
                            const res = await allocateOfficialDocNumberForEvidence({
                              kind: "INV",
                              entityCode: resolveEntityCodeFromKop(activeKop),
                              date: currentDraft.tanggalDokumen,
                              perihal: currentDraft.judulDokumen,
                              nominal: totalAmt,
                            });
                            if (!res.success || !("docNumber" in res)) {
                              setBanner({ type: "err", text: ("error" in res && res.error) || "Gagal mengambil nomor." });
                              return;
                            }
                            updateCurrentDraft((p) => ({ ...p, invoiceNo: res.docNumber }));
                            setBanner({ type: "ok", text: `Nomor Invoice resmi terdaftar: ${res.docNumber}` });
                            router.refresh();
                          }}
                          className="text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          + No. Resmi
                        </button>
                      </div>
                      <Input
                        value={currentDraft.invoiceNo || ""}
                        onChange={(e) => updateCurrentDraft((p) => ({ ...p, invoiceNo: e.target.value }))}
                        placeholder="Otomatis / klik + No. Resmi"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-semibold text-slate-700">No. Kwitansi / Slip</label>
                        <button
                          type="button"
                          onClick={async () => {
                            const activeKop = currentDraft.kopSurat || activeMeta.defaultKop;
                            const totalAmt = currentDraft.items.reduce((s, it) => s + (Number(it.nominal) || 0), 0);
                            const res = await allocateOfficialDocNumberForEvidence({
                              kind: "KW",
                              entityCode: resolveEntityCodeFromKop(activeKop),
                              date: currentDraft.tanggalDokumen,
                              perihal: currentDraft.judulDokumen,
                              nominal: totalAmt,
                            });
                            if (!res.success || !("docNumber" in res)) {
                              setBanner({ type: "err", text: ("error" in res && res.error) || "Gagal mengambil nomor." });
                              return;
                            }
                            updateCurrentDraft((p) => ({ ...p, kuitansiNoPrefix: res.docNumber }));
                            setBanner({ type: "ok", text: `Nomor resmi terdaftar di Buku Register: ${res.docNumber}` });
                            router.refresh();
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          + No. Resmi
                        </button>
                      </div>
                      <Input
                        value={currentDraft.kuitansiNoPrefix || ""}
                        onChange={(e) => updateCurrentDraft((p) => ({ ...p, kuitansiNoPrefix: e.target.value }))}
                        placeholder="KWT.2026.MM.DD.001 / + No. Resmi"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Periode Dokumen</label>
                      <Input
                        value={currentDraft.periodeLabel}
                        onChange={(e) => updateCurrentDraft((p) => ({ ...p, periodeLabel: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tanggal Pengesahan</label>
                      <Input
                        type="date"
                        value={currentDraft.tanggalDokumen}
                        onChange={(e) => updateCurrentDraft((p) => ({ ...p, tanggalDokumen: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {currentDraft.includeInvoice && (
                    <div className="space-y-2.5 pt-2.5 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-blue-900">
                        Pengaturan Invoice &amp; Rekening Penerima Transfer
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrentDraft((p) => ({
                              ...p,
                              bankAccount: DEFAULT_SNT_KORWIL_PROFILE.rekening,
                              bankHolder: DEFAULT_SNT_KORWIL_PROFILE.nama,
                            }))
                          }
                          className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[10px] font-semibold text-blue-900"
                        >
                          Rek. Korwil ({DEFAULT_SNT_KORWIL_PROFILE.rekening})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrentDraft((p) => ({
                              ...p,
                              bankAccount: DEFAULT_SNT_ADMIN_PROFILE.rekening,
                              bankHolder: DEFAULT_SNT_ADMIN_PROFILE.nama,
                            }))
                          }
                          className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-semibold text-emerald-900"
                        >
                          Rek. Admin ({DEFAULT_SNT_ADMIN_PROFILE.rekening})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrentDraft((p) => ({
                              ...p,
                              bankName: profile.reBankName || "BCA",
                              bankAccount: profile.reBankAccount || "7040827000",
                              bankHolder: profile.reBankHolder || "PT Jully Tjindrawan Robotik",
                            }))
                          }
                          className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] font-semibold text-slate-800"
                        >
                          Rek. Robotic (7040827000)
                        </button>
                      </div>
                    </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Ditagihkan Kepada</label>
                          <Input
                            value={currentDraft.ditagihkanKepada || "Yayasan Maleo Talenta Cendekia"}
                            onChange={(e) =>
                              updateCurrentDraft((p) => ({
                                ...p,
                                ditagihkanKepada: e.target.value,
                                sudahTerimaDari: e.target.value,
                              }))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Jatuh Tempo</label>
                          <Input
                            type="date"
                            value={currentDraft.jatuhTempo || ""}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, jatuhTempo: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">PPN (%)</label>
                          <select
                            value={currentDraft.ppnPct ?? 0}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, ppnPct: Number(e.target.value) || 0 }))}
                            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-xs font-semibold"
                          >
                            <option value={0}>0% (Non-PPN)</option>
                            <option value={11}>11% (PPN)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Bank Penerima</label>
                          <Input
                            value={currentDraft.bankName ?? ""}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, bankName: e.target.value }))}
                            placeholder="BCA / BANK MANDIRI"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">No. Rekening Penerima</label>
                          <Input
                            value={currentDraft.bankAccount ?? ""}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, bankAccount: e.target.value }))}
                            placeholder="No. rekening transfer..."
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Atas Nama Rekening Penerima
                          </label>
                          <Input
                            value={currentDraft.bankHolder ?? ""}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, bankHolder: e.target.value }))}
                            placeholder="PT Jully Tjindrawan Robotik / MALEO TALENTA CENDEKIA"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentDraft.includeDaftarTandaTerima && (
                    <div className="space-y-2.5 pt-2.5 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-cyan-900">
                        Pengaturan Tanda Terima
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Dibayarkan oleh (Teks Penandatangan Kiri)
                          </label>
                          <div className="grid grid-cols-1 gap-1.5">
                            {TANDA_TERIMA_PAYER_OPTIONS.map((opt) => {
                              const currentPayer = (
                                currentDraft.tandaTerimaDibayarkanOleh ??
                                currentDraft.slipDisiapkanOleh ??
                                DEFAULT_ROBOTIC_PREPARER_LABEL
                              ).trim();
                              const isSelected = currentPayer === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    updateCurrentDraft((p) => ({
                                      ...p,
                                      tandaTerimaDibayarkanOleh: opt,
                                    }))
                                  }
                                  className={`text-left px-2.5 py-1.5 rounded-md border text-[11px] font-semibold transition-colors flex items-center gap-2 ${
                                    isSelected
                                      ? "bg-cyan-700 text-white border-cyan-800 shadow-xs"
                                      : "bg-white text-slate-700 border-cyan-200 hover:bg-cyan-50"
                                  }`}
                                >
                                  <span
                                    className={`w-3 h-3 rounded-full border shrink-0 flex items-center justify-center ${
                                      isSelected ? "border-white bg-white" : "border-slate-400"
                                    }`}
                                  >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-700" />}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                          <Input
                            value={
                              currentDraft.tandaTerimaDibayarkanOleh ??
                              currentDraft.slipDisiapkanOleh ??
                              DEFAULT_ROBOTIC_PREPARER_LABEL
                            }
                            onChange={(e) =>
                              updateCurrentDraft((p) => ({ ...p, tandaTerimaDibayarkanOleh: e.target.value }))
                            }
                            placeholder={DEFAULT_ROBOTIC_PREPARER_LABEL}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Catatan Tanda Terima / Invoice
                          </label>
                          <Input
                            value={currentDraft.catatan || ""}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, catatan: e.target.value }))}
                            placeholder="Catatan opsional..."
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={currentDraft.showRabCode ?? true}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, showRabCode: e.target.checked }))}
                          />
                          <span>Tampilkan Kode RAB</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(currentDraft.includePphColumn)}
                            onChange={(e) => updateCurrentDraft((p) => ({ ...p, includePphColumn: e.target.checked }))}
                          />
                          <span>Tabel PPh % (Neto) pada Daftar Tanda Terima</span>
                        </label>
                        {currentDraft.includePphColumn && (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold text-slate-600">Tarif PPh (%):</span>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              step={0.5}
                              value={currentDraft.pphPct ?? 0}
                              onChange={(e) => updateCurrentDraft((p) => ({ ...p, pphPct: Number(e.target.value) || 0 }))}
                              className="w-16 h-7 px-1.5 border rounded bg-white text-xs text-center font-semibold"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabel Rincian Baris Pos RAB */}
                {(() => {
                  const isSingleSewaLoc =
                    activeRabCode === "3b" &&
                    SNT_WILAYAH_2_LOCATIONS.some((l) => l.id === sewaLocationFilter);
                  const visibleIndexedItems = currentDraft.items
                    .map((it, origIdx) => ({ it, origIdx }))
                    .filter(({ it }) =>
                      isSingleSewaLoc ? matchWilayah2LocationId(it.lokasi) === sewaLocationFilter : true
                    );
                  const visibleTotal = visibleIndexedItems.reduce(
                    (s, { it }) => s + (Number(it.nominal) || 0),
                    0
                  );
                  return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Rincian Item {activeMeta.displayCode}
                      {isSingleSewaLoc ? ` — ${activeSewaDraft.lokasiSnt}` : ""} ({visibleIndexedItems.length} baris)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateCurrentDraft((p) => ({
                          ...p,
                          items: [
                            ...p.items,
                            {
                              id: `line-${Date.now()}`,
                              tanggal: p.tanggalDokumen,
                              lokasi: isSingleSewaLoc ? activeSewaDraft.lokasiSnt : "Wilayah 2",
                              uraian: "",
                              penerima: isSingleSewaLoc
                                ? activeSewaDraft.namaPemilik || ""
                                : p.slipNamaPenerima || "",
                              volume: 1,
                              satuan: "bulan",
                              hargaSatuan: activeRabCode === "3b" ? 2000000 : 0,
                              nominal: activeRabCode === "3b" ? 2000000 : 0,
                            },
                          ],
                        }))
                      }
                      className="bg-white text-xs h-7 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 border-b text-slate-700">
                        <tr>
                          <th className="py-2 px-2">Tanggal &amp; Lokasi</th>
                          <th className="py-2 px-2">Uraian &amp; Penerima</th>
                          <th className="py-2 px-2 text-center">Vol × Harga</th>
                          <th className="py-2 px-2 text-right">Jumlah</th>
                          <th className="py-2 px-2 text-center">Pelaporan RAB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {visibleIndexedItems.map(({ it, origIdx }) => {
                          const patchItem = (patch: Partial<EvidenceLineItem>) => {
                            updateCurrentDraft((p) => {
                              const next = [...p.items];
                              const merged = { ...it, ...patch };
                              if (patch.volume !== undefined || patch.hargaSatuan !== undefined) {
                                merged.nominal = Math.round(
                                  (Number(merged.volume) || 0) * (Number(merged.hargaSatuan) || 0)
                                );
                              }
                              next[origIdx] = merged;
                              return { ...p, items: next };
                            });
                          };
                          const lineDesc = it.uraian || activeMeta.shortTitle;
                          const lineRec = checkGenericLineRecorded(activeRabCode, it.id, lineDesc, it.nominal);

                          return (
                            <tr key={it.id || origIdx} className={lineRec.isRecorded ? "bg-emerald-50/30" : ""}>
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
                                  placeholder="Uraian kegiatan / pembayaran..."
                                  className="w-full min-w-[180px] border rounded px-1.5 py-1 text-xs"
                                />
                                <input
                                  type="text"
                                  value={it.penerima}
                                  onChange={(e) => patchItem({ penerima: e.target.value })}
                                  placeholder={
                                    currentDraft.recipientMode === "BLANK"
                                      ? "(Mode Blanko: akan dicetak garis kosong)"
                                      : "Nama penerima..."
                                  }
                                  className="w-full border rounded px-1.5 py-0.5 text-[11px] text-slate-600"
                                />
                                {it.receiptUrls && it.receiptUrls.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {normalizeReceiptUrlList(it.receiptUrls).map((url, rIdx) => {
                                      const isPdf = url.toLowerCase().split("?")[0].endsWith(".pdf");
                                      return (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-semibold text-amber-900"
                                        >
                                          <Paperclip className="w-2.5 h-2.5" />
                                          Receipt {rIdx + 1} ({isPdf ? "PDF" : "Foto"})
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td className="py-1.5 px-1 text-center space-y-1">
                                <div className="flex items-center gap-1 justify-center">
                                  <input
                                    type="number"
                                    step="0.5"
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
                                  {lineRec.isRecorded ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300"
                                      title={`Sudah tercatat pada ${activeMeta.displayCode} (PELAPORAN)${lineRec.noKwitansi ? ` · ${lineRec.noKwitansi}` : ""}`}
                                    >
                                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Masuk SPJ
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={recordingId === it.id || it.nominal <= 0}
                                      onClick={() =>
                                        handleRecordLineToRab(
                                          it.id,
                                          activeRabCode,
                                          it.tanggal,
                                          lineDesc,
                                          it.nominal,
                                          { localRecordKey: lineRec.localKey }
                                        )
                                      }
                                      className="px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold disabled:opacity-40"
                                      title={`Catat baris ini ke Pelaporan ${activeMeta.displayCode}`}
                                    >
                                      {recordingId === it.id ? "..." : "+ SPJ"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCurrentDraft((p) => ({
                                        ...p,
                                        items: p.items.filter((_, i) => i !== origIdx),
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
                            TOTAL {activeMeta.displayCode}
                            {isSingleSewaLoc ? ` (${activeSewaDraft.lokasiSnt})` : ""}:
                          </td>
                          <td className="py-2 px-2 text-right text-blue-800 whitespace-nowrap">
                            {formatCurrency(visibleTotal)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
