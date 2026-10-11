"use client";

import { useState } from "react";
import Link from "next/link";
import TransactionForm from "@/components/cashflow/TransactionForm";
import { deleteCashflowTransaction } from "@/actions/cashflow";
import { Plus, ArrowLeft, Edit2, Trash2, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function TransactionListClient({ projects, initialTransactions }: { projects: any[], initialTransactions: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  
  const handleAddNew = () => {
    setEditingData(null);
    setShowForm(true);
  };

  const handleEdit = (tx: any) => {
    setEditingData(tx);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
      await deleteCashflowTransaction(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
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
            Data Transaksi Masuk & Keluar
          </h1>
          <p className="text-xs text-slate-500">
            Daftar seluruh arus kas proyek Bina Insani, ASMI, dan IYRC
          </p>
        </div>

        {!showForm && (
          <button 
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20"
          >
            <Plus size={16} /> Tambah Transaksi
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {editingData ? "Edit Transaksi" : "Tambah Transaksi Baru"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Tutup Form
            </button>
          </div>
          <TransactionForm 
            projects={projects} 
            initialData={editingData}
            onSuccess={handleFormSuccess} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Tanggal</th>
                  <th className="px-6 py-3.5 text-left">Proyek</th>
                  <th className="px-6 py-3.5 text-left">Keterangan</th>
                  <th className="px-6 py-3.5 text-center">Tipe</th>
                  <th className="px-6 py-3.5 text-right">Nominal</th>
                  <th className="px-6 py-3.5 text-center">Bukti Nota</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {initialTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Belum ada transaksi tercatat. Klik tombol <strong>+ Tambah Transaksi</strong> di atas untuk mulai mencatat.
                    </td>
                  </tr>
                ) : (
                  initialTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium text-xs">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {tx.project?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        <div className="font-semibold">{tx.description}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{tx.category} • {tx.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                          tx.type === "INCOME" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-bold text-sm ${
                        tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tx.receiptUrl ? (
                          <a 
                            href={tx.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <ExternalLink size={13} /> Lihat
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(tx)} 
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)} 
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
