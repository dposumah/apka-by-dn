"use client"

import { useState } from 'react'
import { deleteExpense } from '@/app/actions/rab'
import { Trash2 } from 'lucide-react'

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [processing, setProcessing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

    setProcessing(true)
    try {
      await deleteExpense(expenseId)
    } catch (e: any) {
      alert('Gagal menghapus: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={processing}
      className="inline-flex items-center gap-1 text-red-600 font-medium hover:underline disabled:opacity-50 text-sm"
    >
      <Trash2 className="w-4 h-4" />
      {processing ? 'Menghapus...' : 'Hapus'}
    </button>
  )
}
