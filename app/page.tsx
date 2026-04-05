"use client"

import { useState, useEffect, useCallback } from "react"
import { Monitor, Activity, Zap, Flame } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Timeline, type TimelineEvent } from "@/components/dashboard/timeline"
import { InsightCard } from "@/components/dashboard/insight-card"

const initialEvents: TimelineEvent[] = [
  {
    id: "1",
    time: "10:30 AM",
    action: "Suggested Break",
    outcome: "accepted",
    type: "break",
  },
  {
    id: "2",
    time: "10:15 AM",
    action: "Blocked Social Media",
    outcome: "ignored",
    type: "block",
  },
  {
    id: "3",
    time: "9:45 AM",
    action: "Suggested Sleep Reminder",
    outcome: "accepted",
    type: "sleep",
  },
  {
    id: "4",
    time: "9:30 AM",
    action: "Sent Focus Notification",
    outcome: "accepted",
    type: "notification",
  },
  {
    id: "5",
    time: "9:00 AM",
    action: "Suggested Morning Break",
    outcome: "ignored",
    type: "break",
  },
]

const insights = [
  "User responds better to suggestions than restrictions.",
  "Low energy periods correlate with high screen usage.",
  "Morning breaks improve afternoon productivity by 23%.",
  "User accepts 68% of sleep-related suggestions.",
  "Blocking social media has 40% lower compliance than gentle reminders.",
]

const newActions: Omit<TimelineEvent, "id" | "time">[] = [
  { action: "Suggested Stretch Break", outcome: "accepted", type: "break" },
  { action: "Blocked Gaming Sites", outcome: "ignored", type: "block" },
  { action: "Sent Hydration Reminder", outcome: "accepted", type: "notification" },
  { action: "Suggested Power Nap", outcome: "accepted", type: "sleep" },
  { action: "Blocked News Websites", outcome: "ignored", type: "block" },
  { action: "Suggested Eye Rest", outcome: "accepted", type: "break" },
]

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true)
  const [scenario, setScenario] = useState("student")
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents)
  const [currentInsight, setCurrentInsight] = useState(insights[0])

  // Stats
  const [screenTime, setScreenTime] = useState(185) // minutes
  const [addictionScore, setAddictionScore] = useState(34)
  const [energyLevel, setEnergyLevel] = useState(72)
  const [habitStreak, setHabitStreak] = useState(7)

  // Trends
  const [screenTimeTrend] = useState(-12)
  const [addictionTrend] = useState(-8)
  const [energyTrend] = useState(5)
  const [streakTrend] = useState(15)

  const addNewEvent = useCallback(() => {
    const randomAction = newActions[Math.floor(Math.random() * newActions.length)]
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      time: timeString,
      ...randomAction,
    }

    setEvents((prev) => [newEvent, ...prev.slice(0, 9)])

    // Update stats based on outcome
    if (randomAction.outcome === "accepted") {
      setAddictionScore((prev) => Math.max(0, prev - Math.floor(Math.random() * 3)))
      setEnergyLevel((prev) => Math.min(100, prev + Math.floor(Math.random() * 5)))
      if (randomAction.type === "break") {
        setScreenTime((prev) => Math.max(0, prev - Math.floor(Math.random() * 10)))
      }
    } else {
      setAddictionScore((prev) => Math.min(100, prev + Math.floor(Math.random() * 2)))
      setScreenTime((prev) => prev + Math.floor(Math.random() * 5))
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const eventInterval = setInterval(() => {
      addNewEvent()
    }, 5000)

    const insightInterval = setInterval(() => {
      setCurrentInsight(insights[Math.floor(Math.random() * insights.length)])
    }, 8000)

    return () => {
      clearInterval(eventInterval)
      clearInterval(insightInterval)
    }
  }, [isRunning, addNewEvent])

  const handleReset = () => {
    setEvents(initialEvents)
    setScreenTime(185)
    setAddictionScore(34)
    setEnergyLevel(72)
    setHabitStreak(7)
    setCurrentInsight(insights[0])
  }

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
          {/* State Snapshot */}
          <section>
            <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
              State Snapshot
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Screen Time"
                value={screenTime}
                format="time"
                trend={screenTimeTrend}
                icon={Monitor}
              />
              <StatCard
                label="Addiction Score"
                value={addictionScore}
                format="percentage"
                trend={addictionTrend}
                icon={Activity}
              />
              <StatCard
                label="Energy Level"
                value={energyLevel}
                format="percentage"
                trend={energyTrend}
                icon={Zap}
              />
              <StatCard
                label="Habit Streak"
                value={habitStreak}
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
