"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Monitor, Activity, Zap, Flame } from "lucide-react"
import { Sidebar, type ViewType } from "@/components/dashboard/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Timeline } from "@/components/dashboard/timeline"
import { InsightCard } from "@/components/dashboard/insight-card"
import { RLInsights } from "@/components/dashboard/rl-insights"
import {
  createInitialRLState,
  determineState,
  selectAction,
  updateQTable,
  simulateUserResponse,
  updateUserState,
  generateInsight,
  calculateReward,
  ACTION_LABELS,
  SCENARIO_STATES,
  type RLState,
  type UserState,
  type TimelineEvent,
  type ActionType,
  type LearningEvent,
  type StateKey,
} from "@/lib/rl-engine"

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true)
  const [scenario, setScenario] = useState("student")
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [currentInsight, setCurrentInsight] = useState("Agent is initializing and learning user preferences...")
  const [learningHistory, setLearningHistory] = useState<LearningEvent[]>([])
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")

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
    setLearningHistory([])
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

      // Get Q-value before update
      const qValueBefore = rlState.qTable[currentState][selectedAction]

      // Step 5: Update Q-table based on outcome (learning)
      const nextState = determineState(userState)
      const newRlState = updateQTable(rlState, currentState, selectedAction, outcome, nextState, userState)
      setRlState(newRlState)

      // Get Q-value after update
      const qValueAfter = newRlState.qTable[currentState][selectedAction]

      // Calculate reward for learning history
      const reward = calculateReward(selectedAction, outcome, userState)

      // Add to learning history
      const learningEvent: LearningEvent = {
        id: Date.now().toString(),
        timestamp: timeString,
        state: currentState,
        action: selectedAction,
        outcome,
        reward,
        qValueBefore,
        qValueAfter,
      }
      setLearningHistory((prev) => [learningEvent, ...prev.slice(0, 49)])

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
    setLearningHistory([])
    setCurrentInsight("Agent reset. Starting fresh with exploration mode...")
  }

  // Format screen time for display
  const formatScreenTimeMinutes = (hours: number) => Math.round(hours * 60)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[oklch(0.15_0.03_270)]">
      <Sidebar
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        scenario={scenario}
        onScenarioChange={setScenario}
        currentView={currentView}
        onViewChange={setCurrentView}
        learningUpdates={learningHistory.length}
      />

      {/* Main Content */}
      <main className="ml-72 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {currentView === "dashboard" ? (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
                  <p className="text-sm text-muted-foreground mt-1">Monitor agent behavior and user state</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[oklch(0.72_0.18_145)] animate-pulse' : 'bg-muted-foreground'}`} />
                    <span>{isRunning ? 'Learning' : 'Paused'}</span>
                  </div>
                  <span className="text-border">|</span>
                  <span>Exploration: <span className="text-primary font-medium">{Math.round(rlState.explorationRate * 100)}%</span></span>
                  <span className="text-border">|</span>
                  <span>State: <span className="text-accent font-medium">{determineState(userState).replace("_", " ")}</span></span>
                </div>
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
                    color="primary"
                  />
                  <StatCard
                    label="Addiction Score"
                    value={Math.round(userState.addictionScore)}
                    format="percentage"
                    trend={addictionTrend}
                    icon={Activity}
                    color="destructive"
                  />
                  <StatCard
                    label="Energy Level"
                    value={Math.round(userState.energyLevel)}
                    format="percentage"
                    trend={energyTrend}
                    icon={Zap}
                    color="warning"
                  />
                  <StatCard
                    label="Habit Streak"
                    value={userState.habitStreak}
                    unit="days"
                    trend={streakTrend}
                    icon={Flame}
                    color="positive"
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
          ) : (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">RL Insights</h1>
                  <p className="text-sm text-muted-foreground mt-1">Explore what the agent has learned through reinforcement learning</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/50">
                  <span>Total Updates: <span className="text-primary font-medium">{learningHistory.length}</span></span>
                  <span className="text-border">|</span>
                  <span>Learning Rate: <span className="text-accent font-medium">{rlState.learningRate}</span></span>
                </div>
              </div>

              {/* RL Insights Panel - Full Width */}
              <RLInsights rlState={rlState} learningHistory={learningHistory} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
