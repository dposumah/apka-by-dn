"use client";

import { useState } from "react";
import { Globe, Sparkles, TrendingUp, Calculator } from "lucide-react";
import IyrcPnLTab from "@/components/cashflow/IyrcPnLTab";
import IyrcRabTab from "@/components/cashflow/IyrcRabTab";
import { formatCurrency } from "@/lib/format";
import { IYRC_PNL_VERSION, IYRC_PROFIT_LOSS_TOTALS } from "@/lib/iyrc-utils";

export default function IyrcClientPage({ initialData }: { initialData?: any }) {
  const [activeTab, setActiveTab] = useState<"pnl" | "rab">("pnl");

  return (
    <div className="space-y-6">
      {/* Top Banner & Header (Fokus Laba Rugi & RAB upNov26) */}
      <div className="no-print bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Globe size={240} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-indigo-200">
                <Sparkles size={13} className="text-amber-300" /> The 14th IYRC China 2026 – Shenzhen
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-[11px] font-bold text-emerald-200">
                Update Keuangan: {IYRC_PNL_VERSION}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Laba Rugi &amp; RAB – IYRC China 2026
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              SNT Wilayah 2, Pengadaan Kit SNT, Gretha (Pemda Kab. Kupang) &amp; Tunas Bangsa · Terhubung otomatis ke Cashflow Proyek &amp; Jurnal Umum
            </p>
          </div>

          {/* Ringkasan Cepat Pagu upNov26 di Header */}
          <div className="grid grid-cols-3 gap-2.5 bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-3.5 text-xs shrink-0">
            <div>
              <div className="text-[10px] uppercase font-semibold text-indigo-200">Pendapatan</div>
              <div className="font-mono font-extrabold text-emerald-300 text-sm mt-0.5">
                {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalRevenueBudget)}
              </div>
            </div>
            <div className="border-l border-white/15 pl-2.5">
              <div className="text-[10px] uppercase font-semibold text-indigo-200">Pagu Biaya</div>
              <div className="font-mono font-extrabold text-rose-200 text-sm mt-0.5">
                {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget)}
              </div>
            </div>
            <div className="border-l border-white/15 pl-2.5">
              <div className="text-[10px] uppercase font-semibold text-indigo-200">Laba Proyeksi</div>
              <div className="font-mono font-extrabold text-amber-300 text-sm mt-0.5">
                {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.projectedProfit)}{" "}
                <span className="text-[10px] font-bold text-indigo-200">
                  ({IYRC_PROFIT_LOSS_TOTALS.projectedMarginPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Tab Fokus Utama: Laba Rugi (Default) & RAB */}
        <div className="relative z-10 flex overflow-x-auto gap-2 pt-6 mt-6 border-t border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("pnl")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "pnl"
                ? "bg-white text-indigo-900 shadow-md font-bold"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <TrendingUp size={15} /> Laba Rugi &amp; Pengeluaran
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === "pnl"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              upNov26
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rab")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "rab"
                ? "bg-white text-indigo-900 shadow-md font-bold"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Calculator size={15} /> RAB &amp; Asumsi Proyek
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === "rab"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-white/15 text-indigo-100"
              }`}
            >
              upNov26
            </span>
          </button>
        </div>
      </div>

      {/* TAB DEFAULT: LABA RUGI & PENGELUARAN (upNov26) */}
      {activeTab === "pnl" && (
        <IyrcPnLTab
          iyrcProject={initialData?.iyrcProject}
          initialTransactions={initialData?.iyrcTransactions || []}
          coaAccounts={initialData?.coaAccounts || []}
        />
      )}

      {/* TAB 2: RAB & ASUMSI PROYEK (upNov26) */}
      {activeTab === "rab" && <IyrcRabTab />}
    </div>
  );
}
