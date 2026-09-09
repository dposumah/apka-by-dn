"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLaporanKegiatan } from '@/app/actions/rab'
import { Trash2 } from 'lucide-react'

export function DeleteLaporanButton({ laporanId, fasilitatorId }: { laporanId: string, fasilitatorId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsDeleting(true);
    try {
      await deleteLaporanKegiatan(laporanId, fasilitatorId);
      alert('Laporan berhasil dihapus');
      router.refresh();
    } catch (e: any) {
      alert('Gagal menghapus laporan: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="mt-2 flex items-center justify-center gap-1 text-[10px] w-full bg-red-100 text-red-700 hover:bg-red-200 rounded px-1 py-1 transition-colors disabled:opacity-50"
      title="Hapus Laporan"
    >
      <Trash2 className="w-3 h-3" />
      {isDeleting ? 'Hapus...' : 'Hapus'}
    </button>
  )
}
