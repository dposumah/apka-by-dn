"use client";

import { useState } from "react";
import Link from "next/link";
import TransactionForm from "@/components/cashflow/TransactionForm";
import { deleteCashflowTransaction } from "@/actions/cashflow";

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
    if(confirm("Yakin ingin menghapus transaksi ini?")) {
      await deleteCashflowTransaction(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Transaksi Cashflow</h1>
          <div className="text-sm text-gray-500 mt-1">
            <Link href="/admin/cashflow" className="text-blue-600 hover:underline">← Kembali ke Dashboard</Link>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Tambah Transaksi
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingData ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h2>
          <TransactionForm 
            projects={projects} 
            initialData={editingData}
            onSuccess={handleFormSuccess} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyek</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  initialTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.project?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.description}
                        <div className="text-xs text-gray-500">{tx.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(tx)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                        <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900">Hapus</button>
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
