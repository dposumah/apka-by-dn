"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextProps | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: any) => {
        children.props.onClick?.(e)
        context.setOpen(!context.open)
      },
    })
  }

  return (
    <button onClick={() => context.setOpen(!context.open)}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, className, align = "right" }: { children: React.ReactNode, className?: string, align?: "left" | "right" }) {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

  if (!context.open) return null

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-700 shadow-md",
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  const context = React.useContext(DropdownContext)
  
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => {
        onClick?.()
        context?.setOpen(false)
      }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} />
}
