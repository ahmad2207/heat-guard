/**
 * Session tokens. The access token lives in memory only; the refresh token is kept in
 * localStorage so a returning worker stays signed in. Tokens are never logged.
 *
 * Note for a security review before any pilot: a refresh token in localStorage can be read by
 * any script on the page.
 */
export const REFRESH_TOKEN_KEY = 'heatguard.refresh.v1'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

/** Saves new tokens. A refresh token is only replaced when the server sends a new one. */
export function setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
  accessToken = tokens.accessToken
  if (!tokens.refreshToken) return
  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  } catch {
    // Storage blocked: the session lasts until the page closes.
  }
}

export function clearSession(): void {
  accessToken = null
  try {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
