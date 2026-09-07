"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface MenuItem {
  title: string
  href: string
  icon: string
  adminOnly?: boolean
  fasilOnly?: boolean
  submenu?: { title: string; href: string }[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard Proyek", href: "/dashboard-rab", icon: "📊", adminOnly: true },
  { title: "Pengeluaran Lapangan", href: "/pengeluaran", icon: "💸", adminOnly: true },
  { 
    title: "Manajemen Fasilitator", 
    href: "/fasilitator", 
    icon: "👥", 
    adminOnly: true,
    submenu: [
      { title: "Data Fasilitator", href: "/fasilitator" },
      { title: "Laporan Mingguan", href: "/fasilitator/laporan" },
      { title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" },
      { title: "Tagihan Transport", href: "/fasilitator/transport" }
    ]
  },
  { title: "Pengaturan Akun", href: "/snt-akun", icon: "⚙️", adminOnly: true },
  { title: "Dashboard", href: "/portal", icon: "🏠", fasilOnly: true },
  { title: "Profil Fasilitator", href: "/portal/profil", icon: "👤", fasilOnly: true },
  { title: "Pengaturan Sandi", href: "/portal/password", icon: "🔒", fasilOnly: true },
]

export function SntSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({ "Manajemen Fasilitator": true })

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const isActive = (href: string) => {
    if (href === "/portal") {
      return pathname === "/portal"
    }
    return pathname === href || pathname?.startsWith(href + "/")
  }

  const filteredMenus = menuItems.filter(item => {
    if (userRole === "FASILITATOR" && item.adminOnly) return false
    if (userRole !== "FASILITATOR" && item.fasilOnly) return false
    return true
  })

  return (
    <div className="flex h-full w-full flex-col border-r bg-emerald-950 text-emerald-50 overflow-y-auto">
      <div className="flex h-20 shrink-0 flex-col items-start justify-center border-b border-emerald-900 px-6">
        <h1 className="text-xl font-bold tracking-tight text-white leading-tight">PT. JT Robotic</h1>
        <h2 className="text-xs text-emerald-300">KKA Sekolah Nasional Terintegrasi Tahun 2026</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {filteredMenus.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-emerald-900",
                    (isActive(item.href) || item.submenu.some(s => isActive(s.href))) ? "bg-emerald-900 text-white" : "text-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {item.title}
                  </div>
                  <span className="text-xs">{openMenus[item.title] ? "▼" : "▶"}</span>
                </button>
                {openMenus[item.title] && (
                  <div className="mt-1 flex flex-col space-y-1 pl-9 pr-2">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={cn(
                          "rounded-md px-3 py-2 text-sm transition-colors hover:bg-emerald-900",
                          isActive(sub.href) ? "bg-emerald-900 font-medium text-white" : "text-emerald-300"
                        )}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-emerald-900",
                  isActive(item.href) ? "bg-emerald-900 text-white" : "text-emerald-200"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-emerald-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white font-bold uppercase">
              {session?.user?.name?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate w-32">{session?.user?.name || 'Pengguna'}</p>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-xs text-red-400 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Keluar
                </button>
                {userRole !== "FASILITATOR" && (
                  <Link href="/" className="text-xs text-emerald-400 hover:underline border-l border-emerald-700 pl-2">
                    Ganti Aplikasi
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
