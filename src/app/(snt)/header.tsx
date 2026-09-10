import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Bell } from "lucide-react"
import Link from "next/link"
import { MobileSidebar } from "./mobile-sidebar"


export async function SntHeader() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role !== "FASILITATOR"

  let pendingWeekly = 0
  let pendingHonor = 0
  if (isAdmin) {
    pendingWeekly = await prisma.laporanKegiatan.count({ where: { statusTransport: 'PENDING', OR: [{ biayaTransport: { gt: 0 } }, { biayaTransportLaut: { gt: 0 } }] } })
    pendingHonor = await prisma.rekapHonorarium.count({ where: { status: 'SUBMITTED' } })
  }

  const pendingCount = pendingWeekly + pendingHonor

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <MobileSidebar />
        <h1 className="text-lg font-bold tracking-tight">KKA SNT</h1>
      </div>
      <div className="hidden md:block"></div>
      
      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="relative group cursor-pointer">
            <Link href="/dashboard-rab" className="p-2 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
            
            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3 border-b bg-slate-50 font-bold text-sm">Notifikasi Pengajuan</div>
              <div className="p-2">
                <Link href="/fasilitator/transport" className="block p-2 text-sm hover:bg-slate-50 rounded">
                  Tagihan Transport <span className="font-bold text-amber-600">({pendingWeekly})</span>
                </Link>
                <Link href="/fasilitator/rekap-honor" className="block p-2 text-sm hover:bg-slate-50 rounded">
                  Rekap Honorarium <span className="font-bold text-blue-600">({pendingHonor})</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
