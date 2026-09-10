"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteFasilitator } from '@/app/actions/rab'
import { useModal } from '@/components/modal-provider';

export function DeleteFasilButton({ id }: { id: string }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (await confirm('Yakin ingin menghapus fasilitator ini? Seluruh data riwayat laporan mereka juga akan terhapus.')) {
      try {
        setLoading(true)
        await deleteFasilitator(id)
        router.refresh()
      } catch (e: any) {
        await alert(e.message || 'Gagal menghapus fasilitator')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {loading ? '...' : 'Hapus'}
    </button>
  )
}
