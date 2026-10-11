"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  ArrowLeftRight,
  LogOut,
  ChevronLeft,
  Sparkles,
  Layers,
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

const menuItems: MenuItem[] = [
  { 
    title: "Dashboard & Profit", 
    href: "/cashflow", 
    icon: LayoutDashboard,
    badge: "AI Insights" 
  },
  { 
    title: "Transaksi Keuangan", 
    href: "/cashflow/transactions", 
    icon: Wallet 
  },
  { 
    title: "Laporan Arus Kas", 
    href: "/cashflow/laporan", 
    icon: ClipboardList 
  },
]

interface CashflowSidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function CashflowSidebar({ isCollapsed = false, onToggleCollapse }: CashflowSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const isActive = (href: string) => {
    if (href === "/cashflow") {
      return pathname === "/cashflow"
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border-r border-indigo-900/40 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-indigo-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Layers size={22} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-bold text-white leading-tight tracking-wide flex items-center gap-1.5">
                Cashflow Proyek
              </h1>
              <p className="text-[11px] text-indigo-300 font-medium truncate">
                Bina Insani · ASMI · IYRC
              </p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-indigo-900/50 text-indigo-300 hover:text-white transition-colors duration-200 items-center justify-center"
            title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            <ChevronLeft
              size={18}
              className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* Project Switcher / Indicator Tag */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-indigo-900/30 bg-indigo-950/40">
          <div className="text-[11px] uppercase font-semibold tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-violet-400" /> Ruang Kerja 3 Proyek
          </div>
          <div className="flex flex-wrap gap-1 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">Bina Insani</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">ASMI</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">IYRC</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 font-medium"
                  : "text-slate-300 hover:bg-indigo-900/40 hover:text-white"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors duration-200",
                  active ? "text-white" : "text-indigo-400 group-hover:text-white"
                )}
              />
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm flex-1">{item.title}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                      active ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {active && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-indigo-900/40 p-4 bg-slate-950/60">
        {!isCollapsed ? (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3 px-1">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center shrink-0 shadow">
                <span className="text-white font-semibold text-sm uppercase">
                  {session?.user?.name?.[0] || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || "Administrator"}
                </p>
                <p className="text-xs text-indigo-300 truncate">
                  {session?.user?.role || "ADMIN"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              <Link 
                href="/" 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors"
              >
                <ArrowLeftRight size={16} />
                Ganti Ruang Kerja
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                {isLoggingOut ? "Sedang Keluar..." : "Keluar Akun"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm uppercase">
                {session?.user?.name?.[0] || "A"}
              </span>
            </div>
            <Link
              href="/"
              className="p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/50 transition-colors"
              title="Ganti Ruang Kerja"
            >
              <ArrowLeftRight size={18} />
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
