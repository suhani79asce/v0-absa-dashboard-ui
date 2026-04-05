"use client"

import { useState } from "react"
import { Brain, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  type RLState,
  type ActionType,
  type StateKey,
  ACTION_LABELS,
} from "@/lib/rl-engine"

interface LearningEvent {
  id: string
  timestamp: string
  state: StateKey
  action: ActionType
  outcome: "accepted" | "ignored"
  reward: number
  qValueBefore: number
  qValueAfter: number
}

interface RLInsightsProps {
  rlState: RLState
  learningHistory: LearningEvent[]
}

const STATE_LABELS: Record<StateKey, string> = {
  low_energy: "Low Energy",
  high_screen: "High Screen",
  late_night: "Late Night",
  productive: "Productive",
  distracted: "Distracted",
}

const STATES: StateKey[] = ["low_energy", "high_screen", "late_night", "productive", "distracted"]
const ACTIONS: ActionType[] = ["suggest_break", "block_social", "suggest_sleep", "send_reminder", "reward_streak", "limit_screen"]

export function RLInsights({ rlState, learningHistory }: RLInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<"qtable" | "policy" | "history">("qtable")

  // Calculate best action for each state (the learned policy)
  const learnedPolicy: Record<StateKey, { action: ActionType; confidence: number }> = {} as Record<StateKey, { action: ActionType; confidence: number }>
  
  for (const state of STATES) {
    const qValues = rlState.qTable[state]
    let bestAction: ActionType = ACTIONS[0]
    let bestValue = qValues[bestAction]
    
    for (const action of ACTIONS) {
      if (qValues[action] > bestValue) {
        bestValue = qValues[action]
        bestAction = action
      }
    }
    
    // Calculate confidence based on how much better the best action is vs average
    const values = Object.values(qValues)
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length
    const confidence = bestValue > 0 ? Math.min(100, ((bestValue - avgValue) / bestValue) * 100 + 50) : 50
    
    learnedPolicy[state] = { action: bestAction, confidence }
  }

  // Get color for Q-value visualization
  const getQValueColor = (value: number) => {
    if (value < 0) return "bg-destructive/30 text-destructive"
    if (value < 0.3) return "bg-muted/50 text-muted-foreground"
    if (value < 0.6) return "bg-accent/30 text-accent"
    return "bg-primary/30 text-primary"
  }

  const getQValueWidth = (value: number) => {
    const normalized = Math.max(0, Math.min(1, (value + 0.5) / 1.5))
    return `${normalized * 100}%`
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-foreground">RL Learning Insights</h3>
            <p className="text-xs text-muted-foreground">
              {learningHistory.length} learning updates | Exploration: {Math.round(rlState.explorationRate * 100)}%
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border/50">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            {[
              { id: "qtable", label: "Q-Table" },
              { id: "policy", label: "Learned Policy" },
              { id: "history", label: "Learning History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 px-4 py-2.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "qtable" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Q-values represent learned action values for each state. Higher values (green) indicate preferred actions.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium">State</th>
                        {ACTIONS.map((action) => (
                          <th key={action} className="text-left py-2 px-2 text-muted-foreground font-medium">
                            {ACTION_LABELS[action].split(" ")[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STATES.map((state) => (
                        <tr key={state} className="border-b border-border/30">
                          <td className="py-2 pr-3 font-medium text-foreground">
                            {STATE_LABELS[state]}
                          </td>
                          {ACTIONS.map((action) => {
                            const value = rlState.qTable[state][action]
                            const isBest = learnedPolicy[state].action === action
                            return (
                              <td key={action} className="py-2 px-2">
                                <div className="relative">
                                  <div
                                    className={cn(
                                      "px-2 py-1 rounded text-center font-mono",
                                      getQValueColor(value),
                                      isBest && "ring-1 ring-primary"
                                    )}
                                  >
                                    {value.toFixed(2)}
                                  </div>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "policy" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  The agent has learned the optimal action for each user state based on past interactions.
                </p>
                {STATES.map((state) => {
                  const { action, confidence } = learnedPolicy[state]
                  return (
                    <div
                      key={state}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {STATE_LABELS[state]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            When user is in this state
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <p className="text-sm font-medium text-primary">
                            {ACTION_LABELS[action]}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8">
                            {Math.round(confidence)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {learningHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No learning updates yet. Start the agent to see updates.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Recent Q-value updates from user feedback.
                    </p>
                    {learningHistory.slice(0, 20).map((event) => {
                      const qChange = event.qValueAfter - event.qValueBefore
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/30 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-1.5 h-8 rounded-full",
                                event.outcome === "accepted" ? "bg-[var(--positive)]" : "bg-[var(--negative)]"
                              )}
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {ACTION_LABELS[event.action]}
                              </p>
                              <p className="text-muted-foreground">
                                {STATE_LABELS[event.state]} | {event.timestamp}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              {qChange > 0.01 ? (
                                <TrendingUp className="w-3 h-3 text-[var(--positive)]" />
                              ) : qChange < -0.01 ? (
                                <TrendingDown className="w-3 h-3 text-[var(--negative)]" />
                              ) : (
                                <Minus className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span
                                className={cn(
                                  "font-mono",
                                  qChange > 0 ? "text-[var(--positive)]" : qChange < 0 ? "text-[var(--negative)]" : "text-muted-foreground"
                                )}
                              >
                                {qChange >= 0 ? "+" : ""}
                                {qChange.toFixed(3)}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-[10px]">
                              Q: {event.qValueBefore.toFixed(2)} → {event.qValueAfter.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
