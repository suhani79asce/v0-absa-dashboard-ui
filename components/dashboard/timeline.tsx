"use client"

import { useEffect, useRef } from "react"
import {
  Coffee,
  Moon,
  ShieldOff,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react"

export interface TimelineEvent {
  id: string
  time: string
  action: string
  outcome: "accepted" | "ignored"
  type: "break" | "sleep" | "block" | "notification"
}

interface TimelineProps {
  events: TimelineEvent[]
}

const iconMap: Record<TimelineEvent["type"], LucideIcon> = {
  break: Coffee,
  sleep: Moon,
  block: ShieldOff,
  notification: Bell,
}

export function Timeline({ events }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [events])

  return (
    <div className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Behavior Timeline
        </h2>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-0 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {events.map((event, index) => {
          const Icon = iconMap[event.type]
          const isAccepted = event.outcome === "accepted"
          const isRecent = index === 0

          return (
            <div
              key={event.id}
              className={`relative pl-8 pb-6 border-l-2 transition-all duration-500 ${
                isRecent
                  ? "border-primary/50"
                  : "border-border/30"
              }`}
              style={{
                animation: isRecent ? "fadeSlideIn 0.5s ease-out" : undefined,
              }}
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  isRecent
                    ? "bg-primary border-primary shadow-[0_0_12px_oklch(0.7_0.15_280)]"
                    : "bg-card border-border"
                }`}
              />

              <div
                className={`rounded-xl p-4 transition-all duration-300 ${
                  isRecent
                    ? "bg-secondary/50"
                    : "bg-transparent hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isAccepted
                          ? "bg-[oklch(0.7_0.15_145)]/10"
                          : "bg-[oklch(0.65_0.15_25)]/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isAccepted
                            ? "text-[oklch(0.7_0.15_145)]"
                            : "text-[oklch(0.65_0.15_25)]"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {event.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isAccepted
                        ? "text-[oklch(0.7_0.15_145)] bg-[oklch(0.7_0.15_145)]/10"
                        : "text-[oklch(0.65_0.15_25)] bg-[oklch(0.65_0.15_25)]/10"
                    }`}
                  >
                    {isAccepted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Accepted
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Ignored
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
