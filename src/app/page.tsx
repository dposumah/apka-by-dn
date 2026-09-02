import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2, Presentation } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session?.user?.role === 'FASILITATOR') {
    redirect('/portal');
  }

  // Jika bukan fasilitator (Admin), tampilkan Gateway Pilihan
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat Datang, {session?.user?.name || 'Admin'}</h1>
          <p className="text-slate-500">Silakan pilih ruang kerja aplikasi yang ingin Anda akses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-700">APKA Induk</CardTitle>
                <CardDescription>Aplikasi Pelaporan Keuangan & Akuntansi</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-slate-600">
                Akses buku besar, jurnal umum, laporan keuangan, pajak, dan inventori perusahaan.
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard-rab" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-emerald-500 cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Presentation className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl text-emerald-700">KKA SNT 2026</CardTitle>
                <CardDescription>Monitoring RAB & Fasilitator</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-slate-600">
                Kelola anggaran proyek, pengeluaran lapangan, dan pantau laporan fasilitator.
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="text-center mt-8">
          <Link href="/api/auth/signout" className="text-sm text-red-500 hover:underline">
            Keluar dari Akun
          </Link>
        </div>
      </div>
    </div>
  )
}
