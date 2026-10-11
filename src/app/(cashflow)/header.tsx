import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { CashflowMobileSidebar } from "./mobile-sidebar"
import { ArrowLeftRight, Sparkles } from "lucide-react"

export async function CashflowHeader() {
  const session = await getServerSession(authOptions)

  return (
    <header className="flex h-16 items-center justify-between border-b border-indigo-100 bg-white/80 backdrop-blur px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <CashflowMobileSidebar />
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Cashflow 3 Proyek</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-full px-2 py-0.5">
              <Sparkles size={11} className="text-indigo-600" /> Multi-Project
            </span>
          </h1>
          <p className="text-xs text-slate-500 hidden md:block">
            Bina Insani · ASMI · IYRC
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link 
          href="/"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          title="Kembali ke Gateway Pemilih Ruang Kerja"
        >
          <ArrowLeftRight size={14} />
          <span className="hidden sm:inline">Ganti Aplikasi</span>
        </Link>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
            {session?.user?.name?.[0] || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              {session?.user?.role || "ADMIN"}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
