import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PortalPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Portal Fasilitator SNT 2026</h1>
      <p className="text-slate-600">Selamat datang di Portal Fasilitator. Gunakan menu di bawah ini untuk mengirim laporan kegiatan dan mengecek status honorarium Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Kegiatan Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Kirim laporan kegiatan mengajar Anda. Setiap laporan yang disetujui akan otomatis men-generate tagihan honorarium.</p>
            <Link href="/portal/laporan" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4 w-full">
              + Buat Laporan
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Honorarium & Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">Belum ada fitur ini di demo. Akan mengambil data LaporanKegiatan dan status ExpenseRequest.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
