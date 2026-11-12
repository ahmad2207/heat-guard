import type { Session, SessionRole } from '../../api/auth'

/**
 * The last signed-in person, kept on the device so a worker who goes offline with an expired
 * token keeps field mode. Holds no health data and no tokens. Cleared on sign out.
 */
export const SESSION_CACHE_KEY = 'heatguard.session.v1'

const isString = (value: unknown): value is string => typeof value === 'string'
const isStringOrNull = (value: unknown): value is string | null => value === null || isString(value)
const ROLES: SessionRole[] = ['worker', 'supervisor', 'other']

/** Keeps only a well-formed session, so an old or edited entry cannot break the app. */
export function sanitiseSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (!ROLES.includes(v.role as SessionRole) || !isString(v.loginId)) return null
  const w = v.worker as Record<string, unknown> | null | undefined
  const s = v.site as Record<string, unknown> | null | undefined
  const worker =
    w && isString(w.id) && isString(w.code)
      ? {
          id: w.id,
          code: w.code,
          displayName: isString(w.displayName) ? w.displayName : w.code,
          crewName: isStringOrNull(w.crewName) ? w.crewName : null,
          language: isString(w.language) ? w.language : 'en',
        }
      : null
  const site =
    s && isString(s.id) && isString(s.name) && isString(s.timezone)
      ? {
          id: s.id,
          name: s.name,
          timezone: s.timezone,
          emergencyNumber: isStringOrNull(s.emergencyNumber) ? s.emergencyNumber : null,
        }
      : null
  if (v.role === 'worker' && !worker) return null
  return { role: v.role as SessionRole, loginId: v.loginId, worker, site }
}

export function loadCachedSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY)
    return raw ? sanitiseSession(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveCachedSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session))
  } catch {
    // Storage blocked: the session still works until the page closes.
  }
}

export function clearCachedSession(): void {
  try {
    window.localStorage.removeItem(SESSION_CACHE_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
