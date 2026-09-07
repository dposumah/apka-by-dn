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
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-700 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="relative flex w-64 max-w-[80vw] h-[100dvh] flex-col bg-emerald-950 shadow-xl animate-in slide-in-from-left-full duration-300">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-900/50 hover:bg-slate-900/80"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Tutup menu</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <SntSidebar />
          </div>
        </div>
      )}
    </>
  )
}
