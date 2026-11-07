import { createContext, useContext } from 'react'
import type { RiskLevel } from '../lib/risk'

/**
 * Prototype controls read by the worker screens. The provider is always present, so production
 * builds get the defaults from mock data. Only development builds show the panel that changes them.
 */
export interface DevSettings {
  /** Worker risk level shown on Home and What to do. */
  riskLevel: RiskLevel
  setRiskLevel: (level: RiskLevel) => void
  /** Show field mode even while online. Field mode also turns on when offline (Phase 4). */
  forceFieldMode: boolean
  setForceFieldMode: (on: boolean) => void
}

export const DevSettingsContext = createContext<DevSettings | null>(null)

export function useDevSettings(): DevSettings {
  const value = useContext(DevSettingsContext)
  if (!value) throw new Error('useDevSettings must be used inside DevSettingsProvider')
  return value
}
