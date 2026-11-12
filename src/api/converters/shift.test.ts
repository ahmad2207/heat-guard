import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { setSessionExpiredHandler } from '../client'
import { API_BASE } from '../config'
import { sendHeartbeat, sendShiftAction } from '../liveWorker'
import { clearOutbox, pendingItems } from '../outbox'
import { clearSession, setTokens } from '../session'
import { applyShiftAction, shiftTimesFromApi, shiftView, type ShiftTimes } from './shift'

const day: ShiftTimes = {
  startsAt: '2026-11-12T06:00:00Z',
  endsAt: '2026-11-12T16:00:00Z',
  clockedInAt: null,
  onBreakSince: null,
  lastBreakEndedAt: null,
  clockedOutAt: null,
}

describe('shift buttons', () => {
  it('starts with "Start shift" and the shift hours in site time', () => {
    expect(shiftView(day)).toEqual({
      phase: 'not-started',
      status: 'Today 07:00 to 17:00',
      actions: ['clock-in'],
    })
  })
  it('offers "Start break" and "End shift" while working', () => {
    expect(shiftView({ ...day, clockedInAt: '2026-11-12T06:02:00Z' })).toEqual({
      phase: 'working',
      status: 'Shift started at 07:02',
      actions: ['break-start', 'clock-out'],
    })
  })
  it('offers only "End break" during a break, with the time it started', () => {
    expect(
      shiftView({
        ...day,
        clockedInAt: '2026-11-12T06:02:00Z',
        onBreakSince: '2026-11-12T11:10:00Z',
      }),
    ).toEqual({ phase: 'on-break', status: 'On break since 12:10', actions: ['break-end'] })
  })
  it('says when the worker came back from a break', () => {
    expect(
      shiftView({
        ...day,
        clockedInAt: '2026-11-12T06:02:00Z',
        lastBreakEndedAt: '2026-11-12T11:25:00Z',
      }).status,
    ).toBe('Back from break at 12:25')
  })
  it('offers nothing once the shift has ended', () => {
    expect(
      shiftView({
        ...day,
        clockedInAt: '2026-11-12T06:02:00Z',
        clockedOutAt: '2026-11-12T16:01:00Z',
      }),
    ).toEqual({ phase: 'ended', status: 'Shift ended at 17:01', actions: [] })
  })
  it('applies each press on the phone straight away', () => {
    let t = applyShiftAction(day, 'clock-in', '2026-11-12T06:02:00Z')
    expect(shiftView(t).phase).toBe('working')
    t = applyShiftAction(t, 'break-start', '2026-11-12T11:10:00Z')
    expect(shiftView(t).phase).toBe('on-break')
    t = applyShiftAction(t, 'break-end', '2026-11-12T11:25:00Z')
    expect(shiftView(t).status).toBe('Back from break at 12:25')
    t = applyShiftAction(t, 'clock-out', '2026-11-12T16:01:00Z')
    expect(shiftView(t).phase).toBe('ended')
  })
  it('reads an assignment, and nothing without one', () => {
    expect(shiftTimesFromApi({ ...day, clockedInAt: '' })).toEqual(day)
    expect(shiftTimesFromApi(null)).toBeNull()
    expect(shiftTimesFromApi({ id: 'a1' })).toBeNull()
  })
})

describe('shift and heartbeat calls', () => {
  let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
  let online = true
  const calls = () =>
    fetchMock.mock.calls.map(([url, init]) => `${init.method} ${url.replace(API_BASE, '')}`)
  const json = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      },
    })
    online = true
    vi.stubGlobal('navigator', {
      get onLine() {
        return online
      },
    })
    fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)
    setSessionExpiredHandler(() => {})
    clearSession()
    setTokens({ accessToken: 'a1' })
    clearOutbox()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('posts each action to its assignment path', async () => {
    fetchMock.mockResolvedValue(json(201, { ...day }))
    for (const action of ['clock-in', 'break-start', 'break-end', 'clock-out'] as const) {
      await sendShiftAction('a1', action)
    }
    expect(calls()).toEqual([
      'POST /assignments/a1/clock-in',
      'POST /assignments/a1/break/start',
      'POST /assignments/a1/break/end',
      'POST /assignments/a1/clock-out',
    ])
  })
  it('queues presses made offline, in order', async () => {
    online = false
    await sendShiftAction('a1', 'clock-in')
    await sendShiftAction('a1', 'break-start')
    expect(pendingItems().map((i) => i.path)).toEqual([
      '/assignments/a1/clock-in',
      '/assignments/a1/break/start',
    ])
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('reports a 409 as dropped, for the card to reload /me', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { statusCode: 409, message: 'Already clocked in' }))
    await expect(sendShiftAction('a1', 'clock-in')).resolves.toMatchObject({
      status: 'dropped',
      error: { kind: 'conflict' },
    })
    expect(pendingItems()).toEqual([])
  })
  it('sends the battery with the heartbeat when known, and never throws', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))
    await sendHeartbeat({ percent: 64, charging: false })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      batteryPercent: 64,
      charging: false,
    })
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }))
    await sendHeartbeat(null)
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toEqual({})
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(sendHeartbeat(null)).resolves.toBeUndefined()
    expect(pendingItems()).toEqual([])
  })
})
