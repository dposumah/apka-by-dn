"use client"

import * as React from "react"
import { SntSidebar } from "./sidebar"

export function SntLayoutClient({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SntSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>
      <div className="flex-1 overflow-auto flex flex-col">
        {header}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
