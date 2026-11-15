"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Landmark,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { formatForeignCurrency } from "@/lib/cashflow-invoice";
import {
  IYRC_EXPENSE_BUDGET_POSITIONS,
  IYRC_PNL_VERSION,
  IYRC_PROGRAM_BREAKDOWN,
  IYRC_PROFIT_LOSS_TOTALS,
  IYRC_REVENUE_ITEMS,
  IYRC_UNBUDGETED_NOTES,
} from "@/lib/iyrc-utils";
import { deleteCashflowTransaction } from "@/actions/cashflow";
import { resyncIyrcCashflowAndJournals } from "@/actions/iyrc";
import TransactionForm from "@/components/cashflow/TransactionForm";
import MarkPaidModal, {
  CashflowCoaOption,
  CashflowTxRecord,
} from "@/components/cashflow/MarkPaidModal";
import InvoiceWhatsappModal from "@/components/cashflow/InvoiceWhatsappModal";

interface CashflowProjectOption {
  id: string;
  name: string;
  description?: string | null;
}

interface IyrcPnLTabProps {
  iyrcProject?: CashflowProjectOption | null;
  initialTransactions: CashflowTxRecord[];
  coaAccounts: CashflowCoaOption[];
}

export default function IyrcPnLTab({
  iyrcProject,
  initialTransactions,
  coaAccounts,
}: IyrcPnLTabProps) {
  const router = useRouter();
  const [txFilter, setTxFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("EXPENSE");
  const [showFormModal, setShowFormModal] = useState(false);
  const [autoOpenScanner, setAutoOpenScanner] = useState(false);
  const [editingTx, setEditingTx] = useState<CashflowTxRecord | null>(null);
  const [defaultBudgetPos, setDefaultBudgetPos] = useState<string>("");
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [markPaidTx, setMarkPaidTx] = useState<CashflowTxRecord | null>(null);
  const [waModalTx, setWaModalTx] = useState<CashflowTxRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const projectsList = useMemo(
    () => (iyrcProject ? [iyrcProject] : []),
    [iyrcProject]
  );

  // Ringkasan Keuangan Realisasi vs Target/Pagu
  const summary = useMemo(() => {
    const incomes = initialTransactions.filter((t) => t.type === "INCOME");
    const expenses = initialTransactions.filter((t) => t.type === "EXPENSE");

    const incomeCompleted = incomes
      .filter((t) => t.status === "COMPLETED")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const incomePending = incomes
      .filter((t) => t.status === "PENDING")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalTaxWithheld = incomes.reduce(
      (s, t) => s + (Number(t.taxWithheldAmount) || 0),
      0
    );

    const expenseCompleted = expenses
      .filter((t) => t.status === "COMPLETED")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expensePending = expenses
      .filter((t) => t.status === "PENDING")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const completedCount = initialTransactions.filter(
      (t) => t.status === "COMPLETED"
    ).length;
    const syncedJournalCount = initialTransactions.filter(
      (t) => t.status === "COMPLETED" && Boolean(t.journalEntry?.id)
    ).length;

    return {
      incomeCompleted,
      incomePending,
      totalIncomeContract: incomeCompleted + incomePending,
      totalTaxWithheld,
      expenseCompleted,
      expensePending,
      totalExpenseCommitted: expenseCompleted + expensePending,
      actualCashProfit: incomeCompleted - expenseCompleted,
      remainingExpenseBudget:
        IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget - (expenseCompleted + expensePending),
      completedCount,
      syncedJournalCount,
    };
  }, [initialTransactions]);

  // Realisasi per Pos Biaya Excel
  const posStats = useMemo(() => {
    return IYRC_EXPENSE_BUDGET_POSITIONS.map((pos) => {
      const matching = initialTransactions.filter(
        (t) => t.type === "EXPENSE" && (t.iyrcBudgetPos || "TAMBAHAN") === pos.key
      );
      const completed = matching
        .filter((t) => t.status === "COMPLETED")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const pending = matching
        .filter((t) => t.status === "PENDING")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const committed = completed + pending;
      const remaining = pos.budgetAmount - committed;
      const pct =
        pos.budgetAmount > 0 ? Math.min(100, Math.round((committed / pos.budgetAmount) * 100)) : 0;

      return {
        ...pos,
        completed,
        pending,
        committed,
        remaining,
        pct,
        txCount: matching.length,
      };
    });
  }, [initialTransactions]);

  // Pemasukan final 6 sumber (matching existing cashflow transactions)
  const revenueRows = useMemo(() => {
    const incomeTxs = initialTransactions.filter((t) => t.type === "INCOME");
    return IYRC_REVENUE_ITEMS.map((item) => {
      const matched = incomeTxs.find((t) => t.iyrcBudgetPos === item.budgetPos);
      return {
        seed: item,
        tx: matched || null,
      };
    });
  }, [initialTransactions]);

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((t) => {
      if (txFilter === "ALL") return true;
      return t.type === txFilter;
    });
  }, [initialTransactions, txFilter]);

  const openNewForm = (
    type: "INCOME" | "EXPENSE",
    budgetPos = "",
    scanMode = false
  ) => {
    setEditingTx(null);
    setDefaultType(type);
    setDefaultBudgetPos(budgetPos);
    setAutoOpenScanner(scanMode);
    setShowFormModal(true);
  };

  const handleDelete = async (tx: CashflowTxRecord) => {
    if (
      !confirm(
        `Hapus transaksi "${tx.description}"? Jika sudah masuk Jurnal Umum, jurnal terkait juga otomatis dihapus.`
      )
    ) {
      return;
    }
    const res = await deleteCashflowTransaction(tx.id);
    if (!res.success) {
      alert("Gagal menghapus transaksi: " + res.error);
      return;
    }
    router.refresh();
  };

  const handleResync = async () => {
    setIsSyncing(true);
    try {
      const res = await resyncIyrcCashflowAndJournals();
      if (!res.success) {
        alert("Sinkronisasi gagal: " + res.error);
        return;
      }
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
              Basis Anggaran: {IYRC_PNL_VERSION}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Landmark size={12} /> Terkoneksi Jurnal Umum ({summary.syncedJournalCount}/{summary.completedCount} Lunas)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Laba Rugi Terpadu &amp; Buku Pengeluaran Proyek IYRC China 2026
          </h2>
          <p className="text-xs text-slate-500">
            Pendapatan final dikunci sebesar{" "}
            <strong>{formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalRevenueBudget)}</strong> (4 Program).
            Setiap transaksi berstatus <strong>Lunas (COMPLETED)</strong> otomatis ter-posting ke{" "}
            <Link href="/jurnal" className="text-indigo-600 font-semibold hover:underline">
              Jurnal Umum
            </Link>{" "}
            &amp;{" "}
            <Link href="/laporan/laba-rugi" className="text-indigo-600 font-semibold hover:underline">
              Laba Rugi Utama
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openNewForm("EXPENSE", "", true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xs cursor-pointer"
          >
            <Sparkles size={14} /> Scan PDF Invoice (AI)
          </button>
          <button
            type="button"
            onClick={() => openNewForm("EXPENSE", "", false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Catat Pengeluaran
          </button>
          <button
            type="button"
            onClick={handleResync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
            title="Sinkronkan ulang item pendapatan final & transaksi COMPLETED yang belum memiliki Jurnal Umum"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} /> Sinkronisasi
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Pendapatan Cair (Lunas)</span>
              <TrendingUp size={15} className="text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700">
              {formatCurrency(summary.incomeCompleted)}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Piutang Pending:</span>
              <span className="font-bold text-amber-700">{formatCurrency(summary.incomePending)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Pengeluaran Lunas</span>
              <TrendingDown size={15} className="text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-700">
              {formatCurrency(summary.expenseCompleted)}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Pagu Excel:</span>
              <span className="font-bold text-slate-700">
                {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Sisa Pagu Biaya</span>
              <Wallet size={15} className="text-indigo-600" />
            </div>
            <div
              className={`text-xl font-extrabold ${
                summary.remainingExpenseBudget >= 0 ? "text-indigo-700" : "text-rose-700"
              }`}
            >
              {formatCurrency(summary.remainingExpenseBudget)}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Menunggu TF:</span>
              <span className="font-bold text-amber-700">{formatCurrency(summary.expensePending)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Laba Proyeksi / Aktual</span>
              <FileText size={15} className="text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.projectedProfit)}
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Saldo Kas Aktual:</span>
              <span
                className={`font-bold ${
                  summary.actualCashProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(summary.actualCashProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: DAFTAR 6 PENDAPATAN FINAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              1. Pendapatan Final IYRC ({formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalRevenueBudget)})
            </h3>
            <p className="text-xs text-slate-500">
              Klik <strong>Tandai Lunas</strong> saat dana masuk rekening (otomatis catat potongan pajak bendahara bila ada &amp; posting Jurnal Umum).
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewForm("INCOME", "", false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
          >
            <Plus size={13} /> Tambah Pemasukan Lain
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Program &amp; Sumber</th>
                <th className="px-4 py-3 text-left">Referensi</th>
                <th className="px-4 py-3 text-right">Target Final</th>
                <th className="px-4 py-3 text-right">Cair di Cashflow</th>
                <th className="px-4 py-3 text-center">Status &amp; Jurnal</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revenueRows.map(({ seed, tx }) => {
                const isDone = tx?.status === "COMPLETED";
                return (
                  <tr key={seed.budgetPos} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] mb-1">
                        {seed.programLabel}
                      </span>
                      <div className="font-semibold text-slate-900">{tx?.description || seed.description}</div>
                      <div className="text-[11px] text-slate-500">{seed.sourceNote}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {tx?.invoiceNumber || seed.invoiceNumber || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                      {formatCurrency(seed.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {tx ? (
                        <div>
                          <span className={isDone ? "text-emerald-700" : "text-amber-700"}>
                            {formatCurrency(tx.amount)}
                          </span>
                          {Number(tx.taxWithheldAmount) > 0 && (
                            <span className="block text-[10px] text-slate-500">
                              Pot. Pajak: {formatCurrency(Number(tx.taxWithheldAmount))}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Belum ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center space-y-1">
                      {tx ? (
                        <>
                          <div>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                <CheckCircle2 size={11} /> Lunas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                <Clock size={11} /> Piutang (Pending)
                              </span>
                            )}
                          </div>
                          {tx.journalEntry?.entryNumber && (
                            <div>
                              <Link
                                href={`/jurnal/${tx.journalEntry.id}`}
                                className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[10px] font-bold hover:underline"
                              >
                                {tx.journalEntry.entryNumber}
                              </Link>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx && !isDone && (
                        <button
                          type="button"
                          onClick={() => setMarkPaidTx(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 size={12} /> Tandai Lunas
                        </button>
                      )}
                      {tx && isDone && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTx(tx);
                            setShowFormModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: PAGU VS REALISASI PENGELUARAN (POS 2 - 5 + TAMBAHAN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <h3 className="font-bold text-slate-900 text-sm">
            2. Pagu Anggaran vs Realisasi Pengeluaran per Pos (Rp 297.451.802)
          </h3>
          <p className="text-xs text-slate-500">
            Klik <strong>+ Catat</strong> di pos terkait untuk mencatat tagihan/pengeluaran baru agar Pagu ter-update otomatis.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Pos Biaya Excel</th>
                <th className="px-4 py-3 text-right">Pagu Anggaran</th>
                <th className="px-4 py-3 text-right">Realisasi Lunas</th>
                <th className="px-4 py-3 text-right">Pending TF</th>
                <th className="px-4 py-3 text-right">Sisa Pagu</th>
                <th className="px-4 py-3 text-center">Serapan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posStats.map((pos) => (
                <tr key={pos.key} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                        {pos.code}
                      </span>
                      <span className="font-bold text-slate-900">{pos.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{pos.description}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    {pos.budgetAmount > 0 ? formatCurrency(pos.budgetAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(pos.completed)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                    {formatCurrency(pos.pending)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      pos.budgetAmount === 0
                        ? "text-slate-400"
                        : pos.remaining >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {pos.budgetAmount > 0 ? formatCurrency(pos.remaining) : "-"}
                  </td>
                  <td className="px-4 py-3 w-36">
                    {pos.budgetAmount > 0 ? (
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pos.remaining < 0 ? "bg-rose-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${pos.pct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-center font-semibold text-slate-500">
                          {pos.pct}% ({pos.txCount} trx)
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-center text-slate-500">{pos.txCount} trx</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openNewForm("EXPENSE", pos.key, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] cursor-pointer"
                    >
                      <Plus size={12} /> Catat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: RINCIAN PER PROGRAM & RISIKO BELUM DIHITUNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <h3 className="font-bold text-slate-900 text-sm">
              3. Proyeksi Laba / (Rugi) per Program (Excel Bagian 7)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left">Program</th>
                  <th className="px-4 py-2.5 text-right">Pendapatan</th>
                  <th className="px-4 py-2.5 text-right">Pagu Biaya</th>
                  <th className="px-4 py-2.5 text-right">Laba / (Rugi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {IYRC_PROGRAM_BREAKDOWN.map((row) => (
                  <tr key={row.program} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-900">{row.label}</div>
                      <div className="text-[11px] text-slate-500">{row.allocationNote}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      {row.revenueBudget > 0 ? formatCurrency(row.revenueBudget) : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-700">
                      {formatCurrency(row.expenseBudget)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold ${
                        row.profitBudget >= 0 ? "text-indigo-700" : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(row.profitBudget)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-extrabold text-slate-900">
                  <td className="px-4 py-3">Total Gabungan (Margin {IYRC_PROFIT_LOSS_TOTALS.projectedMarginPct.toFixed(1)}%)</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">
                    {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalRevenueBudget)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-700">
                    {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.totalExpenseBudget)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-800">
                    {formatCurrency(IYRC_PROFIT_LOSS_TOTALS.projectedProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle size={17} className="text-amber-600 shrink-0" />
            <span>Catatan Item Belum Masuk Pagu (Bisa Mengurangi Laba)</span>
          </div>
          <ul className="space-y-2 text-xs text-amber-950 list-disc pl-4">
            {IYRC_UNBUDGETED_NOTES.map((note, idx) => (
              <li key={idx} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openNewForm("EXPENSE", "TAMBAHAN", false)}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
            >
              + Catat ke Pos 6 (Biaya Tambahan)
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: RIWAYAT TRANSAKSI PROYEK IYRC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              4. Riwayat Pengeluaran &amp; Pemasukan Proyek IYRC ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Terhubung dua arah dengan menu{" "}
              <Link href="/cashflow/transactions" className="text-indigo-600 font-semibold hover:underline">
                Kelola Transaksi Cashflow
              </Link>{" "}
              dan{" "}
              <Link href="/jurnal" className="text-indigo-600 font-semibold hover:underline">
                Jurnal Umum Akuntansi Utama
              </Link>
              .
            </p>
          </div>

          <div className="inline-flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            {(["EXPENSE", "INCOME", "ALL"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTxFilter(tab)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  txFilter === tab
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "EXPENSE" ? "Pengeluaran" : tab === "INCOME" ? "Pemasukan" : "Semua"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Uraian, Pos &amp; Akun COA</th>
                <th className="px-4 py-3 text-center">Status &amp; Jurnal</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3 text-center">Bukti &amp; WA</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Belum ada transaksi pengeluaran IYRC yang dicatat. Klik{" "}
                    <strong>Catat Pengeluaran</strong> atau <strong>Scan PDF Invoice (AI)</strong> di atas.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const cur = (tx.currency || "IDR").toUpperCase();
                  const isFx = cur !== "IDR" && cur !== "RP";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-semibold text-slate-900">{tx.description}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-1.5 items-center">
                          <span>{tx.category}</span>
                          {tx.vendorName && <span>&bull; {tx.vendorName}</span>}
                          {tx.invoiceNumber && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              {tx.invoiceNumber}
                            </span>
                          )}
                        </div>
                        {tx.account && (
                          <div className="text-[10px] text-indigo-700 font-medium mt-1">
                            COA: {tx.account.code} - {tx.account.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-y-1">
                        <div>
                          {tx.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px]">
                              <Clock size={10} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <CheckCircle2 size={10} /> Lunas
                            </span>
                          )}
                        </div>
                        {tx.journalEntry?.entryNumber && (
                          <div>
                            <Link
                              href={`/jurnal/${tx.journalEntry.id}`}
                              className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[10px] font-bold hover:underline"
                            >
                              {tx.journalEntry.entryNumber}
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}>
                          {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                        </span>
                        {isFx && tx.originalAmount ? (
                          <span className="block text-[10px] text-indigo-700">
                            {formatForeignCurrency(tx.originalAmount, cur)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center space-y-1">
                        {tx.receiptUrl && (
                          <div>
                            <a
                              href={tx.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                            >
                              <ExternalLink size={11} /> File Nota
                            </a>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setWaModalTx(tx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                        >
                          <MessageSquare size={10} /> Teks WA
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {tx.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => setMarkPaidTx(tx)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              <CheckCircle2 size={10} /> Tandai Lunas
                            </button>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTx(tx);
                                setShowFormModal(true);
                              }}
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tx)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit Transaksi IYRC */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                {autoOpenScanner && <Sparkles size={16} className="text-amber-400" />}
                {editingTx
                  ? "Edit Transaksi IYRC"
                  : autoOpenScanner
                  ? "Scan PDF Invoice Pengeluaran IYRC"
                  : `Catat ${defaultType === "INCOME" ? "Pemasukan" : "Pengeluaran"} IYRC`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setAutoOpenScanner(false);
                  setEditingTx(null);
                  setDefaultBudgetPos("");
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 max-h-[82vh] overflow-y-auto">
              <TransactionForm
                projects={projectsList}
                accounts={coaAccounts}
                initialData={editingTx}
                autoOpenScanner={autoOpenScanner}
                defaultProjectId={iyrcProject?.id}
                defaultIyrcBudgetPos={defaultBudgetPos}
                defaultType={defaultType}
                onSuccess={() => {
                  setShowFormModal(false);
                  setAutoOpenScanner(false);
                  setEditingTx(null);
                  setDefaultBudgetPos("");
                  router.refresh();
                }}
                onCancel={() => {
                  setShowFormModal(false);
                  setAutoOpenScanner(false);
                  setEditingTx(null);
                  setDefaultBudgetPos("");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Lunas + Potongan Pajak + Posting Jurnal Umum */}
      <MarkPaidModal
        transaction={markPaidTx}
        accounts={coaAccounts}
        onClose={() => setMarkPaidTx(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal Detail Rekening & WhatsApp */}
      <InvoiceWhatsappModal
        transaction={waModalTx}
        onClose={() => setWaModalTx(null)}
        onMarkPaid={async (id) => {
          const found = initialTransactions.find((t) => t.id === id);
          if (found) setMarkPaidTx(found);
        }}
      />
    </div>
  );
}
