"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { CashflowSidebar } from "./sidebar"
import { usePathname } from "next/navigation"

export function CashflowMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 mr-2 rounded-lg hover:bg-indigo-50 text-indigo-900 md:hidden transition-colors"
        aria-label="Buka Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative flex w-72 max-w-[85vw] h-[100dvh] flex-col shadow-2xl animate-in slide-in-from-left-full duration-300">
            <button
              type="button"
              className="absolute top-4 -right-12 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/60 hover:bg-slate-950/80 focus:outline-none transition-colors z-10"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Tutup menu</span>
              <X className="h-5 w-5 text-white" />
            </button>

            <CashflowSidebar />
          </div>
        </div>
      )}
    </>
  )
}
