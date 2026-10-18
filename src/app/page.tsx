import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2, Presentation, Layers, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err;
    }
    console.error("Home page auth session error:", err);
  }
  
  if (!session) {
    redirect('/login');
  }

  if (session?.user?.role === 'FASILITATOR') {
    redirect('/portal');
  }

  if (session?.user?.role === 'KORWIL') {
    redirect('/dashboard-rab');
  }

  // Jika bukan fasilitator (Admin/Accountant), tampilkan Gateway Pilihan 3 Ruang Kerja
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-indigo-50/30 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-2">
            <Sparkles size={13} className="text-indigo-600" /> Pusat Kendali Aplikasi PT. JT Robotic Explorer
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang, {session?.user?.name || 'Admin'}
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm md:text-base">
            Silakan pilih modul ruang kerja yang ingin Anda kelola hari ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. APKA Induk */}
          <Link href="/dashboard" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer bg-white flex flex-col justify-between">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto bg-blue-100/80 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  APKA Induk
                </CardTitle>
                <CardDescription className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Akuntansi Perusahaan
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs text-slate-600 pb-6 flex-1">
                Buku besar, jurnal umum, neraca saldo, laba rugi, perpajakan, dan manajemen inventori perusahaan.
              </CardContent>
            </Card>
          </Link>

          {/* 2. KKA SNT 2026 */}
          <Link href="/dashboard-rab" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500 cursor-pointer bg-white flex flex-col justify-between">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto bg-emerald-100/80 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <Presentation className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  KKA SNT 2026
                </CardTitle>
                <CardDescription className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                  Monitoring RAB & Fasilitator
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs text-slate-600 pb-6 flex-1">
                Pengawasan realisasi RAB lapangan, laporan mingguan, rekap honorarium & transport fasilitator SNT.
              </CardContent>
            </Card>
          </Link>

          {/* 3. Cashflow 3 Proyek */}
          <Link href="/cashflow" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-indigo-200/60 hover:border-indigo-600 cursor-pointer bg-gradient-to-b from-white to-indigo-50/30 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Modul Baru
              </div>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto bg-gradient-to-tr from-indigo-500 to-violet-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/20">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Cashflow 3 Proyek
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-indigo-600">
                  Bina Insani · ASMI · IYRC
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs text-slate-600 pb-6 flex-1">
                Pencatatan arus kas masuk & keluar, analisis margin profit, laporan bulanan, dan rekomendasi cerdas AI.
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="text-center pt-2">
          <Link href="/api/auth/signout" className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline transition-colors">
            Keluar dari Akun
          </Link>
        </div>
      </div>
    </div>
  )
}
