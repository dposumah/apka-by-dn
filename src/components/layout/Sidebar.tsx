"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MenuItem {
  title: string
  href: string
  icon: string
  submenu?: { title: string; href: string }[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "📊" },
  { title: "⚡ Kas Cepat", href: "/kas-cepat", icon: "⚡" },
  { title: "Bagan Akun", href: "/akun", icon: "📋" },
  { title: "Jurnal Umum", href: "/jurnal", icon: "📝" },
  { title: "Buku Besar", href: "/buku-besar", icon: "📖" },
  {
    title: "Piutang Usaha",
    href: "/piutang",
    icon: "💰",
    submenu: [
      { title: "Pelanggan", href: "/piutang/pelanggan" },
      { title: "Invoice", href: "/piutang/invoice" },
      { title: "Pembayaran", href: "/piutang/pembayaran" },
      { title: "Aging", href: "/piutang/aging" },
    ],
  },
  {
    title: "Hutang Usaha",
    href: "/hutang",
    icon: "💳",
    submenu: [
      { title: "Supplier", href: "/hutang/supplier" },
      { title: "Tagihan", href: "/hutang/tagihan" },
      { title: "Pembayaran", href: "/hutang/pembayaran" },
      { title: "Aging", href: "/hutang/aging" },
    ],
  },
  {
    title: "Inventori",
    href: "/inventori",
    icon: "📦",
    submenu: [
      { title: "Produk", href: "/inventori/produk" },
      { title: "Stok", href: "/inventori/stok" },
      { title: "Penyesuaian", href: "/inventori/penyesuaian" },
    ],
  },
  {
    title: "Bank",
    href: "/bank",
    icon: "🏦",
    submenu: [
      { title: "Akun Bank", href: "/bank/akun" },
      { title: "Transaksi", href: "/bank/transaksi" },
      { title: "Rekonsiliasi", href: "/bank/rekonsiliasi" },
    ],
  },
  { title: "Pajak", href: "/pajak", icon: "🧾" },
  { title: "Anggaran", href: "/anggaran", icon: "📈" },
  {
    title: "Laporan",
    href: "/laporan",
    icon: "📑",
    submenu: [
      { title: "Laba Rugi", href: "/laporan/laba-rugi" },
      { title: "Neraca", href: "/laporan/neraca" },
      { title: "Arus Kas", href: "/laporan/arus-kas" },
      { title: "Neraca Saldo", href: "/laporan/neraca-saldo" },
    ],
  },
  { title: "Panduan", href: "/panduan", icon: "📚" },
  { title: "Pengaturan", href: "/pengaturan", icon: "⚙️" },
]

export function Sidebar({ onMobileItemClick }: { onMobileItemClick?: () => void }) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const isActive = (href: string) => pathname?.startsWith(href)

  return (
    <div className="flex h-full w-full flex-col border-r bg-white overflow-y-auto">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo APKA" className="h-8 w-8 object-contain rounded-md" />
          <h1 className="text-xl font-bold text-blue-700 tracking-tight">APKA</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100",
                    isActive(item.href) ? "bg-slate-100 text-blue-700" : "text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {item.title}
                  </div>
                  <span className="text-xs">{openMenus[item.title] ? "▼" : "▶"}</span>
                </button>
                {openMenus[item.title] && (
                  <div className="ml-8 mt-1 flex flex-col space-y-1 border-l pl-2">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        onClick={onMobileItemClick}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-slate-100",
                          pathname === subItem.href ? "font-medium text-blue-700" : "text-slate-600"
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onMobileItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100",
                  pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-700"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
            AD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin Utama</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}
