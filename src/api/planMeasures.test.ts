import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import spec from '../../docs/backend/openapi.json'
import { setSessionExpiredHandler } from './client'
import { API_BASE } from './config'
import { measuresViewFromApi, NOT_TRACKED } from './converters/measures'
import { cellKey, planChanges, planViewFromApi, previewVersion } from './converters/plan'
import { clearSession, setTokens } from './session'
import { loadMeasures, loadPlan, savePlan, sendPlan } from './supervisor'

const exampleOf = (path: string) =>
  (
    (spec.paths as unknown as Record<string, { get: { responses: Record<string, unknown> } }>)[path]
      .get.responses['200'] as {
      content: { 'application/json': { example: Record<string, unknown> } }
    }
  ).content['application/json'].example
const planExample = exampleOf('/api/v1/sites/{siteId}/plan')
const measuresExample = exampleOf('/api/v1/sites/{siteId}/measures')

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/** A small plan: two crews, five hours from 11:00. */
const hours = [3, 3, 3, 4, 2].map((level, i) => ({
  label: `${11 + i}:00`,
  start: `2026-11-12T${String(10 + i).padStart(2, '0')}:00:00Z`,
  level,
  possibleLevel: i === 3 ? null : null,
}))
const smallPlan = {
  status: 'draft',
  sentAt: null,
  hours,
  crews: [
    { crewId: 'b', name: 'Crew B', activity: 'excavation', workers: 7, ppe: ['cloth_coveralls'] },
    { crewId: 'c', name: 'Crew C', activity: 'welding', workers: 6, ppe: ['welding_jacket'] },
  ],
  current: {
    tasks: { b: ['H', 'H', 'H', 'L', 'L'], c: ['M', 'M', 'M', 'M', 'M'] },
    tooHotCells: [
      { crewId: 'b', hour: 0 },
      { crewId: 'b', hour: 1 },
      { crewId: 'b', hour: 2 },
      { crewId: 'c', hour: 3 },
    ],
    tooHotCrewHours: 4,
    workingCrewHours: 10,
  },
  suggested: {
    tasks: { b: ['L', 'L', 'L', 'L', 'H'], c: ['M', 'M', 'M', 'B', 'M'] },
    tooHotCells: [],
    tooHotCrewHours: 0,
    workingCrewHours: 9,
  },
  workersNeedingReducedExposure: 2,
  rule: { heavyFrom: 3, moderateFrom: 4 },
}

describe('shift plan', () => {
  it('reads the documented example: crews by name, the backend too-hot cells and numbers', () => {
    const view = planViewFromApi(planExample)
    expect(view.crews.map((c) => c.name)).toEqual(['Crew A', 'Crew B', 'Crew C'])
    expect(view.crews[1].meta).toBe('Excavation · 7 · coveralls')
    expect(view.crews[2].meta).toBe('Welding · 6 · welding PPE')
    expect(view.current.tooHot.has(cellKey('097bbd11-92d6-471b-8165-7b8f59d757bc', 5))).toBe(true)
    expect(view.current).toMatchObject({ tooHotCrewHours: 10, workingCrewHours: 31 })
    expect(view.workersNeedingReducedExposure).toBe(1)
    expect(view.hours[0]).toEqual({ label: '07:00', level: null, possible: false })
    expect(view.status).toBe('sent')
    expect(JSON.stringify(view.crews)).not.toMatch(/W-\d{4}/)
  })
  it('shows a possible higher level as "?" only when sent', () => {
    const view = planViewFromApi({
      ...smallPlan,
      hours: [{ label: '13:00', start: '2026-11-12T12:00:00Z', level: 3, possibleLevel: 4 }],
    })
    expect(view.hours[0]).toEqual({ label: '13:00', level: 4, possible: true })
  })
  it('writes "what the suggested plan changes" per crew, as in DECISIONS.md', () => {
    expect(planChanges(planViewFromApi(smallPlan))).toEqual([
      { who: 'Crew B', text: 'Heavy work moved out of 11:00 to 14:00 and into 15:00.' },
      { who: 'Crew C', text: 'Extra break at 14:00.' },
    ])
  })
  it('says nothing for a crew with no changes', () => {
    const same = { ...smallPlan, suggested: smallPlan.current }
    expect(planChanges(planViewFromApi(same))).toEqual([])
  })
  it('previews edits with the backend rule; saved numbers still come from the backend', () => {
    const view = planViewFromApi(smallPlan)
    const preview = previewVersion(
      { b: ['H', 'L', 'L', 'L', 'L'], c: ['M', 'M', 'M', 'M', 'B'] },
      view,
    )
    // Heavy at level 3 and moderate at level 4 are too hot.
    expect([...preview.tooHot].sort()).toEqual(['b:0', 'c:3'])
    expect(preview).toMatchObject({ tooHotCrewHours: 2, workingCrewHours: 9 })
  })
})

describe('measures', () => {
  const names = new Map([
    ['506a4f1c-9793-46cc-9709-0c5b02eff491', 'Crew C'],
    ['e03b476f-e004-4cb9-80b5-44d2623d550e', 'Crew B'],
  ])
  const view = measuresViewFromApi(measuresExample, names)
  const card = (id: string) => view.cards.find((c) => c.id === id)!
  it('marks provisional figures', () => {
    expect(card('lead-time')).toMatchObject({ value: 'No data yet', provisional: true })
    expect(card('false-alarms')).toMatchObject({
      value: '0%',
      summary: '0 of 1 warnings',
      provisional: true,
    })
    expect(card('missed')).toMatchObject({ value: '1', provisional: true })
    expect(card('compliance')).toMatchObject({ value: 'No data yet', provisional: true })
    expect(card('actions').provisional).toBeUndefined()
  })
  it('says "not tracked yet" when incidents are null', () => {
    expect(card('symptoms').value).toBe('6')
    expect(card('symptoms').summary).toContain(NOT_TRACKED.toLowerCase())
    const tracked = measuresViewFromApi(
      { ...measuresExample, symptomsAndIncidents: { symptomReports: 9, heatIncidents: 0 } },
      names,
    )
    expect(tracked.cards.find((c) => c.id === 'symptoms')).toMatchObject({
      value: '9 · 0',
      summary: 'Symptom reports · heat-related incidents',
    })
  })
  it('words escalations, lost time and the lead-time buckets', () => {
    expect(card('escalations').summary).toBe('5 of 6 answered within 10 min')
    expect(card('lost-time')).toMatchObject({
      value: '0 h',
      summary: 'Rest and pauses, of 205 h scheduled',
    })
    expect(view.leadTimes.map((b) => b.label)).toEqual(['Under 30 min', '30 to 60 min', '1 to 2 h'])
  })
  it('names crews from the crew list, and groups small crews', () => {
    expect(view.byCrew.map((b) => b.label)).toEqual(['Crew', 'Crew C', 'Crew B'])
    const grouped = measuresViewFromApi(
      { actionsFollowed: { byCrew: [{ crewId: 'x', grouped: true, percent: 50 }] } },
      names,
    )
    expect(grouped.byCrew).toEqual([{ label: 'Small crews', value: 50 }])
  })
})

describe('plan and measures calls', () => {
  let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
  const calls = () =>
    fetchMock.mock.calls.map(
      ([url, init]) => `${init.method ?? 'GET'} ${url.replace(API_BASE, '')}`,
    )
  const bodyOf = (call: number) => JSON.parse(String(fetchMock.mock.calls[call][1].body))
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    })
    fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)
    setSessionExpiredHandler(() => {})
    clearSession()
    setTokens({ accessToken: 'a1' })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads, saves and sends the plan', async () => {
    fetchMock.mockImplementation(async () => json(200, smallPlan))
    await loadPlan('s1')
    await savePlan('s1', { b: ['L', 'L', 'L', 'L', 'H'] })
    await sendPlan('s1', 'current')
    await sendPlan('s1', 'suggested')
    expect(calls()).toEqual([
      'GET /sites/s1/plan',
      'PUT /sites/s1/plan',
      'POST /sites/s1/plan/send',
      'POST /sites/s1/plan/send',
    ])
    expect(bodyOf(1)).toEqual({ crews: { b: ['L', 'L', 'L', 'L', 'H'] } })
    expect(bodyOf(2)).toEqual({ use: 'current' })
    expect(bodyOf(3)).toEqual({ use: 'suggested' })
  })
  it('loads measures for the chosen period with crew names', async () => {
    fetchMock.mockImplementation(async (url) =>
      url.includes('/crews')
        ? json(200, [{ id: 'e03b476f-e004-4cb9-80b5-44d2623d550e', name: 'Crew B' }])
        : json(200, measuresExample),
    )
    const view = await loadMeasures('s1', '7d')
    expect(calls()).toContain('GET /sites/s1/measures?period=7d')
    expect(view.byCrew.map((b) => b.label)).toContain('Crew B')
  })
})
