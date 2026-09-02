"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MenuItem {
  title: string
  href: string
  icon: string
}

const menuItems: MenuItem[] = [
  { title: "Dashboard Proyek", href: "/dashboard-rab", icon: "📊" },
  { title: "Pengeluaran Lapangan", href: "/pengeluaran", icon: "💸" },
  { title: "Master Fasilitator", href: "/fasilitator", icon: "👩‍🏫" },
  { title: "Portal Fasilitator", href: "/portal", icon: "🖥️" },
]

export function SntSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname?.startsWith(href)

  return (
    <div className="flex h-full w-full flex-col border-r bg-emerald-950 text-emerald-50 overflow-y-auto">
      <div className="flex h-20 shrink-0 flex-col items-start justify-center border-b border-emerald-900 px-6">
        <h1 className="text-xl font-bold tracking-tight text-white leading-tight">KKA Robotika</h1>
        <h2 className="text-sm text-emerald-300">SNT 2026 by JTR Explorer</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => (
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
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white font-bold">
            AD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">SNT Admin</p>
            <Link href="/dashboard" className="text-xs text-emerald-400 hover:underline">← Kembali ke APKA</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
