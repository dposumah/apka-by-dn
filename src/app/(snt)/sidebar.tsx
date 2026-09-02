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
}

const menuItems: MenuItem[] = [
  { title: "Dashboard Proyek", href: "/dashboard-rab", icon: "📊", adminOnly: true },
  { title: "Pengeluaran Lapangan", href: "/pengeluaran", icon: "💸", adminOnly: true },
  { title: "Master Fasilitator", href: "/fasilitator", icon: "👩‍🏫", adminOnly: true },
  { title: "Portal Fasilitator", href: "/portal", icon: "🖥️" },
]

export function SntSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const isActive = (href: string) => pathname?.startsWith(href)

  // Filter menu: If FASILITATOR, only show non-adminOnly items
  const filteredMenus = menuItems.filter(item => {
    if (userRole === "FASILITATOR" && item.adminOnly) return false
    return true
  })

  return (
    <div className="flex h-full w-full flex-col border-r bg-emerald-950 text-emerald-50 overflow-y-auto">
      <div className="flex h-20 shrink-0 flex-col items-start justify-center border-b border-emerald-900 px-6">
        <h1 className="text-xl font-bold tracking-tight text-white leading-tight">KKA Robotika</h1>
        <h2 className="text-sm text-emerald-300">SNT 2026 by JTR Explorer</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {filteredMenus.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-emerald-900",
              isActive(item.href) ? "bg-emerald-900 text-white" : "text-emerald-200"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.title}
          </Link>
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
                  <Link href="/dashboard" className="text-xs text-emerald-400 hover:underline border-l border-emerald-700 pl-2">
                    Ke APKA Utama
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
