"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export type ToastType = "default" | "success" | "error" | "warning"

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: ToastType
  duration?: number
}

interface ToastContextProps {
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextProps | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    setToasts((prev) => [...prev, newToast])

    if (props.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, props.duration || 3000)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

export function Toaster() {
  const context = React.useContext(ToastContext)
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!context || !mounted) return null
  
  const { toasts, dismiss } = context

  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all mb-2",
            t.type === "error" ? "bg-red-50 border-red-200 text-red-900" :
            t.type === "success" ? "bg-green-50 border-green-200 text-green-900" :
            t.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-900" :
            "bg-white border-gray-200"
          )}
        >
          <div className="flex flex-col gap-1 w-full">
            {t.title && <h3 className="text-sm font-semibold">{t.title}</h3>}
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="absolute right-1 top-1 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
