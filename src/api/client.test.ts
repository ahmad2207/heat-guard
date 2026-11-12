import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  apiRequest,
  REQUEST_TIMEOUT_MS,
  setSessionExpiredHandler,
  SLOW_AFTER_MS,
  wakeServer,
} from './client'
import { API_BASE, normaliseApiUrl, resolveDataSource } from './config'
import { ApiError, readMessages, toApiError } from './errors'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  REFRESH_TOKEN_KEY,
  setTokens,
} from './session'

/** A small in-memory localStorage, since tests run in Node. */
function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
let expired: Mock<() => void>

/** Headers and body of the nth fetch call. */
const headersOf = (call: number) => fetchMock.mock.calls[call][1].headers as Record<string, string>
const bodyOf = (call: number) => JSON.parse(String(fetchMock.mock.calls[call][1].body))

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: memoryStorage() })
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
  vi.stubGlobal('fetch', fetchMock)
  expired = vi.fn<() => void>()
  setSessionExpiredHandler(expired)
  clearSession()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('error parsing', () => {
  it('reads a string message', () => {
    const error = toApiError(409, {
      statusCode: 409,
      message: 'Already clocked in',
      error: 'Conflict',
    })
    expect(error).toBeInstanceOf(ApiError)
    expect(error.kind).toBe('conflict')
    expect(error.message).toBe('Already clocked in.')
  })
  it('shows only the first of an array of messages', () => {
    const error = toApiError(400, {
      statusCode: 400,
      message: ['pin must be a string', 'loginId should not be empty'],
      error: 'Bad Request',
    })
    expect(error.kind).toBe('validation')
    expect(error.details).toEqual(['pin must be a string', 'loginId should not be empty'])
    expect(error.message).toBe('pin must be a string.')
  })
  it('works without the error field (as seen on a live 401)', () => {
    const error = toApiError(401, { statusCode: 401, message: 'Invalid ID or PIN' })
    expect(error.kind).toBe('unauthorised')
    expect(error.message).toBe('Invalid ID or PIN.')
  })
  it('uses plain wording for 503 (feature switched off) and 5xx', () => {
    expect(toApiError(503, { statusCode: 503, message: 'WEARABLES_DISABLED' }).message).toBe(
      'This feature is switched off at the moment.',
    )
    expect(toApiError(503, {}).kind).toBe('feature-off')
    expect(toApiError(500, { message: 'TypeError: x is undefined' }).message).toBe(
      'Something went wrong on the server. Try again.',
    )
  })
  it('falls back to readable wording for empty or odd bodies', () => {
    expect(toApiError(404, undefined).message).toBe('We could not find this.')
    expect(readMessages({ message: [1, '', '  ok '] })).toEqual(['ok'])
    expect(readMessages('text')).toEqual([])
  })
})

describe('apiRequest', () => {
  it('calls the API base with JSON and the access token', async () => {
    setTokens({ accessToken: 'access-1' })
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))
    const result = await apiRequest<{ ok: boolean }>('/me/heartbeat', {
      method: 'POST',
      body: { batteryPercent: 50 },
    })
    expect(result).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_BASE}/me/heartbeat`)
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"batteryPercent":50}')
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-1',
    })
  })

  it('returns undefined for an empty body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))
    await expect(apiRequest('/me/first-aid-alert', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('throws a typed conflict error on 409', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { statusCode: 409, message: 'Already clocked in' }))
    await expect(apiRequest('/assignments/a1/clock-in', { method: 'POST' })).rejects.toMatchObject({
      kind: 'conflict',
      status: 409,
      message: 'Already clocked in.',
    })
  })

  it('throws a network error when there is no response', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(apiRequest('/me')).rejects.toMatchObject({ kind: 'network', status: 0 })
  })
})

describe('401 refresh flow', () => {
  it('refreshes once, saves the new tokens and retries the call', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Unauthorized' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'new', refreshToken: 'refresh-2' }))
      .mockResolvedValueOnce(json(200, { id: 'u1' }))

    await expect(apiRequest('/me')).resolves.toEqual({ id: 'u1' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    const [refreshUrl] = fetchMock.mock.calls[1]
    expect(refreshUrl).toBe(`${API_BASE}/auth/refresh`)
    expect(bodyOf(1)).toEqual({ refreshToken: 'refresh-1' })
    expect(headersOf(1).Authorization).toBeUndefined()
    expect(headersOf(2).Authorization).toBe('Bearer new')
    expect(getAccessToken()).toBe('new')
    expect(getRefreshToken()).toBe('refresh-2')
    expect(expired).not.toHaveBeenCalled()
  })

  it('clears the session and goes to login when the refresh is refused', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    fetchMock
      .mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Unauthorized' }))
      .mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Invalid refresh token' }))

    await expect(apiRequest('/me')).rejects.toMatchObject({ kind: 'unauthorised' })
    expect(getAccessToken()).toBeNull()
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('goes to login when the retried call is still 401', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { accessToken: 'new' }))
      .mockResolvedValueOnce(json(401, {}))

    await expect(apiRequest('/me')).rejects.toMatchObject({ kind: 'unauthorised' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('goes to login without a refresh call when there is no refresh token', async () => {
    fetchMock.mockResolvedValueOnce(json(401, {}))
    await expect(apiRequest('/me')).rejects.toMatchObject({ kind: 'unauthorised' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('keeps the session when the refresh fails because the phone is offline', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(apiRequest('/me')).rejects.toMatchObject({ kind: 'network' })
    expect(getRefreshToken()).toBe('refresh-1')
    expect(expired).not.toHaveBeenCalled()
  })

  it('does not refresh for calls made without the token (login)', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Invalid ID or PIN' }))
    await expect(
      apiRequest('/auth/login', {
        method: 'POST',
        body: { loginId: 'W-0301', pin: 'x' },
        auth: false,
      }),
    ).rejects.toMatchObject({ kind: 'unauthorised', message: 'Invalid ID or PIN.' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(expired).not.toHaveBeenCalled()
  })

  it('shares one refresh between calls that fail together', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'new' })
      const auth = (init.headers as Record<string, string>).Authorization
      return auth === 'Bearer new' ? json(200, { url }) : json(401, {})
    })
    await Promise.all([apiRequest('/me'), apiRequest('/me/risk')])
    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/auth/refresh'),
    )
    expect(refreshCalls).toHaveLength(1)
  })
})

describe('timeout and slow signal', () => {
  /** A fetch that never answers, but rejects when aborted, like the real one. */
  const hangingFetch = (_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () =>
        reject(new DOMException('The operation was aborted.', 'AbortError')),
      )
    })

  it('signals slow after 3 seconds and times out after 90 seconds', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(hangingFetch)
    const onSlow = vi.fn()
    const request = apiRequest('/me', { onSlow })
    const outcome = expect(request).rejects.toMatchObject({ kind: 'timeout', status: 0 })

    await vi.advanceTimersByTimeAsync(SLOW_AFTER_MS - 1)
    expect(onSlow).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onSlow).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - SLOW_AFTER_MS)
    await outcome
    expect(onSlow).toHaveBeenCalledTimes(1)
  })

  it('does not signal slow for a quick answer', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValueOnce(json(200, {}))
    const onSlow = vi.fn()
    await apiRequest('/me', { onSlow })
    await vi.advanceTimersByTimeAsync(SLOW_AFTER_MS * 2)
    expect(onSlow).not.toHaveBeenCalled()
  })

  it('passes a caller abort through as an AbortError, not an ApiError', async () => {
    fetchMock.mockImplementation(hangingFetch)
    const controller = new AbortController()
    const request = apiRequest('/me', { signal: controller.signal })
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('wakeServer', () => {
  it('pings /health without a token and never throws', async () => {
    setTokens({ accessToken: 'access-1' })
    fetchMock.mockResolvedValueOnce(json(200, { status: 'ok' }))
    await expect(wakeServer()).resolves.toBe(true)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_BASE}/health`)
    expect(headersOf(0).Authorization).toBeUndefined()

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(wakeServer()).resolves.toBe(false)
  })
})

describe('config', () => {
  it('normalises the API host', () => {
    expect(normaliseApiUrl(' https://health-heat.onrender.com/ ')).toBe(
      'https://health-heat.onrender.com',
    )
    expect(normaliseApiUrl(undefined)).toBe('')
  })
  it('defaults to mock when there is no API URL, and api when there is one', () => {
    expect(resolveDataSource(undefined, '')).toBe('mock')
    expect(resolveDataSource('', 'https://x')).toBe('api')
  })
  it('respects an explicit data source', () => {
    expect(resolveDataSource('mock', 'https://x')).toBe('mock')
    expect(resolveDataSource('API', '')).toBe('api')
    expect(resolveDataSource('other', '')).toBe('mock')
  })
})
