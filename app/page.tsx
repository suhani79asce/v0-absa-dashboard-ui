"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Monitor, Activity, Zap, Flame } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Timeline } from "@/components/dashboard/timeline"
import { InsightCard } from "@/components/dashboard/insight-card"
import {
  createInitialRLState,
  determineState,
  selectAction,
  updateQTable,
  simulateUserResponse,
  updateUserState,
  generateInsight,
  ACTION_LABELS,
  SCENARIO_STATES,
  type RLState,
  type UserState,
  type TimelineEvent,
  type ActionType,
} from "@/lib/rl-engine"

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true)
  const [scenario, setScenario] = useState("student")
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [currentInsight, setCurrentInsight] = useState("Agent is initializing and learning user preferences...")

  // RL State
  const [rlState, setRlState] = useState<RLState>(() => createInitialRLState())
  
  // User State
  const [userState, setUserState] = useState<UserState>(() => SCENARIO_STATES.student)

  // Previous values for trend calculation
  const prevUserStateRef = useRef<UserState>(userState)

  // Calculate trends
  const screenTimeTrend = Math.round((userState.screenTime - prevUserStateRef.current.screenTime) * 10)
  const addictionTrend = userState.addictionScore - prevUserStateRef.current.addictionScore
  const energyTrend = userState.energyLevel - prevUserStateRef.current.energyLevel
  const streakTrend = userState.habitStreak - prevUserStateRef.current.habitStreak

  // Handle scenario change
  useEffect(() => {
    const newState = SCENARIO_STATES[scenario as keyof typeof SCENARIO_STATES]
    setUserState(newState)
    prevUserStateRef.current = newState
    setEvents([])
    setRlState(createInitialRLState())
    setCurrentInsight("Agent is adapting to new scenario...")
  }, [scenario])

  const processAgentStep = useCallback(() => {
    // Step 1: Determine current state
    const currentState = determineState(userState)
    
    // Step 2: Select action using Q-learning policy
    const selectedAction = selectAction(rlState, currentState)
    
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    // Step 3: Create pending event
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      time: timeString,
      action: selectedAction,
      actionLabel: ACTION_LABELS[selectedAction],
      outcome: null,
      pending: true,
    }

    setEvents((prev) => [newEvent, ...prev.slice(0, 9)])

    // Step 4: Simulate user response after a delay
    setTimeout(() => {
      const outcome = simulateUserResponse(selectedAction, userState, scenario)
      
      // Update event with outcome
      setEvents((prev) =>
        prev.map((e) =>
          e.id === newEvent.id ? { ...e, outcome, pending: false } : e
        )
      )

      // Step 5: Update Q-table based on outcome (learning)
      const nextState = determineState(userState)
      const newRlState = updateQTable(rlState, currentState, selectedAction, outcome, nextState, userState)
      setRlState(newRlState)

      // Step 6: Update user state
      prevUserStateRef.current = userState
      const newUserState = updateUserState(userState, selectedAction, outcome)
      setUserState(newUserState)

      // Step 7: Generate new insight
      setCurrentInsight(generateInsight(newRlState, newUserState))
    }, 1500)
  }, [rlState, userState, scenario])

  useEffect(() => {
    if (!isRunning) return

    // Initial action
    const initialTimeout = setTimeout(() => {
      processAgentStep()
    }, 1000)

    // Subsequent actions
    const eventInterval = setInterval(() => {
      processAgentStep()
    }, 6000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(eventInterval)
    }
  }, [isRunning, processAgentStep])

  const handleReset = () => {
    const initialState = SCENARIO_STATES[scenario as keyof typeof SCENARIO_STATES]
    setEvents([])
    setUserState(initialState)
    prevUserStateRef.current = initialState
    setRlState(createInitialRLState())
    setCurrentInsight("Agent reset. Starting fresh with exploration mode...")
  }

  // Format screen time for display
  const formatScreenTimeMinutes = (hours: number) => Math.round(hours * 60)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Sidebar
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        scenario={scenario}
        onScenarioChange={setScenario}
      />

      {/* Main Content */}
      <main className="ml-64 p-8 lg:p-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* RL Status Indicator */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Q-Learning Agent</span>
            </div>
            <span className="text-border">|</span>
            <span>Exploration: {Math.round(rlState.explorationRate * 100)}%</span>
            <span className="text-border">|</span>
            <span>State: {determineState(userState).replace("_", " ")}</span>
          </div>

          {/* State Snapshot */}
          <section>
            <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
              State Snapshot
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Screen Time"
                value={formatScreenTimeMinutes(userState.screenTime)}
                format="time"
                trend={screenTimeTrend}
                icon={Monitor}
              />
              <StatCard
                label="Addiction Score"
                value={Math.round(userState.addictionScore)}
                format="percentage"
                trend={addictionTrend}
                icon={Activity}
              />
              <StatCard
                label="Energy Level"
                value={Math.round(userState.energyLevel)}
                format="percentage"
                trend={energyTrend}
                icon={Zap}
              />
              <StatCard
                label="Habit Streak"
                value={userState.habitStreak}
                unit="days"
                trend={streakTrend}
                icon={Flame}
              />
            </div>
          </section>

          {/* Behavior Timeline */}
          <section className="min-h-[400px]">
            <Timeline events={events} />
          </section>

          {/* Insight Card */}
          <section>
            <InsightCard insight={currentInsight} />
          </section>
        </div>
      </main>
    </div>
  )
}
