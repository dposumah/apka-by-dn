"use client"

import { useState } from 'react'
import { approveExpense } from '@/app/actions/rab'
import { Upload } from 'lucide-react'
import { useModal } from '@/components/modal-provider';
import { uploadFileClient } from '@/lib/upload-client';

export function ApproveButton({ expenseId }: { expenseId: string }) {
  const { confirm, alert } = useModal();

  const [processing, setProcessing] = useState(false)

  const handleApprove = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!(await confirm('Setujui pengeluaran ini dan unggah bukti transfer?'))) {
      e.target.value = ''
      return
    }

    setProcessing(true)
    try {
      const url = await uploadFileClient(file, 'transfer-rab')
      await approveExpense(expenseId, 'APPROVED', url)
    } catch (e: any) {
      await alert('Gagal mengunggah bukti transfer: ' + (e.message || ''))
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!(await confirm('Tolak pengeluaran ini?'))) return
    setProcessing(true)
    try {
      await approveExpense(expenseId, 'REJECTED')
    } catch (e) {
      await alert('Gagal menolak')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex gap-3 items-center">
      <label className={'inline-flex items-center gap-1 cursor-pointer text-emerald-600 font-medium hover:underline ' + (processing ? 'opacity-50' : '')}>
        <Upload className="w-4 h-4" /> {processing ? 'Memproses...' : 'Setujui & Upload Bukti'}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={processing} onChange={handleApprove} />
      </label>
      <button onClick={handleReject} disabled={processing} className="text-red-600 hover:underline">
        Tolak
      </button>
    </div>
  )
}
