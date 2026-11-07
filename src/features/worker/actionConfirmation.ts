import { createContext, useContext } from 'react'
import type { RiskLevel } from '../../lib/risk'

/**
 * Remembers that the worker pressed "I understand, starting now" on What to do, so the
 * confirmed state survives going back to Home. A confirmation is for one risk level: if the
 * level changes, the worker is asked to confirm again.
 */
export interface ActionConfirmation {
  confirmedLevel: RiskLevel | null
  confirm: (level: RiskLevel) => void
}

export const ActionConfirmationContext = createContext<ActionConfirmation | null>(null)

export function useActionConfirmation(): ActionConfirmation {
  const value = useContext(ActionConfirmationContext)
  if (!value) {
    throw new Error('useActionConfirmation must be used inside ActionConfirmationProvider')
  }
  return value
}
