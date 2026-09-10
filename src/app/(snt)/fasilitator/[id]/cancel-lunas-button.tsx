"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelTransportPaid } from '@/app/actions/rekap'

export function CancelLunasButton({ laporanId }: { laporanId: string }) {
  const router = useRouter()
  const [isCanceling, setIsCanceling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan status Lunas untuk laporan ini? Data Pengeluaran yang terkait juga akan dihapus.')) return;
    setIsCanceling(true);
    try {
      const res = await cancelTransportPaid(laporanId);
      if (res?.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert('Gagal membatalkan: ' + e.message);
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <button 
      onClick={handleCancel}
      disabled={isCanceling}
      className="mt-1 flex items-center justify-center gap-1 text-[10px] w-full bg-orange-100 text-orange-700 hover:bg-orange-200 rounded px-1 py-1 transition-colors disabled:opacity-50"
      title="Batalkan Lunas"
    >
      {isCanceling ? 'Batal Lunas...' : 'Batalkan Lunas'}
    </button>
  )
}
