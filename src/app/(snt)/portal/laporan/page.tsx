import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LaporanPage() {
  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <Link href="/portal" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Kembali ke Portal</Link>
      <h1 className="text-3xl font-bold tracking-tight">Kirim Laporan Kegiatan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Laporan Mengajar SNT 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 mb-4 text-sm">Fitur formulir akan dibangun di tahap selanjutnya. Saat ini halaman sudah aktif.</p>
        </CardContent>
      </Card>
    </div>
  )
}
