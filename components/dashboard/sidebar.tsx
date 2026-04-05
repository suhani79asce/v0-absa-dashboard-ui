"use client"

import { Play, Pause, RotateCcw, LayoutDashboard, Brain, LineChart, History, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type ViewType = "dashboard" | "rl-insights"

interface SidebarProps {
  isRunning: boolean
  onToggleRunning: () => void
  onReset: () => void
  scenario: string
  onScenarioChange: (value: string) => void
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  learningUpdates: number
}

export function Sidebar({
  isRunning,
  onToggleRunning,
  onReset,
  scenario,
  onScenarioChange,
  currentView,
  onViewChange,
  learningUpdates,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard" as ViewType,
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview",
    },
    {
      id: "rl-insights" as ViewType,
      label: "RL Insights",
      icon: Brain,
      description: "Learning",
      badge: learningUpdates > 0 ? learningUpdates : undefined,
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar/90 backdrop-blur-xl border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.18_280)] via-[oklch(0.68_0.2_195)] to-[oklch(0.72_0.18_145)] flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.72_0.18_145)] border-2 border-sidebar animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight">ABSA</h1>
            <p className="text-xs text-muted-foreground">Adaptive Behavior Agent</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
              currentView === item.id
                ? "bg-gradient-to-r from-primary/20 to-accent/10 text-sidebar-foreground border border-primary/30"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              currentView === item.id && "text-primary"
            )} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/20 text-primary">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-2">
          Agent Controls
        </p>
        <Button
          onClick={onToggleRunning}
          className={cn(
            "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-300 font-medium",
            isRunning
              ? "bg-[oklch(0.72_0.18_145)]/15 text-[oklch(0.72_0.18_145)] hover:bg-[oklch(0.72_0.18_145)]/25 border border-[oklch(0.72_0.18_145)]/30"
              : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
          )}
          variant={isRunning ? "ghost" : "default"}
        >
          {isRunning ? (
            <>
              <div className="relative">
                <Pause className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[oklch(0.72_0.18_145)] animate-pulse" />
              </div>
              Pause Agent
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Agent
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full justify-start gap-3 h-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-300"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Agent
        </Button>
      </div>

      {/* Scenario Selector */}
      <div className="p-4 pt-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 mb-2">
          Scenario
        </p>
        <Select value={scenario} onValueChange={onScenarioChange}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-sidebar-accent/50 border-sidebar-border/50 hover:bg-sidebar-accent transition-colors">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="student">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.18_280)]" />
                Student
              </div>
            </SelectItem>
            <SelectItem value="gamer">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.18_145)]" />
                Gamer
              </div>
            </SelectItem>
            <SelectItem value="professional">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[oklch(0.68_0.2_195)]" />
                Professional
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sidebar-accent/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <LineChart className="w-3 h-3 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Updates</span>
            </div>
            <p className="text-lg font-semibold text-sidebar-foreground">{learningUpdates}</p>
          </div>
          <div className="bg-sidebar-accent/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-3 h-3 text-accent" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
            </div>
            <p className={cn(
              "text-sm font-medium",
              isRunning ? "text-[oklch(0.72_0.18_145)]" : "text-muted-foreground"
            )}>
              {isRunning ? "Learning" : "Paused"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
