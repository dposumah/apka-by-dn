const fs = require('fs');
const filePath = 'src/app/(snt)/dashboard-rab/DeleteExpenseButton.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = `"use client"

import { useState } from 'react'
import { deleteExpense } from '@/app/actions/rab'
import { Trash2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [processing, setProcessing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setProcessing(true)
    try {
      await deleteExpense(expenseId)
      toast({ title: 'Berhasil', description: 'Pengeluaran dihapus', type: 'success' })
    } catch (e: any) {
      toast({ title: 'Gagal', description: 'Gagal menghapus: ' + e.message, type: 'error' })
    } finally {
      setProcessing(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Yakin?</span>
        <button onClick={handleDelete} disabled={processing} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50">Ya</button>
        <button onClick={() => setConfirming(false)} disabled={processing} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 disabled:opacity-50">Batal</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-red-600 font-medium hover:underline text-sm"
    >
      <Trash2 className="w-4 h-4" />
      Hapus
    </button>
  )
}
`

fs.writeFileSync(filePath, code);
console.log("Patched DeleteExpenseButton");
