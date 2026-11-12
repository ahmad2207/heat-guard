import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import spec from '../../docs/backend/openapi.json'
import { setSessionExpiredHandler } from './client'
import { API_BASE } from './config'
import { activityName, todayViewFromApi } from './converters/siteToday'
import { crewNames, supervisorActionText } from './converters/supervisorActions'
import { clearSession, setTokens } from './session'
import {
  acknowledgeHelp,
  loadCrewOptions,
  loadSiteToday,
  NO_FILTERS,
  recordIntervention,
  resolveHelp,
} from './supervisor'

/** The documented GET /sites/{id}/today example (read only). */
const example = (
  spec.paths['/api/v1/sites/{siteId}/today'].get.responses['200'].content[
    'application/json'
  ] as unknown as { example: Record<string, unknown> }
).example

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('supervisor action wording', () => {
  it('uses our wording for every agreed code', () => {
    expect(supervisorActionText('supervisor.suspend_activity')).toBe(
      'Stop the affected activity now',
    )
    expect(supervisorActionText('supervisor.extra_breaks_reduce_load')).toBe(
      'Add extra breaks and reduce heavy work',
    )
    expect(supervisorActionText('supervisor.increase_monitoring')).toBe(
      'Check on the crew more often',
    )
    expect(supervisorActionText('supervisor.reschedule_before_peak')).toBe(
      'Move heavy work before the hottest hours',
    )
    expect(supervisorActionText('supervisor.review_ppe_cooling')).toBe(
      'Check cooling and rest options for crews in heavy protective equipment',
    )
    expect(
      supervisorActionText('supervisor.worker_reduced_exposure', { workerCode: 'W-0412' }),
    ).toBe('Worker W-0412 needs reduced exposure today')
    expect(supervisorActionText('supervisor.worker_earlier_breaks', { workerCode: 'W-0384' })).toBe(
      'Worker W-0384 needs earlier breaks today',
    )
    expect(supervisorActionText('crew.rotate_and_cool', { crew: 'Crew B' })).toBe(
      'Rotate Crew B between hot and shaded tasks and add cooling',
    )
  })
  it('counts workers when a summary row names none', () => {
    expect(supervisorActionText('supervisor.worker_earlier_breaks', { workerCount: 1 })).toBe(
      '1 worker needs earlier breaks today',
    )
    expect(supervisorActionText('supervisor.worker_reduced_exposure', { workerCount: 3 })).toBe(
      '3 workers need reduced exposure today',
    )
  })
  it('falls back to the backend text, then to words, never the code', () => {
    expect(supervisorActionText('supervisor.new_thing', { fallback: 'Do the new thing' })).toBe(
      'Do the new thing',
    )
    expect(supervisorActionText('supervisor.open_misting_fans')).toBe('Open misting fans')
  })
  it('joins crew names', () => {
    expect(crewNames(['Crew B'])).toBe('Crew B')
    expect(crewNames(['Crew A', 'Crew B', 'Crew C'])).toBe('Crews A, B and C')
    expect(crewNames(['Crew D', 'Crew A', 'Crew B', 'Crew A'])).toBe('Crews A, B and D')
  })
  it('never guesses a level the backend did not send', () => {
    const v = todayViewFromApi({
      siteHeat: { now: { level: null, wbgtC: null, wbgtMethod: null }, peak: null, hours: [] },
      crews: [{ crewId: 'c1', name: 'Crew A', now: null, peak: {} }],
    })
    expect(v.siteHeat).toMatchObject({ level: null, wbgt: 'No reading', peak: null })
    expect(v.crews[0].now).toBeNull()
  })
})

describe('GET /sites/{id}/today as the page shows it', () => {
  const view = todayViewFromApi(example)
  it('builds the header from the site, shift and update time', () => {
    expect(view.siteName).toBe('Abuja Demo Site')
    expect(view.subtitle).toBe('Day shift · 07:00 to 17:00 · 29 workers on shift')
    expect(view.status).toMatch(/^Updated \d{2}:\d{2} · WBGT estimated from weather data$/)
    expect(view.shifts).toEqual(['Day shift'])
  })
  it('shows site heat, the hours and the peak window', () => {
    expect(view.siteHeat).toMatchObject({ level: 4, wbgt: '31.4°C', wbgtNote: 'WBGT, estimated' })
    expect(view.siteHeat.peak).toEqual({
      title: 'Peak expected 14:00 to 16:00',
      text: 'Expected to reach Critical.',
    })
    expect(view.siteHeat.hours.find((h) => h.now)?.time).toBe('14')
    expect(view.peakLabel).toBe('Peak 14:00 to 16:00')
  })
  it('shows a possible peak and confidence only when present', () => {
    const v = todayViewFromApi({
      ...example,
      siteHeat: {
        ...(example.siteHeat as object),
        peak: {
          level: 4,
          possible: true,
          from: '2026-11-12T12:00:00Z',
          to: '2026-11-12T14:00:00Z',
          confidence: 'medium',
        },
        hours: [{ hourStart: '2026-11-12T12:00:00Z', level: 3, possibleLevel: 4, now: false }],
      },
    })
    expect(v.siteHeat.peak?.text).toBe('May reach Critical. Confidence moderate.')
    expect(v.siteHeat.hours[0]).toEqual({ time: '13', level: 4, possible: true })
    expect(v.siteHeat.note).toMatch(/^"4\?" means Critical is possible/)
  })
  it('counts workers by level, with no recent data', () => {
    expect(view.workersByLevel.levels[0]).toEqual({ level: 4, count: 29 })
    expect(view.workersByLevel.noRecentData).toBe(0)
  })
  it('shows "No site sensors" when there are none', () => {
    const sensors = view.systemHealth.find((row) => row.id === 'sensors')
    expect(sensors).toMatchObject({ detail: 'No site sensors', status: null, value: '' })
    const withSensor = todayViewFromApi({
      ...example,
      systemHealth: {
        ...(example.systemHealth as object),
        siteSensors: { lastAt: '2026-11-12T12:50:00Z', ok: false },
      },
    }).systemHealth.find((row) => row.id === 'sensors')
    expect(withSensor).toMatchObject({ value: '13:50', status: 'check' })
  })
  it('lists needs attention with worker codes, never UUIDs', () => {
    const first = view.needsAttention.items[0]
    expect(first).toMatchObject({
      kind: 'help',
      helpKind: 'first_aid_alert',
      workerCode: 'W-0388',
      crewName: 'Crew B',
    })
    expect(JSON.stringify(view.needsAttention.items)).not.toMatch(/ebafe8e7/)
  })
  it('reads all four kinds, worker care with the need only', () => {
    const v = todayViewFromApi({
      ...example,
      needsAttention: {
        open: 3,
        items: [
          {
            kind: 'critical',
            recommendationId: 'r1',
            workerId: 'uuid',
            workerCode: 'W-0500',
            crewId: '097bbd11-92d6-471b-8165-7b8f59d757bc',
            level: 4,
            status: 'open',
            createdAt: '2026-11-12T12:00:00Z',
          },
          {
            kind: 'crew_risk',
            recommendationId: 'r2',
            crewId: 'e03b476f-e004-4cb9-80b5-44d2623d550e',
            level: 3,
            highOrAbove: 7,
            crewOnShift: 7,
            activity: 'excavation',
            dueAt: '2026-11-12T11:00:00Z',
            status: 'open',
            createdAt: '2026-11-12T10:00:00Z',
          },
          {
            kind: 'worker_care',
            recommendationId: 'r3',
            workerId: 'uuid',
            workerCode: 'W-0412',
            crewId: 'x',
            need: 'reduced_exposure',
            reason: 'heart condition',
            status: 'acknowledged',
            createdAt: '2026-11-12T10:00:00Z',
          },
        ],
      },
    })
    const [critical, crew, care] = v.needsAttention.items
    expect(critical).toMatchObject({
      kind: 'critical',
      id: 'r1',
      workerCode: 'W-0500',
      crewName: 'Crew A',
    })
    expect(crew).toMatchObject({
      kind: 'crew_risk',
      crewName: 'Crew B',
      activity: 'Manual excavation',
      highOrAbove: 7,
      due: '12:00',
    })
    expect(care).toMatchObject({
      kind: 'worker_care',
      need: 'reduced_exposure',
      status: 'acknowledged',
    })
    expect(JSON.stringify(care)).not.toMatch(/heart|reason/)
  })
  it('words actions today, crews and the last 7 days', () => {
    expect(view.actionsToday.actions[0]).toMatchObject({
      title: '1 worker needs earlier breaks today',
      meta: 'Crew B · from 12:16',
      status: 'pending',
    })
    expect(view.actionsToday.actions[1].title).toBe('Stop the affected activity now')
    expect(view.crews[1]).toMatchObject({
      name: 'Crew B',
      activity: 'Manual excavation',
      workload: 'Very heavy',
      ppe: 'Coveralls',
      nextAction: '1 worker needs earlier breaks today',
    })
    expect(view.crews[2].ppe).toBe('Welding PPE')
    expect(view.last7Days[0]).toEqual({ day: 'Fri', hours: 0 })
    expect(view.last7Summary).toBe('Hours at High or above · actions done on time: 0 of 0')
  })
  it('words today so far, marking provisional figures', () => {
    expect(view.todaySoFar).toEqual([
      { value: 'Not yet', label: 'Warning lead time' },
      { value: '0 of 1', label: 'Warnings not borne out (provisional)' },
      { value: '0%', label: 'Actions followed' },
      { value: '6', label: 'Symptom reports' },
      { value: '6', label: 'Emergency escalations' },
      { value: '0 min', label: 'Work time paused' },
    ])
  })
})

describe('supervisor calls', () => {
  let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
  const calls = () =>
    fetchMock.mock.calls.map(
      ([url, init]) => `${init.method ?? 'GET'} ${url.replace(API_BASE, '')}`,
    )
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

  it('sends filters as query parameters and leaves empty ones out', async () => {
    fetchMock.mockImplementation(async () => json(200, example))
    await loadSiteToday('s1', NO_FILTERS)
    await loadSiteToday('s1', { crewId: 'c1', activity: 'excavation', shift: 'Day shift' })
    expect(calls()).toEqual([
      'GET /sites/s1/today',
      'GET /sites/s1/today?crewId=c1&activity=excavation&shift=Day+shift',
    ])
  })
  it('loads every site crew for the crew dropdown', async () => {
    fetchMock.mockResolvedValueOnce(json(200, [{ id: 'c1', name: 'Crew A' }]))
    await expect(loadCrewOptions('s1')).resolves.toEqual([{ id: 'c1', name: 'Crew A' }])
    expect(calls()).toEqual(['GET /sites/s1/crews'])
  })
  it('shows only the part of an activity name before " / "', () => {
    expect(activityName('Manual excavation / digging', 'excavation')).toBe('Manual excavation')
    expect(activityName('Welding', 'welding')).toBe('Welding')
    expect(activityName('', 'site_logistics')).toBe('Site logistics')
  })
  it('takes the activity choices from the site crews, once each, by name', () => {
    expect(todayViewFromApi(example).activities).toEqual([
      { code: 'concrete_work', name: 'Concrete work' },
      { code: 'excavation', name: 'Manual excavation' },
      { code: 'welding', name: 'Welding' },
    ])
  })
  it('posts help and intervention buttons to the right endpoints', async () => {
    fetchMock.mockImplementation(async () => json(201, {}))
    await acknowledgeHelp('h1')
    await resolveHelp('h1')
    await recordIntervention('r1', 'implemented')
    await recordIntervention('r2', 'reassigned', 'Lighter duty')
    expect(calls()).toEqual([
      'POST /help-requests/h1/acknowledge',
      'POST /help-requests/h1/resolve',
      'POST /recommendations/r1/interventions',
      'POST /recommendations/r2/interventions',
    ])
    expect(JSON.parse(String(fetchMock.mock.calls[2][1].body))).toEqual({ status: 'implemented' })
    expect(JSON.parse(String(fetchMock.mock.calls[3][1].body))).toEqual({
      status: 'reassigned',
      note: 'Lighter duty',
    })
  })
})
