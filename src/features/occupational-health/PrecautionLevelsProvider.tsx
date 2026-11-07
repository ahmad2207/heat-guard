import { useMemo, useState, type ReactNode } from 'react'
import { PRECAUTION_DEFAULTS } from '../../data/mock'
import type { PrecautionRecord } from '../../data/types'
import {
  loadPrecautionRecords,
  PrecautionLevelsContext,
  savePrecautionChanges,
  type PrecautionLevelsValue,
} from './precautionLevels'

/** Today's date as "7 Nov", the format the design uses for "Set by occupational health". */
function today(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function PrecautionLevelsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState(loadPrecautionRecords)

  const value = useMemo<PrecautionLevelsValue>(() => {
    const persist = (next: Record<string, PrecautionRecord>) => {
      const changes = Object.fromEntries(
        Object.entries(next).filter(([id, record]) => record !== PRECAUTION_DEFAULTS[id]),
      )
      savePrecautionChanges(changes)
      setRecords(next)
    }
    return {
      records,
      recordFor: (workerId) =>
        records[workerId] ?? PRECAUTION_DEFAULTS[workerId] ?? { level: 'standard', setOn: today() },
      saveLevel: (workerId, level) =>
        persist({ ...records, [workerId]: { level, setOn: today() } }),
      reset: () => {
        savePrecautionChanges({})
        setRecords({ ...PRECAUTION_DEFAULTS })
      },
    }
  }, [records])

  return (
    <PrecautionLevelsContext.Provider value={value}>{children}</PrecautionLevelsContext.Provider>
  )
}
