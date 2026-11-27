"use client";

import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  RotateCcw,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { generateSntEfficiencyRecommendation } from "@/app/actions/snt-reports";
import { computeTarget80Strategy } from "@/lib/snt-evidence-docs";
import { RabRealizationSummary } from "@/lib/snt-report-templates";

interface TargetStrategyTabProps {
  rabSummary: RabRealizationSummary;
  onJumpToRabPos: (rabCode: string) => void;
}

export function TargetStrategyTab({
  rabSummary,
  onJumpToRabPos,
}: TargetStrategyTabProps) {
  const strategy = useMemo(() => computeTarget80Strategy(rabSummary), [rabSummary]);

  const [simAdditions, setSimAdditions] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const row of strategy.rows) {
      initial[row.rabItemId] = row.recommendedAdd;
    }
    return initial;
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ source: string; markdown: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const simTotalAdd = useMemo(
    () => Object.values(simAdditions).reduce((s, v) => s + (Number(v) || 0), 0),
    [simAdditions]
  );

  const simTotalRealized = strategy.currentRealized + simTotalAdd;
  const simPct =
    strategy.totalBudget > 0 ? (simTotalRealized / strategy.totalBudget) * 100 : 0;
  const simPass80 = simPct >= 80;

  const applyRecommendedPreset = () => {
    const next: Record<string, number> = {};
    for (const row of strategy.rows) {
      next[row.rabItemId] = row.recommendedAdd;
    }
    setSimAdditions(next);
  };

  const resetSimulation = () => {
    const next: Record<string, number> = {};
    for (const row of strategy.rows) {
      next[row.rabItemId] = 0;
    }
    setSimAdditions(next);
  };

  const handleRunAiAdvisor = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const topRemainingItems = [...strategy.rows]
        .filter((r) => r.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, 10)
        .map((r) => ({
          code: r.rabCode,
          name: r.rabName,
          remaining: r.remaining,
          marginLeverage: r.marginLeverage,
          requiredEvidence: r.requiredEvidence,
        }));

      const res = await generateSntEfficiencyRecommendation({
        totalBudget: strategy.totalBudget,
        currentRealized: strategy.currentRealized,
        target80Amount: strategy.target80Amount,
        internalDeliverablePotential: strategy.internalDeliverablePotential,
        topRemainingItems,
      });

      if (!res.success || !("markdown" in res) || !res.markdown || !res.source) {
        setAiError(("error" in res && res.error) ? res.error : "Gagal memuat rekomendasi AI.");
        return;
      }

      setAiResult({ source: res.source, markdown: res.markdown });
    } finally {
      setAiLoading(false);
    }
  };

  const leverageBadge = (kind: string) => {
    if (kind === "INTERNAL_DELIVERABLE") {
      return (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Deliverable / SDM Internal (Margin Tinggi)
        </span>
      );
    }
    if (kind === "EFISIENSI_VENDOR") {
      return (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          Efisiensi Negosiasi / Adendum Sah
        </span>
      );
    }
    return (
      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        Operasional Riil Lapangan
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Target > 80% & Simulasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">Target Minimal &gt; 80% RAB (A+B)</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(strategy.target80Amount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Dari pagu {formatCurrency(strategy.totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-rose-700">Gap Saat Ini Menuju 80%</div>
            <div className="text-xl font-bold text-rose-800 mt-1">
              {formatCurrency(strategy.gapTo80)}
            </div>
            <div className="text-[11px] text-rose-600 mt-0.5">
              Realisasi kini: {formatCurrency(strategy.currentRealized)} ({strategy.currentPct.toFixed(1)}%)
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-emerald-800">Potensi Deliverable / SDM Internal</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {formatCurrency(strategy.internalDeliverablePotential)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Pos A.1, A.2, A.3, B.4a, B.5a, B.6a (surplus sah)
            </div>
          </CardContent>
        </Card>
        <Card className={simPass80 ? "border-blue-300 bg-blue-50/60" : "border-amber-300 bg-amber-50/60"}>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-700">Hasil Simulasi Serapan</div>
            <div className={`text-xl font-bold mt-1 ${simPass80 ? "text-blue-800" : "text-amber-800"}`}>
              {simPct.toFixed(1)}% {simPass80 ? "✓ Lolos >80%" : "Belum 80%"}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Proyeksi: {formatCurrency(simTotalRealized)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar Visual */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              Progres Realisasi Aktual ({strategy.currentPct.toFixed(1)}%) vs Proyeksi Simulasi ({simPct.toFixed(1)}%)
            </span>
            <span className="font-semibold text-emerald-700">Garis Target Minimal: 80%</span>
          </div>
          <div className="relative h-5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            {/* Proyeksi Simulasi */}
            <div
              className="absolute inset-y-0 left-0 bg-blue-200 transition-all duration-300"
              style={{ width: `${Math.min(100, simPct)}%` }}
            />
            {/* Realisasi Aktual */}
            <div
              className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, strategy.currentPct)}%` }}
            />
            {/* Garis 80% */}
            <div
              className="absolute inset-y-0 w-0.5 bg-emerald-600 z-10"
              style={{ left: "80%" }}
              title="Target 80%"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Realisasi Tercatat ({formatCurrency(strategy.currentRealized)})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-200 inline-block border border-blue-400" /> Simulasi Tambahan (+{formatCurrency(simTotalAdd)})
              </span>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={applyRecommendedPreset} className="h-7 text-xs bg-white gap-1">
                <TrendingUp className="w-3 h-3" /> Isi Preset Rekomendasi (&gt;80%)
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={resetSimulation} className="h-7 text-xs gap-1">
                <RotateCcw className="w-3 h-3" /> Reset 0
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel Rekomendasi AI Efisiensi & Margin Aman Audit */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-emerald-50/40">
        <CardHeader className="py-4 px-5 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Rekomendasi AI: Optimalisasi Serapan &gt; 80% &amp; Efisiensi Margin (Aman Audit PPK)
              </CardTitle>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Fokus pada strategi surplus legal (deliverable/tim internal, negosiasi vendor, &amp; pergeseran pos/adendum resmi ke PPK) tanpa risiko temuan audit bukti.
            </p>
          </div>
          <Button
            type="button"
            disabled={aiLoading}
            onClick={handleRunAiAdvisor}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shrink-0"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiLoading ? "Menganalisis RAB..." : "Generate Rekomendasi AI"}
          </Button>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Prinsip Kepatuhan Audit PPK &amp; Surplus Sehat:</strong> Margin/surplus proyek Swakelola paling aman diraih dengan mengeksekusi penuh <strong>pos deliverable &amp; SDM internal</strong> (A.1 Ketua Tim, A.2 Modul 40+40, A.3 Korwil, B.4a Narasumber, B.5a LMS, B.6a Pembinaan Kompetisi) serta efisiensi belanja riil. Hindari menggunakan kwitansi satu pos untuk menutupi pengeluaran pos lain (mis. kwitansi sewa rumah untuk transport) karena berisiko temuan audit — bila ada penghematan di pos sewa rumah, ajukan <strong>adendum / pergeseran antarpos RAB resmi</strong> kepada PPK.
            </div>
          </div>

          {aiError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {aiError}
            </div>
          )}

          {aiResult && (
            <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800">Hasil Analisis Strategi RAB</span>
                <Badge variant="secondary" className="text-[10px]">
                  Sumber: {aiResult.source === "gemini-ai" ? "Gemini AI" : "Analisis Terstruktur"}
                </Badge>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {aiResult.markdown}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel Simulasi & Aksi Cepat per Pos RAB */}
      <Card>
        <CardHeader className="py-3.5 px-5 bg-slate-50 border-b">
          <CardTitle className="text-sm font-bold text-slate-900">
            Peta Aksi Peningkatan Realisasi, Strategi Efisiensi &amp; Bukti Wajib per Pos RAB
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 border-b text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Pos RAB &amp; Strategi Efisiensi</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Sisa Pagu</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Simulasi Tambah (Rp)</th>
                <th className="py-2.5 px-3">Bukti Wajib (Template 13)</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Siapkan Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {strategy.rows.map((row) => (
                <tr key={row.rabItemId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 max-w-md">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900">
                        {row.rabCode} - {row.rabName}
                      </span>
                      {leverageBadge(row.marginLeverage)}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {row.efficiencyTip}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{formatCurrency(row.remaining)}</div>
                    <div className="text-[10px] text-slate-400">
                      Kini: {formatCurrency(row.realized)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <input
                      type="number"
                      min={0}
                      max={row.remaining}
                      value={simAdditions[row.rabItemId] ?? 0}
                      onChange={(e) =>
                        setSimAdditions((prev) => ({
                          ...prev,
                          [row.rabItemId]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-32 border rounded px-2 py-1 text-right text-xs font-semibold bg-white"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs">
                    {row.requiredEvidence}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onJumpToRabPos(row.rabCode)}
                      className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 text-[11px] h-7 gap-1"
                    >
                      <span>Siapkan</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
