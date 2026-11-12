import type { RiskLevel } from '../../lib/risk'

/** The backend sends risk levels as numbers 1 to 4. */
export function riskLevelToCode(level: RiskLevel): number {
  return level
}

/**
 * A risk level from the backend, or null when it is missing or out of range. Screens must not
 * guess a level: field mode shows "Assume High" when there is none.
 */
export function riskLevelFromCode(code: unknown): RiskLevel | null {
  const value = typeof code === 'string' && code.trim() !== '' ? Number(code) : code
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : null
}
