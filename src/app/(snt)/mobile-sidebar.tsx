"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { SntSidebar } from "./sidebar"
import { usePathname } from "next/navigation"

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
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
        onTouchEnd={(e) => { e.preventDefault(); setIsOpen(true) }}
        className="p-2 -ml-2 mr-2 rounded-lg hover:bg-slate-100 text-slate-700 md:hidden transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="relative flex w-72 max-w-[85vw] h-[100dvh] flex-col shadow-2xl animate-in slide-in-from-left-full duration-300">
            {/* Close Button */}
            <button
              type="button"
              className="absolute top-4 -right-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 focus:outline-none transition-colors z-10"
              onClick={() => setIsOpen(false)}
              onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false) }}
            >
              <span className="sr-only">Tutup menu</span>
              <X className="h-5 w-5 text-white" />
            </button>

            <SntSidebar />
          </div>
        </div>
      )}
    </>
  )
}
