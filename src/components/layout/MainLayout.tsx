"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { ToastProvider } from "@/components/ui/toast"
import { Menu } from "lucide-react"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <ToastProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar Content */}
        <div className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white transform transition-transform duration-200 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onMobileItemClick={() => setIsMobileMenuOpen(false)} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

