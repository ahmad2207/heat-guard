import { createContext, useContext } from 'react'
import { PRECAUTION_DEFAULTS } from '../../data/mock'
import type { PrecautionLevelId, PrecautionRecord } from '../../data/types'

/**
 * Each worker's precaution level, shared by the three roles. Occupational health sets it; the
 * worker app and supervisor Today read it. Saved to localStorage for demos.
 */
export interface PrecautionLevelsValue {
  records: Record<string, PrecautionRecord>
  /** The record for one worker, falling back to the sample default. */
  recordFor: (workerId: string) => PrecautionRecord
  saveLevel: (workerId: string, level: PrecautionLevelId) => void
  reset: () => void
}

export const PRECAUTION_STORAGE_KEY = 'heatguard.precautions.v1'
const LEVELS: PrecautionLevelId[] = ['standard', 'enhanced', 'high']

/** Reads saved levels over the sample defaults. Ignores anything malformed or unreadable. */
export function loadPrecautionRecords(): Record<string, PrecautionRecord> {
  const records = { ...PRECAUTION_DEFAULTS }
  try {
    const raw = window.localStorage.getItem(PRECAUTION_STORAGE_KEY)
    const saved: unknown = raw ? JSON.parse(raw) : null
    if (saved && typeof saved === 'object') {
      for (const [workerId, value] of Object.entries(saved as Record<string, unknown>)) {
        const v = value as Partial<PrecautionRecord> | null
        if (v && LEVELS.includes(v.level as PrecautionLevelId) && typeof v.setOn === 'string') {
          records[workerId] = {
            level: v.level as PrecautionLevelId,
            setOn: v.setOn,
            nextReview: typeof v.nextReview === 'string' ? v.nextReview : undefined,
          }
        }
      }
    }
  } catch {
    // Storage blocked or bad data: use the defaults.
  }
  return records
}

/** Only the levels changed from the defaults are saved. */
export function savePrecautionChanges(changes: Record<string, PrecautionRecord>): void {
  try {
    if (Object.keys(changes).length === 0) {
      window.localStorage.removeItem(PRECAUTION_STORAGE_KEY)
    } else {
      window.localStorage.setItem(PRECAUTION_STORAGE_KEY, JSON.stringify(changes))
    }
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export const PrecautionLevelsContext = createContext<PrecautionLevelsValue | null>(null)

export function usePrecautionLevels(): PrecautionLevelsValue {
  const value = useContext(PrecautionLevelsContext)
  if (!value) throw new Error('usePrecautionLevels must be used inside PrecautionLevelsProvider')
  return value
}
