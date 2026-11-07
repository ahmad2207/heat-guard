import { useMemo, useState, type ReactNode } from 'react'
import {
  EscalationOutcomesContext,
  loadOutcomes,
  saveOutcomes,
  type EscalationOutcomesValue,
} from './escalationOutcomes'

export function EscalationOutcomesProvider({ children }: { children: ReactNode }) {
  const [outcomes, setOutcomes] = useState(loadOutcomes)

  const value = useMemo<EscalationOutcomesValue>(
    () => ({
      outcomes,
      setOutcome: (workerId, outcome) => {
        const next = { ...outcomes, [workerId]: outcome }
        saveOutcomes(next)
        setOutcomes(next)
      },
      reset: () => {
        saveOutcomes({})
        setOutcomes({})
      },
    }),
    [outcomes],
  )

  return (
    <EscalationOutcomesContext.Provider value={value}>
      {children}
    </EscalationOutcomesContext.Provider>
  )
}
