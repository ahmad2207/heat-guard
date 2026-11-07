import { useMemo, useState, type ReactNode } from 'react'
import type { RiskLevel } from '../../lib/risk'
import { ActionConfirmationContext } from './actionConfirmation'

export function ActionConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmedLevel, setConfirmedLevel] = useState<RiskLevel | null>(null)
  const value = useMemo(() => ({ confirmedLevel, confirm: setConfirmedLevel }), [confirmedLevel])
  return (
    <ActionConfirmationContext.Provider value={value}>
      {children}
    </ActionConfirmationContext.Provider>
  )
}
