"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: number | string
  unit?: string
  trend?: number
  icon: LucideIcon
  format?: "number" | "time" | "percentage"
}

export function StatCard({
  label,
  value,
  unit,
  trend = 0,
  icon: Icon,
  format = "number",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const timeout = setTimeout(() => {
      setDisplayValue(value)
      setIsAnimating(false)
    }, 150)
    return () => clearTimeout(timeout)
  }, [value])

  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val
    if (format === "time") {
      const hours = Math.floor(val / 60)
      const minutes = val % 60
      return `${hours}h ${minutes}m`
    }
    if (format === "percentage") return `${val}%`
    return val.toString()
  }

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor =
    trend > 0
      ? "text-[oklch(0.7_0.15_145)]"
      : trend < 0
      ? "text-[oklch(0.65_0.15_25)]"
      : "text-muted-foreground"

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-5 transition-all duration-300 hover:bg-card/60 hover:border-border hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold tracking-tight transition-all duration-300 ${
                isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {formatValue(displayValue)}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Trend indicator */}
      <div className={`mt-3 flex items-center gap-1 text-xs ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span>{Math.abs(trend)}% from yesterday</span>
      </div>
    </div>
  )
}
