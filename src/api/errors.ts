/**
 * Backend errors arrive as { statusCode, message, error? }. message can be a string or an array
 * of validation messages, and error is sometimes missing (seen on a live 401).
 */
export type ApiErrorKind =
  /** No response: offline, DNS or CORS failure. */
  | 'network'
  /** No response within the time limit. */
  | 'timeout'
  /** 401 and the refresh failed: the person has to sign in again. */
  | 'unauthorised'
  | 'forbidden'
  | 'not-found'
  /** 409: the action does not fit the current state, for example "Already clocked in". */
  | 'conflict'
  | 'validation'
  /** 503: the feature is switched off on the server. */
  | 'feature-off'
  | 'server'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** HTTP status, or 0 when there was no response. */
  readonly status: number
  /** Every message from the server, for validation errors with more than one. */
  readonly details: string[]

  constructor(kind: ApiErrorKind, status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.details = details
  }
}

/** Words shown when the server sends nothing readable. Never includes codes. */
export const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Could not reach the server. Check your connection and try again.',
  timeout: 'The server took too long to answer. Try again.',
  unauthorised: 'Your session has ended. Please sign in again.',
  forbidden: 'You do not have access to this.',
  'not-found': 'We could not find this.',
  conflict: 'This has already been done.',
  validation: 'Some details are not right. Check them and try again.',
  'feature-off': 'This feature is switched off at the moment.',
  server: 'Something went wrong on the server. Try again.',
  unknown: 'Something went wrong. Try again.',
}

export function kindForStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorised'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 503) return 'feature-off'
  if (status >= 500) return 'server'
  return 'unknown'
}

/** Pulls the messages out of an error body, whatever form message takes. */
export function readMessages(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const message = (body as { message?: unknown }).message
  if (typeof message === 'string') return message.trim() ? [message.trim()] : []
  if (Array.isArray(message)) {
    return message
      .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
      .map((m) => m.trim())
  }
  return []
}

/** Builds an ApiError from a status and a parsed (or unparsable) body. */
export function toApiError(status: number, body: unknown): ApiError {
  const kind = kindForStatus(status)
  const messages = readMessages(body)
  // 5xx messages are server internals, not for people. A 503 keeps the plain wording.
  const useFallback = kind === 'server' || kind === 'feature-off' || messages.length === 0
  const message = useFallback
    ? FALLBACK_MESSAGES[kind]
    : messages.map((m) => (/[.!?]$/.test(m) ? m : `${m}.`)).join(' ')
  return new ApiError(kind, status, message, messages)
}
