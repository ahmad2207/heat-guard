import { API_BASE } from './config'
import { ApiError, FALLBACK_MESSAGES, toApiError } from './errors'
import { clearSession, getAccessToken, getRefreshToken, setTokens } from './session'

/**
 * The only module that calls fetch. Every backend call goes through apiRequest.
 * Never log tokens, PINs or health data from here.
 */

/** Render's free tier can take close to a minute to wake, so requests wait up to 90 seconds. */
export const REQUEST_TIMEOUT_MS = 90_000
/** After this long, screens show "Waking up the server...". */
export const SLOW_AFTER_MS = 3_000

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  /** Sent as JSON. */
  body?: unknown
  /** Cancels the request, for example when a screen closes. Rejects with an AbortError. */
  signal?: AbortSignal
  /** Called once if the request is still waiting after SLOW_AFTER_MS. */
  onSlow?: () => void
  /** Send the access token. True by default; false for login, refresh and the wake-up ping. */
  auth?: boolean
  timeoutMs?: number
}

/** Where to go when the session cannot be renewed. The router can replace this. */
let onSessionExpired: () => void = () => {
  if (window.location.pathname !== '/login') window.location.assign('/login')
}

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

/** One fetch with the timeout, the slow signal and the headers. Throws ApiError for no response. */
async function send(
  path: string,
  options: RequestOptions,
  token: string | null,
): Promise<Response> {
  const { method = 'GET', body, signal, onSlow, timeoutMs = REQUEST_TIMEOUT_MS } = options
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const slow = onSlow ? setTimeout(onSlow, SLOW_AFTER_MS) : undefined
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) throw new ApiError('timeout', 0, FALLBACK_MESSAGES.timeout)
    if (signal?.aborted) throw error
    throw new ApiError('network', 0, FALLBACK_MESSAGES.network)
  } finally {
    clearTimeout(timeout)
    if (slow) clearTimeout(slow)
    signal?.removeEventListener('abort', cancel)
  }
}

/** Reads a JSON body, or undefined for an empty or non-JSON body. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * POST /auth/refresh returns both tokens (AuthTokensResponse); the new refresh token replaces
 * the saved one. Read defensively so a bad body ends the session instead of crashing.
 */
function readTokens(body: unknown): { accessToken: string; refreshToken?: string } | null {
  if (!body || typeof body !== 'object') return null
  const { accessToken, refreshToken } = body as Record<string, unknown>
  if (typeof accessToken !== 'string' || !accessToken) return null
  return { accessToken, refreshToken: typeof refreshToken === 'string' ? refreshToken : undefined }
}

/** Shared so several calls that hit 401 at once only refresh once. */
let refreshing: Promise<boolean> | null = null

/**
 * Tries POST /auth/refresh once. Resolves false when the server refuses it. A network failure or
 * timeout throws instead, so the session is kept: field mode must keep working offline with an
 * expired token. Also used on app start to restore a saved session.
 */
export function refreshSession(options: Pick<RequestOptions, 'onSlow'> = {}): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    const response = await send(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken }, auth: false, onSlow: options.onSlow },
      null,
    )
    // A server error (for example 502 while Render wakes up) is not a refusal: keep the session.
    if (response.status >= 500) throw toApiError(response.status, await readBody(response))
    if (!response.ok) return false
    const tokens = readTokens(await readBody(response))
    if (!tokens) return false
    setTokens(tokens)
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

function endSession(): never {
  clearSession()
  onSessionExpired()
  throw new ApiError('unauthorised', 401, FALLBACK_MESSAGES.unauthorised)
}

/**
 * Calls VITE_API_URL + /api/v1 + path and returns the parsed JSON body.
 * On 401 it refreshes the session once and retries; if that fails it clears the session and
 * goes to /login. Other errors throw an ApiError with a readable message.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true
  let response = await send(path, options, auth ? getAccessToken() : null)

  if (response.status === 401 && auth) {
    if (!(await refreshSession())) endSession()
    response = await send(path, options, getAccessToken())
    if (response.status === 401) endSession()
  }

  const body = await readBody(response)
  if (!response.ok) throw toApiError(response.status, body)
  return body as T
}

/**
 * Wakes the server with GET /api/v1/health. Resolves true when it answers, false otherwise.
 * Never throws, so it can run in the background on app start.
 */
export async function wakeServer(
  options: Pick<RequestOptions, 'onSlow' | 'signal'> = {},
): Promise<boolean> {
  try {
    await apiRequest<unknown>('/health', { ...options, auth: false })
    return true
  } catch {
    return false
  }
}
