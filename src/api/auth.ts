/**
 * Signing in, restoring a saved session and signing out. Uses the API client only; no React.
 * Never logs or stores the PIN, and never keeps tokens anywhere but session.ts.
 */
import { setSiteTimeZone } from '../lib/format'
import { apiRequest, refreshSession, type RequestOptions } from './client'
import { ApiError, isUnreachable } from './errors'
import { clearSession, getRefreshToken, setTokens } from './session'
import type { AuthTokensResponse, MeResponse, ResponseOf } from './types/responses'

export type SessionRole = 'worker' | 'supervisor' | 'other'

/**
 * The signed-in person, as the app needs it. Holds no health data and no tokens, so it can be
 * kept on the device for field mode.
 */
export interface Session {
  role: SessionRole
  loginId: string
  worker: {
    /** UUID, used only in API paths. */
    id: string
    /** Shown on screen, for example W-0301. */
    code: string
    displayName: string
    crewName: string | null
    /** App language code, for example en. */
    language: string
  } | null
  site: {
    id: string
    name: string
    timezone: string
    emergencyNumber: string | null
  } | null
}

export type SignInOptions = Pick<RequestOptions, 'onSlow' | 'signal'>

/**
 * Every refused sign-in (any 4xx, including a lockout) shows exactly SIGN_IN_FAILED: it never
 * says which part was wrong. Only connection problems get their own words.
 */
export const SIGN_IN_FAILED = 'Invalid ID or PIN'
export const SIGN_IN_NO_CONNECTION = 'No connection. Try again when you have signal.'
export const SIGN_IN_TIMEOUT = "The server didn't respond. Try again."
export const SIGN_IN_SERVER_ERROR = 'Something went wrong. Try again.'

/** The message for a failed sign-in. */
export function signInMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return SIGN_IN_SERVER_ERROR
  if (error.kind === 'network') return SIGN_IN_NO_CONNECTION
  if (error.kind === 'timeout') return SIGN_IN_TIMEOUT
  if (error.status >= 500) return SIGN_IN_SERVER_ERROR
  return SIGN_IN_FAILED
}

/** The worker or staff ID as typed, tidied: trimmed and upper case (w-0301 becomes W-0301). */
export function normaliseLoginId(value: string): string {
  return value.trim().toUpperCase()
}

/** A PIN is 4 to 6 digits. */
export function isValidPin(value: string): boolean {
  return /^\d{4,6}$/.test(value)
}

function roleFrom(value: unknown): SessionRole {
  return value === 'worker' || value === 'supervisor' ? value : 'other'
}

type Sites = ResponseOf<'/api/v1/sites', 'get'>

/** Builds the session from GET /me, plus the site from GET /sites for supervisors. */
export function sessionFromMe(me: MeResponse, sites?: Sites): Session {
  const role = roleFrom(me.user?.role)
  const worker = role === 'worker' && me.worker ? me.worker : null
  const ownSite = me.site ?? null
  const site = ownSite ?? (role === 'supervisor' ? (sites?.[0] ?? null) : null)
  return {
    role,
    loginId: me.user?.loginId ?? '',
    worker: worker && {
      id: worker.id,
      code: worker.employeeCode,
      displayName: worker.displayName,
      crewName: worker.crew?.name ?? null,
      language: worker.language,
    },
    site: site && {
      id: site.id,
      name: site.name,
      timezone: site.timezone,
      emergencyNumber: site.emergencyNumber ?? null,
    },
  }
}

/** GET /me, then GET /sites for a supervisor (their /me has no site). Sets the site timezone. */
async function loadSession(options: SignInOptions): Promise<Session> {
  const me = await apiRequest<MeResponse>('/me', options)
  const sites =
    roleFrom(me.user?.role) === 'supervisor' && !me.site
      ? await apiRequest<Sites>('/sites', options)
      : undefined
  const session = sessionFromMe(me, sites)
  setSiteTimeZone(session.site?.timezone)
  return session
}

/**
 * POST /auth/login, then loads the person. Any failure clears the tokens and throws an ApiError
 * whose message comes from signInMessage. A cancelled request is passed through.
 */
export async function signIn(
  loginId: string,
  pin: string,
  options: SignInOptions = {},
): Promise<Session> {
  const id = normaliseLoginId(loginId)
  if (!id || !isValidPin(pin)) throw new ApiError('validation', 0, SIGN_IN_FAILED)
  try {
    const tokens = await apiRequest<AuthTokensResponse>('/auth/login', {
      ...options,
      method: 'POST',
      body: { loginId: id, pin },
      auth: false,
    })
    if (!tokens || typeof tokens.accessToken !== 'string') {
      throw new ApiError('server', 0, SIGN_IN_SERVER_ERROR)
    }
    setTokens(tokens)
    return await loadSession(options)
  } catch (error) {
    clearSession()
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    const kind = error instanceof ApiError ? error.kind : 'unknown'
    throw new ApiError(kind, error instanceof ApiError ? error.status : 0, signInMessage(error))
  }
}

export type RestoreResult =
  /** No saved session: show /login. */
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session }
  /** The server could not be reached (offline or asleep). Keep any cached session. */
  | { status: 'unreachable'; error: ApiError }

/**
 * On app start: if a refresh token is saved, refresh it and load the person. A refused refresh
 * clears it. Being offline or timing out is reported as unreachable, never as signed out, so a
 * signed-in worker keeps field mode.
 */
export async function restoreSession(options: SignInOptions = {}): Promise<RestoreResult> {
  if (!getRefreshToken()) return { status: 'signed-out' }
  try {
    if (!(await refreshSession(options))) {
      clearSession()
      return { status: 'signed-out' }
    }
    return { status: 'signed-in', session: await loadSession(options) }
  } catch (error) {
    // Offline, timed out, or the server failing while it wakes: keep the session.
    if (error instanceof ApiError && isUnreachable(error)) {
      return { status: 'unreachable', error }
    }
    if (error instanceof ApiError && error.kind === 'unauthorised') return { status: 'signed-out' }
    throw error
  }
}

/** Where a person lands after signing in. Other roles stay on / with an explanation. */
export function homeFor(role: SessionRole): string {
  if (role === 'worker') return '/worker'
  if (role === 'supervisor') return '/supervisor'
  return '/'
}

/** Forgets the tokens. Callers also clear cached personal data. */
export function signOutTokens(): void {
  clearSession()
}
