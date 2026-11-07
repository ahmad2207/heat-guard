import { useMemo, useState, type ReactNode } from 'react'
import { CURRENT_RISK_LEVEL } from '../data/mock'
import type { RiskLevel } from '../lib/risk'
import { DevSettingsContext } from './devSettings'

export function DevSettingsProvider({ children }: { children: ReactNode }) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(CURRENT_RISK_LEVEL)
  const [forceFieldMode, setForceFieldMode] = useState(false)

  const value = useMemo(
    () => ({ riskLevel, setRiskLevel, forceFieldMode, setForceFieldMode }),
    [riskLevel, forceFieldMode],
  )

  return <DevSettingsContext.Provider value={value}>{children}</DevSettingsContext.Provider>
}
