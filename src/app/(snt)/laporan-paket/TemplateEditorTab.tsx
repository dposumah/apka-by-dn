"use client";

import React, { useState } from "react";
import { Save, Printer, CheckCircle2, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { saveSntReportDraft } from "@/app/actions/snt-reports";
import {
  LocationActivityRow,
  RabRealizationSummary,
  SNT_REPORT_TEMPLATES,
  SNT_WILAYAH_2_LOCATIONS,
  SntFasilitatorRecord,
  SntTemplateCode,
} from "@/lib/snt-report-templates";

interface TemplateEditorTabProps {
  periodKey: string;
  draftsMap: Record<string, Record<string, unknown>>;
  savedTemplateCodes: Set<string>;
  rabSummary: RabRealizationSummary;
  locationStats: LocationActivityRow[];
  fasilitators: SntFasilitatorRecord[];
  onDraftSaved: (templateCode: SntTemplateCode, content: Record<string, unknown>) => void;
  onQuickExportSingle: (templateCode: SntTemplateCode) => void;
}

export function TemplateEditorTab({
  periodKey,
  draftsMap,
  savedTemplateCodes,
  rabSummary,
  locationStats,
  fasilitators,
  onDraftSaved,
  onQuickExportSingle,
}: TemplateEditorTabProps) {
  const [activeCode, setActiveCode] = useState<SntTemplateCode>("13");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activeMeta = SNT_REPORT_TEMPLATES.find((t) => t.code === activeCode) || SNT_REPORT_TEMPLATES[0];
  const currentDraft: Record<string, unknown> = draftsMap[activeCode] || {};

  const getBoolMap = (key: string): Record<string, boolean> => {
    const val = currentDraft[key];
    return val && typeof val === "object" ? (val as Record<string, boolean>) : {};
  };

  const getSkorMap = (): Record<string, Record<string, string | number>> => {
    const val = currentDraft.skorMonev;
    return val && typeof val === "object"
      ? (val as Record<string, Record<string, string | number>>)
      : {};
  };

  const getTotMap = (): Record<string, Record<string, string>> => {
    const val = currentDraft.matriksTot;
    return val && typeof val === "object"
      ? (val as Record<string, Record<string, string>>)
      : {};
  };

  const updateField = (key: string, value: unknown) => {
    onDraftSaved(activeCode, { ...currentDraft, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const storagePeriod = activeMeta.hasPeriodSelector ? periodKey : "DEFAULT";
      const res = await saveSntReportDraft({
        templateCode: activeCode,
        periodKey: storagePeriod,
        title: activeMeta.fullTitle,
        content: currentDraft,
      });
      if (!res.success) {
        setSaveMessage(`Gagal menyimpan: ${res.error}`);
        return;
      }
      setSaveMessage(`Draft ${activeMeta.shortTitle} berhasil disimpan ke database.`);
    } finally {
      setIsSaving(false);
    }
  };

  const checklist13 = [
    { key: "sk", label: "Kontrak, SK, dan surat tugas personel lengkap" },
    { key: "absensi", label: "Absensi dan log jam kerja fasilitator/personel" },
    { key: "transfer", label: "Bukti transfer honor dan gaji" },
    { key: "nota", label: "Kuitansi, nota, dan invoice nonpersonel" },
    { key: "perjadin", label: "Bukti perjalanan dinas Korwil (SPD, tiket, bill hotel)" },
    { key: "tot", label: "Daftar hadir pelatihan dan sertifikat ToT STEM.org" },
    { key: "lms", label: "Invoice LMS dan layanan langganan" },
    { key: "pajak", label: "Pajak (PPN, PPh) disetor dan bukti pembayaran tersedia" },
  ];

  const checklist01 = [
    { key: "pks", label: "Perjanjian Kerja Sama Swakelola yang telah ditandatangani" },
    { key: "mitra", label: "Bukti kerja sama dengan yayasan/mitra modul pembelajaran" },
    { key: "skAhu", label: "SK AHU atau Akta Yayasan (Ketua Tim Pelaksana)" },
    { key: "cv", label: "Surat penugasan dan CV personel beserta bukti kualifikasi" },
    { key: "jadwalTot", label: "Jadwal ToT IN-1 dan daftar calon fasilitator Wilayah 2" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Navigasi 8 Template */}
      <div className="lg:col-span-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
          Pilih Template Wilayah 2 (8 Dokumen)
        </div>
        {SNT_REPORT_TEMPLATES.map((tpl) => {
          const isActive = tpl.code === activeCode;
          const isSaved = savedTemplateCodes.has(tpl.code);
          return (
            <button
              key={tpl.code}
              type="button"
              onClick={() => {
                setActiveCode(tpl.code);
                setSaveMessage(null);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-blue-50 border-blue-400 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                  {tpl.shortTitle}
                </span>
                <Badge variant={tpl.group === "KEUANGAN" ? "default" : "secondary"} className="text-[10px]">
                  {tpl.group}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span>KAK {tpl.dasarKak} · {tpl.waktu}</span>
                {isSaved && (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Tersimpan
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Editor Template Aktif */}
      <div className="lg:col-span-8">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-4 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base font-bold text-slate-900">
                  {activeMeta.fullTitle}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Angka RAB, transaksi, fasilitator, dan laporan kegiatan ditarik otomatis dari database. Lengkapi bagian narasi/checklist di bawah ini lalu simpan draft.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onQuickExportSingle(activeCode)}
                className="bg-white text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Preview PDF
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Draft
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {saveMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-xs font-medium">
                {saveMessage}
              </div>
            )}

            {/* TEMPLATE 13: LAPORAN PENGGUNAAN DANA */}
            {activeCode === "13" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="text-[11px] text-slate-500">Pagu RAB A+B (Aktif)</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatCurrency(rabSummary.grandTotalBudget)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-[11px] text-blue-700">Realisasi Kumulatif</div>
                    <div className="text-sm font-bold text-blue-800 mt-0.5">
                      {formatCurrency(rabSummary.grandTotalRealizedTotal)} ({rabSummary.overallSerapanPct.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] text-emerald-700">Serapan vs Termin I</div>
                    <div className="text-sm font-bold text-emerald-800 mt-0.5">
                      {rabSummary.serapanTerhadapTermin1Pct.toFixed(1)}% {rabSummary.eligibleForTermin2 ? "(>=80%)" : "(<80%)"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Label Periode (tampil di Identitas Template 13)
                  </label>
                  <Input
                    value={String(currentDraft.periodeLabel || "")}
                    onChange={(e) => updateField("periodeLabel", e.target.value)}
                    placeholder="Contoh: Tahap I (September – November 2026)"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Daftar Periksa Bukti (Bagian 3 Template 13)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {checklist13.map((c) => {
                      const boolMap = getBoolMap("checklistBukti");
                      const checked = Boolean(boolMap[c.key]);
                      return (
                        <label
                          key={c.key}
                          className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              updateField("checklistBukti", {
                                ...boolMap,
                                [c.key]: e.target.checked,
                              })
                            }
                            className="mt-0.5"
                          />
                          <span>{c.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Tambahan Pertanggungjawaban Dana
                  </label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.catatanTambahan || "")}
                    onChange={(e) => updateField("catatanTambahan", e.target.value)}
                    placeholder="Misal: Seluruh bukti transfer & kwitansi fisik juga diarsipkan pada Google Drive bendahara..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 01: LAPORAN PENDAHULUAN */}
            {activeCode === "01" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Laporan Pendahuluan</label>
                  <Input
                    value={String(currentDraft.nomorLaporan || "")}
                    onChange={(e) => updateField("nomorLaporan", e.target.value)}
                    placeholder="Contoh: 001/LAP-PENDAHULUAN/SNT-W2/IX/2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latar Belakang</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.latarBelakang || "")}
                    onChange={(e) => updateField("latarBelakang", e.target.value)}
                    placeholder="Ringkas latar belakang program SNT, Permendikdasmen No. 13/2025, kebutuhan fasilitator..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maksud &amp; Tujuan</label>
                  <textarea
                    rows={2}
                    value={String(currentDraft.maksudTujuan || "")}
                    onChange={(e) => updateField("maksudTujuan", e.target.value)}
                    placeholder="Maksud dan tujuan pelaksanaan Wilayah 2..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Checklist Lampiran Syarat Termin I
                  </label>
                  <div className="space-y-1.5">
                    {checklist01.map((c) => {
                      const boolMap = getBoolMap("lampiranTermin1");
                      const checked = Boolean(boolMap[c.key]);
                      return (
                        <label key={c.key} className="flex items-center gap-2 text-xs text-slate-700 p-2 rounded border bg-slate-50/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              updateField("lampiranTermin1", {
                                ...boolMap,
                                [c.key]: e.target.checked,
                              })
                            }
                          />
                          <span>{c.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE 02: LAPORAN BULANAN */}
            {activeCode === "02" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Laporan Bulanan ke-</label>
                    <Input
                      value={String(currentDraft.laporanKe || "")}
                      onChange={(e) => updateField("laporanKe", e.target.value)}
                      placeholder="1 / 2 / 3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Laporan</label>
                    <Input
                      value={String(currentDraft.nomorLaporan || "")}
                      onChange={(e) => updateField("nomorLaporan", e.target.value)}
                      placeholder="LAP/SNT-W2/LB-02/2026"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Capaian Utama Bulan Ini</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.ringkasanCapaian || "")}
                    onChange={(e) => updateField("ringkasanCapaian", e.target.value)}
                    placeholder="Kosongkan untuk menggunakan ringkasan otomatis dari jumlah fasilitator, JP, dan serapan dana."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kendala &amp; Solusi</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.kendalaSolusi || "")}
                    onChange={(e) => updateField("kendalaSolusi", e.target.value)}
                    placeholder="Uraikan kendala utama di 6 lokasi Wilayah 2 dan tindak lanjutnya..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rencana Kerja Bulan Berikutnya</label>
                  <textarea
                    rows={2}
                    value={String(currentDraft.rencanaBulanDepan || "")}
                    onChange={(e) => updateField("rencanaBulanDepan", e.target.value)}
                    placeholder="Agenda pelatihan, kunjungan monev, pengadaan perangkat, dsb."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 03: LAPORAN AKHIR */}
            {activeCode === "03" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Laporan Akhir</label>
                  <Input
                    value={String(currentDraft.nomorLaporan || "")}
                    onChange={(e) => updateField("nomorLaporan", e.target.value)}
                    placeholder="LAP/SNT-W2/LA-FINAL/2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Eksekutif</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.ringkasanEksekutif || "")}
                    onChange={(e) => updateField("ringkasanEksekutif", e.target.value)}
                    placeholder="Kosongkan untuk auto-isi dari rekap capaian & serapan Wilayah 2..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Narasi Pelaksanaan Pekerjaan (Bab I–II)</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.narasiPelaksanaan || "")}
                    onChange={(e) => updateField("narasiPelaksanaan", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capaian Keluaran &amp; Outcome (Bab III–IV)</label>
                  <textarea
                    rows={2}
                    value={String(currentDraft.capaianKeluaran || "")}
                    onChange={(e) => updateField("capaianKeluaran", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kendala, Solusi &amp; Rekomendasi Keberlanjutan</label>
                  <textarea
                    rows={2}
                    value={String(currentDraft.rekomendasi || "")}
                    onChange={(e) => updateField("rekomendasi", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 04: KOMPILASI FASILITATOR */}
            {activeCode === "04" && (
              <div className="space-y-4">
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="py-2 px-3">Lokasi SNT (Wilayah 2)</th>
                        <th className="py-2 px-3 text-center">Fasilitator</th>
                        <th className="py-2 px-3 text-center">Lap. Kegiatan</th>
                        <th className="py-2 px-3 text-center">Rekap Honor</th>
                        <th className="py-2 px-3 text-center">JP Intra / Ekstra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {locationStats.map((l) => (
                        <tr key={l.locationId}>
                          <td className="py-2 px-3 font-medium">{l.label}</td>
                          <td className="py-2 px-3 text-center">{l.fasilitatorCount}</td>
                          <td className="py-2 px-3 text-center">{l.laporanCount}</td>
                          <td className="py-2 px-3 text-center">{l.rekapCount}</td>
                          <td className="py-2 px-3 text-center">{l.totalJpIntra} / {l.totalJpEkstra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Kompilasi Fasilitator</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.catatanKompilasi || "")}
                    onChange={(e) => updateField("catatanKompilasi", e.target.value)}
                    placeholder="Tambahkan ringkasan status ketepatan waktu pelaporan atau tautan folder dokumentasi Drive..."
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 11: MONEV KORWIL */}
            {activeCode === "11" && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-700">
                  Skor Monitoring &amp; Evaluasi 6 Lokasi SNT Wilayah 2 (Skala 1–4)
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="py-2 px-2">SNT</th>
                        <th className="py-2 px-1 text-center">Pemb.</th>
                        <th className="py-2 px-1 text-center">Hadir</th>
                        <th className="py-2 px-1 text-center">Sarana</th>
                        <th className="py-2 px-1 text-center">Murid</th>
                        <th className="py-2 px-1 text-center">Lomba</th>
                        <th className="py-2 px-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {SNT_WILAYAH_2_LOCATIONS.map((loc) => {
                        const skorAll = getSkorMap();
                        const row = skorAll[loc.id] || {};
                        const setCell = (field: string, val: string | number) =>
                          updateField("skorMonev", {
                            ...skorAll,
                            [loc.id]: { ...row, [field]: val },
                          });
                        return (
                          <tr key={loc.id}>
                            <td className="py-1.5 px-2 font-medium whitespace-nowrap">{loc.label}</td>
                            {(["pemb", "hadir", "sarana", "murid", "lomba"] as const).map((col) => (
                              <td key={col} className="py-1.5 px-1 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  max={4}
                                  value={row[col] ?? ""}
                                  onChange={(e) => setCell(col, Number(e.target.value) || "")}
                                  className="w-11 border rounded px-1 py-1 text-center text-xs"
                                />
                              </td>
                            ))}
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.catatan || ""}
                                onChange={(e) => setCell("catatan", e.target.value)}
                                placeholder="Catatan..."
                                className="w-full min-w-[120px] border rounded px-2 py-1 text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kesimpulan &amp; Rekomendasi Korwil</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.kesimpulanRekomendasi || "")}
                    onChange={(e) => updateField("kesimpulanRekomendasi", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 12: LAPORAN HASIL PEKERJAAN */}
            {activeCode === "12" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Realisasi Kelengkapan Dokumen</label>
                  <Input
                    value={String(currentDraft.realisasiDokumen || "")}
                    onChange={(e) => updateField("realisasiDokumen", e.target.value)}
                    placeholder="Contoh: Lengkap (Laporan Pendahuluan, Bulanan 1–3, Laporan Akhir & Penggunaan Dana)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kesimpulan Hasil Pekerjaan</label>
                  <textarea
                    rows={4}
                    value={String(currentDraft.kesimpulan || "")}
                    onChange={(e) => updateField("kesimpulan", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 14: KUALIFIKASI ToT */}
            {activeCode === "14" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Pelaksanaan Pelatihan ToT</label>
                  <Input
                    value={String(currentDraft.periodeTot || "")}
                    onChange={(e) => updateField("periodeTot", e.target.value)}
                    placeholder="Contoh: 15 September – 7 Oktober 2026"
                  />
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="py-2 px-2">Fasilitator</th>
                        <th className="py-2 px-1 text-center">IN-1</th>
                        <th className="py-2 px-1 text-center">ON</th>
                        <th className="py-2 px-1 text-center">IN-2</th>
                        <th className="py-2 px-2">No. Sertifikat STEM.org</th>
                        <th className="py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fasilitators.map((f) => {
                        const totAll = getTotMap();
                        const row = totAll[f.id] || {};
                        const setCell = (field: string, val: string) =>
                          updateField("matriksTot", {
                            ...totAll,
                            [f.id]: { ...row, [field]: val },
                          });
                        return (
                          <tr key={f.id}>
                            <td className="py-1.5 px-2">
                              <div className="font-medium text-slate-800">{f.namaLengkap}</div>
                              <div className="text-[10px] text-slate-400">{f.lokasiSNT || "-"}</div>
                            </td>
                            {(["in1", "on", "in2"] as const).map((col) => (
                              <td key={col} className="py-1.5 px-1 text-center">
                                <input
                                  type="text"
                                  value={row[col] || ""}
                                  onChange={(e) => setCell(col, e.target.value)}
                                  placeholder="Jam"
                                  className="w-12 border rounded px-1 py-1 text-center text-xs"
                                />
                              </td>
                            ))}
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.certNo || ""}
                                onChange={(e) => setCell("certNo", e.target.value)}
                                placeholder="No sertifikat..."
                                className="w-full min-w-[130px] border rounded px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.status || "Lulus"}
                                onChange={(e) => setCell("status", e.target.value)}
                                className="border rounded px-1.5 py-1 text-xs bg-white"
                              >
                                <option value="Lulus">Lulus</option>
                                <option value="Berjalan">Berjalan</option>
                                <option value="Remedial">Remedial</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluasi &amp; Tindak Lanjut Pelatihan</label>
                  <textarea
                    rows={3}
                    value={String(currentDraft.evaluasiTot || "")}
                    onChange={(e) => updateField("evaluasiTot", e.target.value)}
                    className="w-full rounded-md border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
