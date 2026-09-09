"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wallet,
  Users,
  ClipboardList,
  Award,
  Bus,
  Settings,
  Home,
  UserCircle,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react"

interface MenuItem {
  title: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  fasilOnly?: boolean
  submenu?: { title: string; href: string }[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard Proyek", href: "/dashboard-rab", icon: LayoutDashboard, adminOnly: true },
  { title: "Pengeluaran Lapangan", href: "/pengeluaran", icon: Wallet, adminOnly: true },
  {
    title: "Manajemen Fasilitator",
    href: "/fasilitator",
    icon: Users,
    adminOnly: true,
    submenu: [
      { title: "Data Fasilitator", href: "/fasilitator" },
      { title: "Laporan Mingguan", href: "/fasilitator/laporan" },
      { title: "Rekap Honorarium", href: "/fasilitator/rekap-honor" },
      { title: "Tagihan Transport", href: "/fasilitator/transport" },
    ],
  },
  { title: "Pengaturan Akun", href: "/snt-akun", icon: Settings, adminOnly: true },
  { title: "Dashboard", href: "/portal", icon: Home, fasilOnly: true },
  { title: "Profil Fasilitator", href: "/portal/profil", icon: UserCircle, fasilOnly: true },
  { title: "Pengaturan Sandi", href: "/portal/password", icon: Lock, fasilOnly: true },
]

export function SntSidebar({ isCollapsed = false, onToggleCollapse }: { isCollapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({ "Manajemen Fasilitator": true })

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal"
    return pathname === href || pathname?.startsWith(href + "/")
  }

  const filteredMenus = menuItems.filter(item => {
    if (userRole === "FASILITATOR" && item.adminOnly) return false
    if (userRole !== "FASILITATOR" && item.fasilOnly) return false
    return true
  })

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">JT</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-wide leading-tight truncate">PT. JT Robotic Explorer</h1>
              <p className="text-[11px] text-slate-400 truncate">KKA SNT 2026</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors duration-200 items-center justify-center"
          >
            <ChevronLeft
              size={18}
              className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMenus.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href) || (item.submenu?.some(s => isActive(s.href)) ?? false)

          if (item.submenu) {
            return (
              <div key={item.title}>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    active
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "shrink-0 transition-colors duration-200",
                      active ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0 transition-transform duration-200",
                          openMenus[item.title] ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>
                {openMenus[item.title] && !isCollapsed && (
                  <div className="mt-1 ml-5 pl-4 border-l border-slate-700 space-y-0.5">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          isActive(sub.href)
                            ? "bg-slate-700/80 font-medium text-white"
                            : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                        )}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                active
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors duration-200",
                  active ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm">{item.title}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-80" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-700 p-4">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-9 h-9 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm uppercase">
                {session?.user?.name?.[0] || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || "Pengguna"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={(e) => { e.preventDefault(); signOut({ callbackUrl: "/login" }) }}
                  onTouchEnd={(e) => { e.preventDefault(); signOut({ callbackUrl: "/login" }) }}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors p-0 bg-transparent border-0 cursor-pointer"
                >
                  Keluar
                </button>
                {userRole !== "FASILITATOR" && (
                  <Link href="/" className="text-xs text-emerald-400 hover:text-emerald-300 border-l border-slate-600 pl-2 transition-colors">
                    Ganti Aplikasi
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm uppercase">
                {session?.user?.name?.[0] || "U"}
              </span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); signOut({ callbackUrl: "/login" }) }}
              onTouchEnd={(e) => { e.preventDefault(); signOut({ callbackUrl: "/login" }) }}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors cursor-pointer bg-transparent border-0"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
