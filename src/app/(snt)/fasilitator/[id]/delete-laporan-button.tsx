"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLaporanKegiatan } from '@/app/actions/rab'
import { Trash2 } from 'lucide-react'
import { useModal } from '@/components/modal-provider';

export function DeleteLaporanButton({ laporanId, fasilitatorId }: { laporanId: string, fasilitatorId: string }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!(await confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.'))) return;
    setIsDeleting(true);
    try {
      const res = await deleteLaporanKegiatan(laporanId, fasilitatorId);
      if (res?.error) {
        await alert(res.error);
      } else {
        await alert('Laporan berhasil dihapus');
        router.refresh();
      }
    } catch (e: any) {
      await alert('Gagal menghapus laporan: ' + e.message);
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
