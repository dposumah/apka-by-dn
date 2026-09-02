import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string | React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon = "📁", action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="mb-4 text-4xl text-gray-400">{icon}</div>
      <h3 className="mb-1 text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mb-4 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
