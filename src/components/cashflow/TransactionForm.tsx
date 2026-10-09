"use client";

import { useState } from "react";
import { createCashflowTransaction, updateCashflowTransaction } from "@/actions/cashflow";
import { createClient } from '@supabase/supabase-js';

// We'll init Supabase here for client-side uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TransactionForm({ 
  projects, 
  onSuccess, 
  onCancel,
  initialData 
}: { 
  projects: any[], 
  onSuccess: () => void, 
  onCancel: () => void,
  initialData?: any 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || projects[0]?.id || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: initialData?.type || "INCOME",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    paymentMethod: initialData?.paymentMethod || "TRANSFER",
    status: initialData?.status || "COMPLETED",
    receiptUrl: initialData?.receiptUrl || ""
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);
      setError("");

      const { error: uploadError } = await supabase.storage
        .from('cashflow-receipts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('cashflow-receipts').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, receiptUrl: data.publicUrl }));
    } catch (err: any) {
      setError("Gagal upload file: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let res;
      if (initialData?.id) {
        res = await updateCashflowTransaction(initialData.id, formData);
      } else {
        res = await createCashflowTransaction(formData);
      }

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Terjadi kesalahan");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proyek</label>
          <select 
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.projectId}
            onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal</label>
          <input 
            type="date" required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.date}
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipe</label>
          <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.type}
            onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nominal (Rp)</label>
          <input 
            type="number" required min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.amount}
            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Keterangan</label>
          <input 
            type="text" required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <input 
            type="text" required placeholder="Contoh: Operasional, Gaji..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
          <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.paymentMethod}
            onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
          >
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
            <option value="BANK">Bank</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bukti Nota / Kwitansi</label>
          <input 
            type="file" 
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-gray-500 mt-1">Mengupload...</p>}
          {formData.receiptUrl && !uploading && (
            <a href={formData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
              Lihat File Tersimpan
            </a>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="COMPLETED">Selesai (Lunas)</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button" 
          onClick={onCancel}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
        >
          Batal
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </div>
    </form>
  );
}
