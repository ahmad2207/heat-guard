import { createContext, useContext } from 'react'

/**
 * Outcomes occupational health has chosen for escalated cases, by worker. Shared with supervisor
 * Today, which only ever shows the outcome, never symptoms or the clinical note. Saved to
 * localStorage for demos.
 */
export interface EscalationOutcome {
  /** An id from OH_OUTCOMES. */
  id: string
  /** Demo clock time, HH:MM. */
  at: string
}

export interface EscalationOutcomesValue {
  outcomes: Record<string, EscalationOutcome>
  setOutcome: (workerId: string, outcome: EscalationOutcome) => void
  reset: () => void
}

export const OUTCOMES_STORAGE_KEY = 'heatguard.outcomes.v1'

export function loadOutcomes(): Record<string, EscalationOutcome> {
  try {
    const raw = window.localStorage.getItem(OUTCOMES_STORAGE_KEY)
    const saved: unknown = raw ? JSON.parse(raw) : null
    if (!saved || typeof saved !== 'object') return {}
    const outcomes: Record<string, EscalationOutcome> = {}
    for (const [workerId, value] of Object.entries(saved as Record<string, unknown>)) {
      const v = value as Partial<EscalationOutcome> | null
      if (v && typeof v.id === 'string' && typeof v.at === 'string') {
        outcomes[workerId] = { id: v.id, at: v.at }
      }
    }
    return outcomes
  } catch {
    return {}
  }
}

export function saveOutcomes(outcomes: Record<string, EscalationOutcome>): void {
  try {
    if (Object.keys(outcomes).length === 0) window.localStorage.removeItem(OUTCOMES_STORAGE_KEY)
    else window.localStorage.setItem(OUTCOMES_STORAGE_KEY, JSON.stringify(outcomes))
  } catch {
    // Storage blocked: keep working in memory.
  }
}

export const EscalationOutcomesContext = createContext<EscalationOutcomesValue | null>(null)

export function useEscalationOutcomes(): EscalationOutcomesValue {
  const value = useContext(EscalationOutcomesContext)
  if (!value) {
    throw new Error('useEscalationOutcomes must be used inside EscalationOutcomesProvider')
  }
  return value
}
