import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import workerMe from '../../docs/backend/samples/me-worker-W-0301.json'
import supervisorMe from '../../docs/backend/samples/me-supervisor-S-001.json'
import {
  homeFor,
  isValidPin,
  normaliseLoginId,
  restoreSession,
  sessionFromMe,
  SIGN_IN_FAILED,
  SIGN_IN_NO_CONNECTION,
  SIGN_IN_SERVER_ERROR,
  SIGN_IN_TIMEOUT,
  signIn,
} from './auth'
import { setSessionExpiredHandler } from './client'
import { API_BASE } from './config'
import { clearSession, getAccessToken, getRefreshToken, setTokens } from './session'
import type { MeResponse } from './types/responses'

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

const SITE = {
  id: 'site-1',
  name: 'Abuja Demo Site',
  timezone: 'Africa/Lagos',
  emergencyNumber: '112',
}

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url.replace(API_BASE, '')}`)

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: memoryStorage() })
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
  vi.stubGlobal('fetch', fetchMock)
  setSessionExpiredHandler(() => {})
  clearSession()
})

afterEach(() => vi.unstubAllGlobals())

describe('login form checks', () => {
  it('tidies the ID', () => {
    expect(normaliseLoginId('  w-0301 ')).toBe('W-0301')
  })
  it('accepts 4 to 6 digit PINs only', () => {
    expect(isValidPin('1234')).toBe(true)
    expect(isValidPin('123456')).toBe(true)
    expect(isValidPin('123')).toBe(false)
    expect(isValidPin('1234567')).toBe(false)
    expect(isValidPin('12a4')).toBe(false)
  })
})

describe('sessionFromMe', () => {
  it('reads a worker from the captured W-0301 sample, showing the code, not the UUID', () => {
    const session = sessionFromMe(workerMe as MeResponse)
    expect(session.role).toBe('worker')
    expect(session.worker).toMatchObject({ code: 'W-0301', crewName: 'Crew A', language: 'en' })
    expect(session.worker?.id).not.toBe('W-0301')
    expect(session.site).toMatchObject({
      name: 'Abuja Demo Site',
      timezone: 'Africa/Lagos',
      emergencyNumber: '112',
    })
  })
  it('takes a supervisor site from GET /sites, since their /me has none', () => {
    const session = sessionFromMe(supervisorMe as MeResponse, [SITE] as never)
    expect(session).toMatchObject({
      role: 'supervisor',
      loginId: 'S-001',
      worker: null,
      site: SITE,
    })
  })
  it('treats any other role as other', () => {
    const me = { ...supervisorMe, user: { ...supervisorMe.user, role: 'admin' } } as MeResponse
    expect(sessionFromMe(me).role).toBe('other')
  })
  it('sends each role to its home', () => {
    expect(homeFor('worker')).toBe('/worker')
    expect(homeFor('supervisor')).toBe('/supervisor')
    expect(homeFor('other')).toBe('/')
  })
})

describe('signIn', () => {
  it('signs a worker in: login, then /me, with the token in memory and the refresh token saved', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { accessToken: 'a1', refreshToken: 'r1' }))
      .mockResolvedValueOnce(json(200, workerMe))
    const session = await signIn(' w-0301', '1234')
    expect(session.worker?.code).toBe('W-0301')
    expect(calls()).toEqual(['POST /auth/login', 'GET /me'])
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      loginId: 'W-0301',
      pin: '1234',
    })
    expect(getAccessToken()).toBe('a1')
    expect(getRefreshToken()).toBe('r1')
  })

  it('loads a supervisor site from GET /sites', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { accessToken: 'a1', refreshToken: 'r1' }))
      .mockResolvedValueOnce(json(200, supervisorMe))
      .mockResolvedValueOnce(json(200, [SITE]))
    const session = await signIn('S-001', '1234')
    expect(calls()).toEqual(['POST /auth/login', 'GET /me', 'GET /sites'])
    expect(session.site?.id).toBe('site-1')
  })

  it.each([
    ['a wrong PIN (401)', () => json(401, { statusCode: 401, message: 'Invalid credentials' })],
    [
      'a locked account (429)',
      () => json(429, { statusCode: 429, message: 'Too many attempts. Locked for 15 minutes' }),
    ],
    ['a validation error (400)', () => json(400, { statusCode: 400, message: ['pin too short'] })],
  ])('shows exactly "Invalid ID or PIN" for %s', async (_name, response) => {
    fetchMock.mockResolvedValueOnce(response())
    await expect(signIn('W-0301', '9999')).rejects.toMatchObject({ message: SIGN_IN_FAILED })
    expect(getAccessToken()).toBeNull()
  })

  it('says there is no connection when offline', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(signIn('W-0301', '1234')).rejects.toMatchObject({
      message: SIGN_IN_NO_CONNECTION,
      kind: 'network',
    })
  })

  it.each([
    ['500', 500],
    ['502 while waking', 502],
    ['503', 503],
  ])('says something went wrong for a server error (%s)', async (_name, status) => {
    fetchMock.mockResolvedValueOnce(json(status, {}))
    await expect(signIn('W-0301', '1234')).rejects.toMatchObject({ message: SIGN_IN_SERVER_ERROR })
  })

  it('says the server did not respond after the 90 second timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          )
        }),
    )
    const outcome = expect(signIn('W-0301', '1234')).rejects.toMatchObject({
      message: SIGN_IN_TIMEOUT,
      kind: 'timeout',
    })
    await vi.advanceTimersByTimeAsync(90_000)
    await outcome
    vi.useRealTimers()
  })

  it('clears the tokens if /me fails after login', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { accessToken: 'a1', refreshToken: 'r1' }))
      .mockResolvedValueOnce(json(403, { statusCode: 403, message: 'Forbidden' }))
    await expect(signIn('W-0301', '1234')).rejects.toMatchObject({ message: SIGN_IN_FAILED })
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('does not call the server for an empty ID or a malformed PIN', async () => {
    await expect(signIn('', '1234')).rejects.toMatchObject({ message: SIGN_IN_FAILED })
    await expect(signIn('W-0301', '12')).rejects.toMatchObject({ message: SIGN_IN_FAILED })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('restoreSession', () => {
  it('is signed out without a saved refresh token, with no network call', async () => {
    await expect(restoreSession()).resolves.toEqual({ status: 'signed-out' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes and loads /me', async () => {
    setTokens({ accessToken: '', refreshToken: 'r1' })
    fetchMock
      .mockResolvedValueOnce(json(200, { accessToken: 'a2', refreshToken: 'r2' }))
      .mockResolvedValueOnce(json(200, workerMe))
    const result = await restoreSession()
    expect(result.status).toBe('signed-in')
    expect(calls()).toEqual(['POST /auth/refresh', 'GET /me'])
    expect(getRefreshToken()).toBe('r2')
  })

  it('is signed out and forgets the token when the refresh is refused', async () => {
    setTokens({ accessToken: '', refreshToken: 'r1' })
    fetchMock.mockResolvedValueOnce(
      json(401, { statusCode: 401, message: 'Invalid refresh token' }),
    )
    await expect(restoreSession()).resolves.toEqual({ status: 'signed-out' })
    expect(getRefreshToken()).toBeNull()
  })

  it.each([
    ['offline', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['a server error while waking', () => Promise.resolve(json(502, {}))],
  ])('reports unreachable and keeps the refresh token when %s', async (_name, response) => {
    setTokens({ accessToken: '', refreshToken: 'r1' })
    fetchMock.mockImplementationOnce(response)
    const result = await restoreSession()
    expect(result.status).toBe('unreachable')
    expect(getRefreshToken()).toBe('r1')
  })
})
