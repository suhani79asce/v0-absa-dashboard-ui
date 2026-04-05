"use client"

// Simple Q-Learning based Reinforcement Learning Engine for ABSA

export type ActionType = 
  | "suggest_break"
  | "block_social"
  | "suggest_sleep"
  | "send_reminder"
  | "reward_streak"
  | "limit_screen"

export type StateKey = "low_energy" | "high_screen" | "late_night" | "productive" | "distracted"

export type Outcome = "accepted" | "ignored"

export interface TimelineEvent {
  id: string
  time: string
  action: ActionType
  actionLabel: string
  outcome: Outcome | null
  pending: boolean
}

export interface UserState {
  screenTime: number
  addictionScore: number
  energyLevel: number
  habitStreak: number
}

export interface RLState {
  qTable: Record<string, Record<ActionType, number>>
  explorationRate: number
  learningRate: number
  discountFactor: number
}

export interface LearningEvent {
  id: string
  timestamp: string
  state: StateKey
  action: ActionType
  outcome: "accepted" | "ignored"
  reward: number
  qValueBefore: number
  qValueAfter: number
}

// Action labels for display
export const ACTION_LABELS: Record<ActionType, string> = {
  suggest_break: "Suggested Break",
  block_social: "Blocked Social Media",
  suggest_sleep: "Suggested Sleep",
  send_reminder: "Sent Reminder",
  reward_streak: "Rewarded Streak",
  limit_screen: "Limited Screen Time",
}

// Map scenarios to different initial states
export const SCENARIO_STATES: Record<string, UserState> = {
  student: { screenTime: 4.2, addictionScore: 62, energyLevel: 71, habitStreak: 5 },
  gamer: { screenTime: 7.8, addictionScore: 78, energyLevel: 45, habitStreak: 2 },
  professional: { screenTime: 5.5, addictionScore: 45, energyLevel: 68, habitStreak: 12 },
}

// Initialize Q-table with optimistic values
function initializeQTable(): Record<string, Record<ActionType, number>> {
  const states: StateKey[] = ["low_energy", "high_screen", "late_night", "productive", "distracted"]
  const actions: ActionType[] = ["suggest_break", "block_social", "suggest_sleep", "send_reminder", "reward_streak", "limit_screen"]
  
  const qTable: Record<string, Record<ActionType, number>> = {}
  
  for (const state of states) {
    qTable[state] = {} as Record<ActionType, number>
    for (const action of actions) {
      // Initialize with small random values for exploration
      qTable[state][action] = Math.random() * 0.5
    }
  }
  
  // Add some prior knowledge (soft constraints)
  qTable["low_energy"]["suggest_break"] = 0.7
  qTable["low_energy"]["suggest_sleep"] = 0.6
  qTable["high_screen"]["limit_screen"] = 0.6
  qTable["high_screen"]["block_social"] = 0.5
  qTable["late_night"]["suggest_sleep"] = 0.8
  qTable["productive"]["reward_streak"] = 0.7
  qTable["distracted"]["send_reminder"] = 0.6
  
  return qTable
}

// Determine current state based on user metrics
export function determineState(userState: UserState): StateKey {
  const hour = new Date().getHours()
  
  if (hour >= 22 || hour < 6) return "late_night"
  if (userState.energyLevel < 50) return "low_energy"
  if (userState.screenTime > 6) return "high_screen"
  if (userState.addictionScore < 50 && userState.habitStreak > 5) return "productive"
  return "distracted"
}

// Select action using epsilon-greedy policy
export function selectAction(rlState: RLState, currentState: StateKey): ActionType {
  const actions: ActionType[] = ["suggest_break", "block_social", "suggest_sleep", "send_reminder", "reward_streak", "limit_screen"]
  
  // Exploration vs exploitation
  if (Math.random() < rlState.explorationRate) {
    // Random action (exploration)
    return actions[Math.floor(Math.random() * actions.length)]
  }
  
  // Greedy action (exploitation)
  const qValues = rlState.qTable[currentState]
  let bestAction = actions[0]
  let bestValue = qValues[bestAction]
  
  for (const action of actions) {
    if (qValues[action] > bestValue) {
      bestValue = qValues[action]
      bestAction = action
    }
  }
  
  return bestAction
}

// Calculate reward based on outcome and action context
export function calculateReward(action: ActionType, outcome: Outcome, userState: UserState): number {
  const baseReward = outcome === "accepted" ? 1.0 : -0.5
  
  // Bonus for appropriate actions
  let bonus = 0
  if (action === "suggest_sleep" && new Date().getHours() >= 22) {
    bonus = outcome === "accepted" ? 0.3 : 0
  }
  if (action === "suggest_break" && userState.screenTime > 4) {
    bonus = outcome === "accepted" ? 0.2 : 0
  }
  if (action === "reward_streak" && userState.habitStreak > 5) {
    bonus = 0.2 // Always good to reward streaks
  }
  
  return baseReward + bonus
}

// Update Q-table using Q-learning update rule
export function updateQTable(
  rlState: RLState,
  currentState: StateKey,
  action: ActionType,
  outcome: Outcome,
  nextState: StateKey,
  userState: UserState
): RLState {
  const reward = calculateReward(action, outcome, userState)
  
  // Find max Q-value for next state
  const nextStateValues = Object.values(rlState.qTable[nextState])
  const maxNextQ = Math.max(...nextStateValues)
  
  // Q-learning update
  const currentQ = rlState.qTable[currentState][action]
  const newQ = currentQ + rlState.learningRate * (
    reward + rlState.discountFactor * maxNextQ - currentQ
  )
  
  // Create updated Q-table
  const newQTable = { ...rlState.qTable }
  newQTable[currentState] = { ...newQTable[currentState], [action]: newQ }
  
  // Decay exploration rate over time
  const newExplorationRate = Math.max(0.1, rlState.explorationRate * 0.995)
  
  return {
    ...rlState,
    qTable: newQTable,
    explorationRate: newExplorationRate,
  }
}

// Initialize RL state
export function createInitialRLState(): RLState {
  return {
    qTable: initializeQTable(),
    explorationRate: 0.3, // 30% exploration initially
    learningRate: 0.1,
    discountFactor: 0.9,
  }
}

// Simulate user response based on action appropriateness
export function simulateUserResponse(
  action: ActionType,
  userState: UserState,
  scenario: string
): Outcome {
  const hour = new Date().getHours()
  
  // Base acceptance probability
  let acceptProb = 0.5
  
  // Adjust based on action appropriateness
  if (action === "suggest_sleep" && hour >= 22) acceptProb += 0.3
  if (action === "suggest_break" && userState.screenTime > 4) acceptProb += 0.2
  if (action === "block_social" && userState.addictionScore > 60) acceptProb -= 0.2 // Users resist restrictions
  if (action === "reward_streak" && userState.habitStreak > 3) acceptProb += 0.3
  if (action === "limit_screen" && userState.screenTime > 6) acceptProb += 0.1
  
  // Scenario-specific adjustments
  if (scenario === "student") {
    if (action === "suggest_break") acceptProb += 0.1
  } else if (scenario === "gamer") {
    if (action === "block_social") acceptProb -= 0.2
    if (action === "limit_screen") acceptProb -= 0.1
  } else if (scenario === "professional") {
    if (action === "send_reminder") acceptProb += 0.2
    if (action === "reward_streak") acceptProb += 0.1
  }
  
  // Add some randomness
  acceptProb = Math.max(0.1, Math.min(0.9, acceptProb))
  
  return Math.random() < acceptProb ? "accepted" : "ignored"
}

// Update user state based on action and outcome
export function updateUserState(
  userState: UserState,
  action: ActionType,
  outcome: Outcome
): UserState {
  const newState = { ...userState }
  
  if (outcome === "accepted") {
    switch (action) {
      case "suggest_break":
        newState.screenTime = Math.max(0, newState.screenTime - 0.3)
        newState.energyLevel = Math.min(100, newState.energyLevel + 5)
        newState.addictionScore = Math.max(0, newState.addictionScore - 2)
        break
      case "block_social":
        newState.screenTime = Math.max(0, newState.screenTime - 0.5)
        newState.addictionScore = Math.max(0, newState.addictionScore - 3)
        break
      case "suggest_sleep":
        newState.energyLevel = Math.min(100, newState.energyLevel + 10)
        newState.habitStreak += 1
        break
      case "send_reminder":
        newState.addictionScore = Math.max(0, newState.addictionScore - 1)
        break
      case "reward_streak":
        newState.habitStreak += 1
        newState.energyLevel = Math.min(100, newState.energyLevel + 3)
        break
      case "limit_screen":
        newState.screenTime = Math.max(0, newState.screenTime - 0.8)
        newState.addictionScore = Math.max(0, newState.addictionScore - 4)
        break
    }
  } else {
    // Ignored actions may have slight negative effects
    newState.screenTime += 0.1
    newState.addictionScore = Math.min(100, newState.addictionScore + 1)
  }
  
  return newState
}

// Generate insight based on Q-table analysis
export function generateInsight(rlState: RLState, userState: UserState): string {
  const currentState = determineState(userState)
  const qValues = rlState.qTable[currentState]
  
  // Find best and worst actions
  const sortedActions = Object.entries(qValues)
    .sort(([, a], [, b]) => b - a)
  
  const bestAction = sortedActions[0][0] as ActionType
  const worstAction = sortedActions[sortedActions.length - 1][0] as ActionType
  
  const insights = [
    `User responds ${qValues[bestAction] > 0.6 ? "very well" : "better"} to ${ACTION_LABELS[bestAction].toLowerCase()} than ${ACTION_LABELS[worstAction].toLowerCase()}.`,
    `Current state: ${currentState.replace("_", " ")}. Agent is ${rlState.explorationRate > 0.2 ? "exploring" : "exploiting"} learned patterns.`,
    `${userState.energyLevel < 50 ? "Low energy detected." : "Energy levels stable."} ${userState.addictionScore > 60 ? "High addiction risk." : "Addiction score manageable."}`,
    `Learning rate: ${(rlState.learningRate * 100).toFixed(0)}%. Exploration: ${(rlState.explorationRate * 100).toFixed(0)}%. The agent is adapting to user preferences.`,
    `Habit streak of ${userState.habitStreak} days. ${userState.habitStreak > 7 ? "Excellent progress!" : "Building momentum."}`,
  ]
  
  return insights[Math.floor(Math.random() * insights.length)]
}
