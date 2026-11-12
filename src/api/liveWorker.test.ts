import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import spec from '../../docs/backend/openapi.json'
import { setSessionExpiredHandler } from './client'
import { API_BASE } from './config'
import {
  dataSourceChips,
  forecastHours,
  hazardRows,
  nextBreakText,
  riskViewFromApi,
  savedRiskFromApi,
  whenText,
} from './converters/myRisk'
import {
  acknowledgeRecommendation,
  addCup,
  loadMyRisk,
  loadSavedRisk,
  SAVED_RISK_KEY,
  sendFirstAidAlert,
  sendSymptomReport,
} from './liveWorker'
import { clearOutbox, enqueue, flushOutbox, OUTBOX_KEY, pendingItems, submit } from './outbox'
import { clearSession, setTokens } from './session'

/** The documented GET /me/risk example (read only). */
const riskExample = (
  spec.paths['/api/v1/me/risk'].get.responses['200'].content['application/json'] as unknown as {
    example: Record<string, unknown>
  }
).example

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
let storage: Map<string, string>
let online = true
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url.replace(API_BASE, '')}`)
const bodyOf = (call: number) => {
  const body = fetchMock.mock.calls[call][1].body
  return body === undefined ? undefined : JSON.parse(String(body))
}

beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
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

describe('GET /me/risk as the app shows it', () => {
  it('reads the documented example', () => {
    const view = riskViewFromApi(riskExample)!
    expect(view.level).toBe(riskExample.level)
    expect(view.instruction).toBe((riskExample.action as { what: string }).what)
    expect(view.when).toBe('Now')
    expect(view.updatedAt).toMatch(/^\d{2}:\d{2}$/)
    expect(view.reasons.length).toBeGreaterThan(0)
    expect(view.reasons.join(' ')).not.toMatch(/workload|precaution|heat:/)
    expect(view.forecast.hours.length).toBeLessThanOrEqual(6)
    expect(view.dataSources[0]).toEqual({ label: 'Weather', ok: true })
    expect(view.recommendationId).toBeTruthy()
  })
  it('returns null without a usable level', () => {
    expect(riskViewFromApi({ level: 7 })).toBeNull()
    expect(riskViewFromApi(null)).toBeNull()
  })
  it('shows "No fresh heat data" only when degraded, and a fallback normally', () => {
    expect(riskViewFromApi({ ...riskExample, dataQuality: 'degraded' })?.degraded).toBe(true)
    expect(riskViewFromApi({ ...riskExample, source: 'fallback' })).toMatchObject({
      degraded: false,
    })
  })
  it('turns action.when into words, never a code', () => {
    expect(whenText('immediately')).toBe('Now')
    expect(whenText('before_peak')).toBe('Before peak')
    expect(whenText(undefined)).toBe('')
  })
})

describe('next break', () => {
  it('says when and where', () => {
    expect(nextBreakText({ onBreakNow: false, minutesUntil: 12, durationMinutes: 15 })).toEqual({
      title: 'Next break in 12 min',
      detail: '15 min in the shaded rest area',
    })
    expect(
      nextBreakText({ onBreakNow: false, minutesUntil: 164, durationMinutes: 15 })?.title,
    ).toBe('Next break in 2 h 44 min')
  })
  it('says when a break is happening now', () => {
    expect(
      nextBreakText({
        onBreakNow: true,
        since: '2026-11-12T11:10:00Z',
        minutesUntil: 0,
        durationMinutes: 15,
      }),
    ).toEqual({ title: 'On break now', detail: 'Since 12:10. 15 min in the shaded rest area' })
  })
  it('shows nothing without a break', () => {
    expect(nextBreakText(null)).toBeNull()
  })
})

describe('forecast, hazards and sources', () => {
  it('shows a possible higher level only when present, and at most 6 hours', () => {
    const hours = Array.from({ length: 8 }, (_, i) => ({
      at: `2026-11-12T${String(11 + i).padStart(2, '0')}:00:00Z`,
      level: 3,
      possibleLevel: i === 1 ? 4 : null,
    }))
    const shown = forecastHours(hours)
    expect(shown).toHaveLength(6)
    expect(shown[0]).toEqual({ time: '12:00', level: 3 })
    expect(shown[1]).toEqual({ time: '13:00', level: 4, possible: true })
  })
  it('maps dust and thunderstorm to rows with pills, and drops unknown hazards', () => {
    const rows = hazardRows([
      {
        type: 'dust',
        severity: 'moderate',
        from: '2026-11-12T11:00:00Z',
        to: '2026-11-12T15:00:00Z',
      },
      { type: 'dust', severity: 'high' },
      {
        type: 'thunderstorm',
        severity: 'possible',
        from: '2026-11-12T15:00:00Z',
        to: '2026-11-12T17:00:00Z',
      },
      { type: 'flood', severity: 'high' },
    ])
    expect(rows.map((r) => [r.icon, r.title, r.pill.label])).toEqual([
      ['dust', 'Dusty air 12:00 to 16:00', 'Moderate'],
      ['dust', 'Dusty air', 'High'],
      ['storm', 'Storms possible 16:00 to 18:00', 'Possible'],
    ])
  })
  it('lists weather always, and site sensor and band only when present', () => {
    expect(dataSourceChips({ weather: { ok: false }, siteSensor: null, wearable: null })).toEqual([
      { label: 'Weather', ok: false },
    ])
    expect(
      dataSourceChips({ weather: { ok: true }, siteSensor: { ok: true }, wearable: { ok: false } }),
    ).toHaveLength(3)
  })
})

describe('saved risk for field mode', () => {
  it('keeps level, time and forecast only, never the reasons', () => {
    const saved = savedRiskFromApi(riskExample)!
    expect(Object.keys(saved).sort()).toEqual(['assessedAt', 'hours', 'level'])
    expect(JSON.stringify(saved)).not.toMatch(/effect|factor|reasons|action/)
  })
  it('is saved when the risk loads and read back after', async () => {
    fetchMock.mockResolvedValueOnce(json(200, riskExample))
    await loadMyRisk()
    expect(storage.get(SAVED_RISK_KEY)).not.toMatch(/effect/)
    expect(loadSavedRisk()).toMatchObject({ level: riskExample.level })
  })
})

describe('outbox', () => {
  it('sends straight away when online', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { cupsToday: 5 }))
    await expect(addCup()).resolves.toEqual({ status: 'sent', response: { cupsToday: 5 } })
    expect(calls()).toEqual(['POST /me/water'])
    expect(pendingItems()).toEqual([])
  })
  it('queues when the phone is offline, without trying', async () => {
    online = false
    await expect(sendFirstAidAlert()).resolves.toEqual({ status: 'queued' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(JSON.parse(storage.get(OUTBOX_KEY)!)).toHaveLength(1)
  })
  it('queues when the server cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(sendFirstAidAlert()).resolves.toEqual({ status: 'queued' })
    expect(pendingItems()).toHaveLength(1)
  })
  it('sends queued items in order once back online', async () => {
    online = false
    await addCup()
    await acknowledgeRecommendation('rec-1')
    await sendFirstAidAlert()
    online = true
    fetchMock.mockResolvedValue(json(201, {}))
    await flushOutbox()
    expect(calls()).toEqual([
      'POST /me/water',
      'POST /recommendations/rec-1/interventions',
      'POST /me/first-aid-alert',
    ])
    expect(bodyOf(1)).toEqual({ status: 'acknowledged' })
    expect(pendingItems()).toEqual([])
  })
  it('drops an item quietly on 409 and carries on', async () => {
    enqueue({ kind: 'acknowledge', path: '/recommendations/rec-1/interventions', body: {} })
    enqueue({ kind: 'water', path: '/me/water', body: { cups: 1 } })
    fetchMock
      .mockResolvedValueOnce(json(409, { statusCode: 409, message: 'Already acknowledged' }))
      .mockResolvedValueOnce(json(201, { cupsToday: 3 }))
    const outcomes = await flushOutbox()
    expect([...outcomes.values()].map((o) => o.status)).toEqual(['dropped', 'sent'])
    expect(pendingItems()).toEqual([])
  })
  it('stops at the first connection failure and keeps the rest in order', async () => {
    enqueue({ kind: 'water', path: '/me/water', body: { cups: 1 } })
    enqueue({ kind: 'first-aid-alert', path: '/me/first-aid-alert' })
    fetchMock.mockResolvedValueOnce(json(201, {})).mockResolvedValueOnce(json(503, {}))
    await flushOutbox()
    expect(pendingItems().map((i) => i.kind)).toEqual(['first-aid-alert'])
  })
  it('sends a new action after anything already waiting', async () => {
    enqueue({ kind: 'first-aid-alert', path: '/me/first-aid-alert' })
    fetchMock.mockResolvedValue(json(201, {}))
    await submit({ kind: 'water', path: '/me/water', body: { cups: 1 } })
    expect(calls()).toEqual(['POST /me/first-aid-alert', 'POST /me/water'])
  })
  it('keeps a bad stored queue from breaking the app', () => {
    storage.set(OUTBOX_KEY, '{not json')
    expect(pendingItems()).toEqual([])
    storage.set(OUTBOX_KEY, JSON.stringify([{ id: 'x', kind: 'delete-everything', path: '/x' }]))
    expect(pendingItems()).toEqual([])
  })
})

describe('symptom reports (decision D5)', () => {
  it('sends the symptoms and note when the worker shares details', async () => {
    fetchMock.mockResolvedValueOnce(json(201, {}))
    await sendSymptomReport(
      { symptoms: ['headache', 'dizzy'], note: ' Started after lunch ' },
      true,
    )
    expect(bodyOf(0)).toEqual({ symptoms: ['headache', 'dizzy'], note: 'Started after lunch' })
  })
  it('still sends the alert, with no details, when sharing is off', async () => {
    fetchMock.mockResolvedValueOnce(json(201, {}))
    await sendSymptomReport({ symptoms: ['headache'], note: 'private' }, false)
    expect(calls()).toEqual(['POST /me/symptom-reports'])
    expect(bodyOf(0)).toEqual({})
  })
})
