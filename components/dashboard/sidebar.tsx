"use client"

import { Play, Pause, RotateCcw, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SidebarProps {
  isRunning: boolean
  onToggleRunning: () => void
  onReset: () => void
  scenario: string
  onScenarioChange: (value: string) => void
}

export function Sidebar({
  isRunning,
  onToggleRunning,
  onReset,
  scenario,
  onScenarioChange,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border p-6 flex flex-col gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight">ABSA</h1>
          <p className="text-xs text-muted-foreground">Behavior Agent</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onToggleRunning}
          variant={isRunning ? "secondary" : "default"}
          className="w-full justify-start gap-2 h-11 rounded-xl transition-all duration-300"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
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
          className="w-full justify-start gap-2 h-11 rounded-xl border-border/50 hover:bg-secondary/50 transition-all duration-300"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">
          Scenario
        </label>
        <Select value={scenario} onValueChange={onScenarioChange}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="gamer">Gamer</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status indicator */}
      <div className="mt-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              isRunning
                ? "bg-[oklch(0.7_0.15_145)] shadow-[0_0_8px_oklch(0.7_0.15_145)]"
                : "bg-muted-foreground"
            }`}
          />
          {isRunning ? "Agent Active" : "Agent Paused"}
        </div>
      </div>
    </aside>
  )
}
