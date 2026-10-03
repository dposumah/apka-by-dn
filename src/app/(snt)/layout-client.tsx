"use client"

import * as React from "react"
import { SntSidebar } from "./sidebar"

export function SntLayoutClient({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div className="flex h-screen print:h-auto w-full bg-slate-50 print:bg-white">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block print:hidden shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SntSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>
      <div className="flex-1 overflow-auto print:overflow-visible flex flex-col">
        <div className="print:hidden">{header}</div>
        <main className="flex-1 overflow-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}
