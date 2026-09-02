import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | React.ReactNode
  subtitle?: string
  icon: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "blue" | "green" | "red" | "orange"
}

export function StatCard({ title, value, subtitle, icon, trend, trendValue, variant = "default" }: StatCardProps) {
  const variants = {
    default: "bg-white",
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    red: "bg-red-50 border-red-100",
    orange: "bg-orange-50 border-orange-100",
  }

  const iconColors = {
    default: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
  }

  return (
    <Card className={cn(variants[variant], "overflow-hidden")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full text-xl", iconColors[variant])}>
            {icon}
          </div>
        </div>
        
        {(subtitle || trendValue) && (
          <div className="mt-4 flex items-center text-sm">
            {trendValue && (
              <span
                className={cn(
                  "mr-2 font-medium",
                  trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
                )}
              >
                {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}
                {trendValue}
              </span>
            )}
            {subtitle && <span className="text-gray-500">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
