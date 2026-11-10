"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TransactionForm from "@/components/cashflow/TransactionForm";
import InvoiceWhatsappModal from "@/components/cashflow/InvoiceWhatsappModal";
import {
  deleteCashflowTransaction,
  markCashflowTransactionPaid,
} from "@/actions/cashflow";
import {
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Clock,
  Filter,
  Landmark,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { formatForeignCurrency } from "@/lib/cashflow-invoice";

export default function TransactionListClient({
  projects,
  initialTransactions,
}: {
  projects: any[];
  initialTransactions: any[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [autoOpenScanner, setAutoOpenScanner] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [waModalTx, setWaModalTx] = useState<any | null>(null);
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const st = params.get("status");
      if (st === "PENDING" || st === "COMPLETED") {
        setFilterStatus(st);
      }
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      const matchProj = filterProject ? tx.projectId === filterProject : true;
      const matchStatus = filterStatus === "ALL" ? true : tx.status === filterStatus;
      return matchProj && matchStatus;
    });
  }, [initialTransactions, filterProject, filterStatus]);

  const stats = useMemo(() => {
    const projectFiltered = initialTransactions.filter((tx) =>
      filterProject ? tx.projectId === filterProject : true
    );
    const completedIncome = projectFiltered
      .filter((t) => t.status === "COMPLETED" && t.type === "INCOME")
      .reduce((s, t) => s + t.amount, 0);
    const completedExpense = projectFiltered
      .filter((t) => t.status === "COMPLETED" && t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0);
    const pendingList = projectFiltered.filter((t) => t.status === "PENDING");
    const pendingExpense = pendingList
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0);
    return {
      completedIncome,
      completedExpense,
      pendingCount: pendingList.length,
      pendingExpense,
    };
  }, [initialTransactions, filterProject]);

  const handleAddNew = (scanMode = false) => {
    setEditingData(null);
    setAutoOpenScanner(scanMode);
    setShowForm(true);
  };

  const handleEdit = (tx: any) => {
    setEditingData(tx);
    setAutoOpenScanner(false);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
      await deleteCashflowTransaction(id);
      router.refresh();
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Tandai tagihan ini sudah ditransfer / Lunas? Nominal akan langsung masuk realisasi Cashflow.")) {
      return;
    }
    setMarkingId(id);
    try {
      const res = await markCashflowTransactionPaid(id);
      if (!res.success) {
        alert("Gagal memperbarui status: " + res.error);
        return;
      }
      if (waModalTx?.id === id && res.transaction) {
        setWaModalTx(res.transaction);
      }
      router.refresh();
    } finally {
      setMarkingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setAutoOpenScanner(false);
    setEditingData(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/cashflow"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Data Transaksi Masuk &amp; Keluar
          </h1>
          <p className="text-xs text-slate-500">
            Catat arus kas manual atau scan PDF Invoice otomatis dengan AI &amp; generator teks WhatsApp
          </p>
        </div>

        {!showForm && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleAddNew(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Sparkles size={16} /> Scan Invoice PDF (AI)
            </button>
            <button
              onClick={() => handleAddNew(false)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Plus size={16} /> Tambah Manual
            </button>
          </div>
        )}
      </div>

      {/* Ringkasan Cepat + Filter */}
      {!showForm && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pemasukan Terealisasi (Lunas)
              </span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {formatCurrency(stats.completedIncome)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs border-l-4 border-l-rose-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pengeluaran Terealisasi (Lunas)
              </span>
              <div className="text-xl font-extrabold text-rose-600 mt-1">
                {formatCurrency(stats.completedExpense)}
              </div>
            </div>
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs border-l-4 border-l-amber-500 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Clock size={12} /> Menunggu Transfer ({stats.pendingCount})
                </span>
                <div className="text-xl font-extrabold text-amber-900 mt-1">
                  {formatCurrency(stats.pendingExpense)}
                </div>
              </div>
              {stats.pendingCount > 0 && filterStatus !== "PENDING" && (
                <button
                  onClick={() => setFilterStatus("PENDING")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                >
                  Lihat Pending
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700"
              >
                <option value="">Semua Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterStatus === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({initialTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("PENDING")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterStatus === "PENDING"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Menunggu TF ({stats.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("COMPLETED")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterStatus === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lunas
              </button>
            </div>
          </div>
        </>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {autoOpenScanner && <Sparkles size={18} className="text-indigo-600" />}
              {editingData
                ? "Edit Transaksi"
                : autoOpenScanner
                ? "Scan PDF Invoice & Buat Pengajuan Transfer"
                : "Tambah Transaksi Baru"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setAutoOpenScanner(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Tutup Form
            </button>
          </div>
          <TransactionForm
            projects={projects}
            initialData={editingData}
            autoOpenScanner={autoOpenScanner}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setAutoOpenScanner(false);
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Tanggal</th>
                  <th className="px-4 py-3.5 text-left">Proyek</th>
                  <th className="px-4 py-3.5 text-left">Keterangan &amp; Rekening</th>
                  <th className="px-4 py-3.5 text-center">Tipe &amp; Status</th>
                  <th className="px-4 py-3.5 text-right">Nominal</th>
                  <th className="px-4 py-3.5 text-center">Bukti / WA</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Belum ada transaksi sesuai filter. Klik{" "}
                      <strong>Scan Invoice PDF (AI)</strong> atau{" "}
                      <strong>+ Tambah Manual</strong> untuk mulai mencatat.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cur = (tx.currency || "IDR").toUpperCase();
                    const isFx = cur !== "IDR" && cur !== "RP";
                    const hasInvoiceOrBank = Boolean(
                      tx.bankName ||
                        tx.accountNumber ||
                        tx.invoiceNumber ||
                        tx.whatsappText
                    );
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-slate-700 font-medium text-xs align-top">
                          <div>
                            {new Date(tx.date).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          {tx.dueDate && tx.status === "PENDING" && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              JT:{" "}
                              {new Date(tx.dueDate).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {tx.project?.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-900 align-top max-w-xs">
                          <div className="font-semibold leading-snug">{tx.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {tx.category} &bull; {tx.paymentMethod}
                            {tx.paymentScheme ? ` • ${tx.paymentScheme}` : ""}
                          </div>
                          {(tx.vendorName || tx.invoiceNumber) && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              {tx.vendorName && <span className="font-medium">{tx.vendorName}</span>}
                              {tx.invoiceNumber && (
                                <span className="ml-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                                  {tx.invoiceNumber}
                                </span>
                              )}
                            </div>
                          )}
                          {(tx.bankName || tx.accountNumber) && (
                            <div className="text-[11px] text-indigo-700 mt-1 flex items-center gap-1 font-mono">
                              <Landmark size={11} className="shrink-0" />
                              <span className="truncate">
                                {tx.bankName} {tx.accountNumber ? `• ${tx.accountNumber}` : ""}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center align-top space-y-1.5">
                          <div>
                            <span
                              className={`px-2.5 py-0.5 inline-flex text-[11px] font-semibold rounded-full ${
                                tx.type === "INCOME"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                            </span>
                          </div>
                          <div>
                            {tx.status === "PENDING" ? (
                              <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[10.5px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                                <Clock size={10} /> Menunggu TF
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[10.5px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                <CheckCircle2 size={10} className="text-emerald-600" /> Lunas
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                          <div
                            className={`font-bold text-sm ${
                              tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatCurrency(tx.amount)}
                          </div>
                          {isFx && tx.originalAmount ? (
                            <div className="text-[11px] font-mono font-semibold text-indigo-700 mt-0.5">
                              {formatForeignCurrency(tx.originalAmount, cur)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center align-top space-y-1.5">
                          {tx.receiptUrl ? (
                            <div>
                              <a
                                href={tx.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <ExternalLink size={12} /> File PDF/Nota
                              </a>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-300">-</div>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={() => setWaModalTx(tx)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                hasInvoiceOrBank
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                              title="Lihat Rincian Rekening & Salin Teks WhatsApp"
                            >
                              <MessageSquare size={12} className="text-emerald-600" />
                              Teks WA &amp; Rek
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center align-top">
                          <div className="flex flex-col items-center gap-1.5">
                            {tx.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(tx.id)}
                                disabled={markingId === tx.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer disabled:opacity-50"
                                title="Tandai Sudah Ditransfer (Lunas)"
                              >
                                <CheckCircle2 size={12} />
                                {markingId === tx.id ? "..." : "Tandai Lunas"}
                              </button>
                            )}
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(tx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={15} />
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
      )}

      {/* Modal Detail Invoice, Rekening & Teks WhatsApp */}
      <InvoiceWhatsappModal
        transaction={waModalTx}
        onClose={() => setWaModalTx(null)}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
}
