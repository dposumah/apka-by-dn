import * as React from "react"
import Link from "next/link"
import { SntSidebar } from "./sidebar"
import { SntHeader } from "./header"

export default function SntLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <div className="hidden w-64 md:block shrink-0">
        <SntSidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <SntHeader />
        <main className="h-[calc(100vh-4rem)] md:h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
