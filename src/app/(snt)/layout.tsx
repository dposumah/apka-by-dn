import * as React from "react"
import Link from "next/link"
import { SntSidebar } from "./sidebar"

export default function SntLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <div className="hidden w-64 md:block shrink-0">
        <SntSidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 md:hidden">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">SNT 2026</h1>
          </div>
        </header>
        <main className="h-[calc(100vh-4rem)] md:h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
