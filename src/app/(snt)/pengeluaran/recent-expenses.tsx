'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { updateExpense, deleteExpense } from '@/app/actions/rab'
import { Pencil, Trash2, ExternalLink, Loader2, Calendar, Paperclip } from 'lucide-react'
import { uploadFileClient } from '@/lib/upload-client'

interface RecentExpensesProps {
  expenses: any[]
  items: any[]
  fasilitators: any[]
}

export function RecentExpensesList({ expenses, items, fasilitators }: RecentExpensesProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openEditModal = (expense: any) => {
    setEditData({
      id: expense.id,
      date: expense.date 
        ? new Date(expense.date).toISOString().substring(0, 10) 
        : new Date(expense.createdAt).toISOString().substring(0, 10),
      description: expense.description || '',
      amount: expense.amount || 0,
      rabItemId: expense.rabItemId || '',
      fasilitatorId: expense.fasilitatorId || '',
      currentReceiptUrl: expense.receiptUrl || expense.paymentReceiptUrl || ''
    })
    setNewFile(null)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editData) return
    if (!editData.rabItemId) {
      alert('Pilih item anggaran RAB')
      return
    }
    if (!editData.amount || Number(editData.amount) <= 0) {
      alert('Nominal harus lebih dari 0')
      return
    }

    setIsSaving(true)
    try {
      let receiptUrl = editData.currentReceiptUrl

      // Jika ada file baru diunggah
      if (newFile) {
        receiptUrl = await uploadFileClient(newFile, 'receipts')
      }

      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: Number(editData.amount),
        rabItemId: editData.rabItemId,
        fasilitatorId: editData.fasilitatorId || undefined,
        receiptUrl: receiptUrl || undefined
      })

      if (res?.error) {
        throw new Error(res.error)
      }

      setShowEditModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Gagal mengedit pengeluaran: ' + (err.message || err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengeluaran "${desc}"?`)) return

    setDeletingId(id)
    try {
      await deleteExpense(id)
      router.refresh()
    } catch (err: any) {
      alert('Gagal menghapus pengeluaran: ' + (err.message || err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pengeluaran Terakhir</CardTitle>
              <CardDescription>Entri pengeluaran terakhir yang telah diinput</CardDescription>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              {expenses.length} Data
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Belum ada pengeluaran yang dicatat</p>
            ) : (
              expenses.map((expense: any) => {
                const receipt = expense.receiptUrl || expense.paymentReceiptUrl
                return (
                  <div 
                    key={expense.id} 
                    className="border rounded-lg p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900">
                          {expense.rabItem?.name || '-'}
                        </span>
                        {expense.rabItem?.category?.name && (
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {expense.rabItem.category.name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {expense.description}
                      </p>

                      {expense.fasilitator && (
                        <p className="text-[11px] text-blue-600 font-medium mt-1">
                          Penerima: {expense.fasilitator.namaLengkap}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(expense.date || expense.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>

                        {receipt && (
                          <a 
                            href={receipt} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Paperclip className="w-3.5 h-3.5" /> Nota <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between self-stretch sm:self-auto gap-2">
                      <div className="sm:text-right">
                        <p className="font-bold text-sm text-slate-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <Badge 
                          variant={expense.status === 'APPROVED' ? 'default' : expense.status === 'REJECTED' ? 'destructive' : 'secondary'}
                          className="text-[10px] uppercase font-bold tracking-wider mt-1"
                        >
                          {expense.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(expense)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                          title="Edit Pengeluaran"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === expense.id}
                          onClick={() => handleDelete(expense.id, expense.description)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors disabled:opacity-50"
                          title="Hapus Pengeluaran"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Pengeluaran */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Pengeluaran Lapangan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Perubahan akan langsung mengupdate data realisasi dan sisa anggaran RAB.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pengeluaran <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={editData.date}
                  onChange={e => setEditData({ ...editData, date: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Anggaran RAB <span className="text-red-500">*</span>
                </label>
                <select 
                  value={editData.rabItemId}
                  onChange={e => setEditData({ ...editData, rabItemId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Pilih Item RAB --</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.categoryName ? `[${item.categoryName}] ` : ''}{item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fasilitator / Penerima (Opsional)
                </label>
                <select 
                  value={editData.fasilitatorId}
                  onChange={e => setEditData({ ...editData, fasilitatorId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Bukan Fasilitator (Lainnya)</option>
                  {fasilitators.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.namaLengkap} {f.lokasiSNT ? `(${f.lokasiSNT})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows={3}
                  value={editData.description}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  placeholder="Contoh: Pembelian spidol & modul pembelajaran"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={editData.amount}
                  onChange={e => setEditData({ ...editData, amount: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ganti / Upload Bukti Nota (Opsional)
                </label>
                {editData.currentReceiptUrl && (
                  <div className="mb-2 text-xs text-blue-600 flex items-center gap-1">
                    <span>Bukti saat ini:</span>
                    <a 
                      href={editData.currentReceiptUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Lihat Nota Saat Ini
                    </a>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={e => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-xs border rounded-md p-1.5 bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format gambar atau PDF. Kosongkan jika tidak ingin mengubah bukti nota.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
