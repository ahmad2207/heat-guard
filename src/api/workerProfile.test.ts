import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import spec from '../../docs/backend/openapi.json'
import { mockPrecautionView, precautionViewFromApi } from '../features/worker/precautionView'
import { setSessionExpiredHandler } from './client'
import { API_BASE } from './config'
import { accessLogFromApi, accessRoleText, UNKNOWN_ROLE_TEXT } from './converters/accessLog'
import { healthAnswersFromApi, healthAnswersToApi } from './converters/healthProfile'
import { clearSession, setTokens } from './session'
import type { MeResponse } from './types/responses'
import {
  deleteHealthProfile,
  loadHealthProfile,
  loadWorkerAccount,
  saveConsents,
  saveHealthProfile,
} from './workerProfile'

/** The documented GET /me examples (read only; nothing is saved for these workers). */
const meExamples = (
  spec.paths['/api/v1/me'].get.responses['200'].content['application/json'] as unknown as {
    examples: Record<string, { value: MeResponse }>
  }
).examples
const highPriority = meExamples.worker_high_priority.value
const noPrecautions = meExamples.worker_no_precautions.value

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => `${init.method ?? 'GET'} ${url.replace(API_BASE, '')}`)
const bodyOf = (call: number) => JSON.parse(String(fetchMock.mock.calls[call][1].body))

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    },
  })
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
  vi.stubGlobal('fetch', fetchMock)
  setSessionExpiredHandler(() => {})
  clearSession()
  setTokens({ accessToken: 'a1' })
})
afterEach(() => vi.unstubAllGlobals())

describe('health answers', () => {
  it('reads saved codes and drops unknown ones', () => {
    expect(
      healthAnswersFromApi({
        ageRange: '40_54',
        healthConditions: ['heart', 'spleen'],
        heatIllness: 'recent',
        medications: ['bp'],
        acclimatisationAnswer: 'over2',
      }),
    ).toEqual({
      ageRange: '40 to 54',
      conditions: ['heart'],
      heatIllness: 'recent',
      medicines: ['bp'],
      acclimatisation: 'over2',
    })
  })
  it('reads an empty or missing profile as unanswered', () => {
    expect(healthAnswersFromApi(null)).toEqual({
      ageRange: '',
      conditions: [],
      heatIllness: null,
      medicines: [],
      acclimatisation: null,
    })
  })
  const answers = {
    ageRange: '',
    conditions: ['none'],
    heatIllness: null,
    medicines: [],
    acclimatisation: 'new',
  }
  it('leaves an unanswered age out when none was saved', () => {
    expect(healthAnswersToApi(answers, { ageWasSaved: false })).toEqual({
      healthConditions: ['none'],
      medications: [],
      acclimatisation: 'new',
    })
  })
  it('clears a saved age range with null', () => {
    expect(healthAnswersToApi(answers, { ageWasSaved: true })).toMatchObject({ ageRange: null })
  })
  it('sends the age code when answered', () => {
    expect(
      healthAnswersToApi({ ...answers, ageRange: 'Prefer not to say' }, { ageWasSaved: false }),
    ).toMatchObject({ ageRange: 'prefer_not_to_say' })
  })
})

describe('access log', () => {
  it('uses plain words for every role and never the raw role', () => {
    expect(accessRoleText('occupational_health')).toBe(
      'Occupational health viewed your health profile',
    )
    expect(accessRoleText('supervisor')).toBe('Your supervisor viewed your risk level and actions')
    expect(accessRoleText('auditor')).toBe(UNKNOWN_ROLE_TEXT)
    expect(accessRoleText(undefined)).toBe('Someone at your site viewed your data')
  })
  it('turns entries into rows, newest first, with site times and counts', () => {
    const rows = accessLogFromApi([
      {
        date: '2026-11-11',
        actorRole: 'supervisor',
        action: 'risk.overview_viewed',
        count: 1,
        lastAt: '2026-11-11T09:00:00Z',
      },
      {
        date: '2026-11-12',
        actorRole: 'occupational_health',
        action: 'risk.detail_read',
        count: 5,
        lastAt: '2026-11-12T13:04:12Z',
      },
      { broken: true },
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      kind: 'other',
      title: 'Occupational health viewed your health profile',
      detail: '12 Nov · last at 14:04 · 5 times',
    })
    expect(rows[1]).toMatchObject({ kind: 'supervisor', detail: '11 Nov · last at 10:00 · once' })
    expect(JSON.stringify(rows)).not.toMatch(/risk\.|occupational_health/)
  })
})

describe('precaution card', () => {
  it('shows the level, restrictions and dates from /me', () => {
    const view = precautionViewFromApi(highPriority.precaution)
    expect(view).toMatchObject({ level: 'high', name: 'High-priority precautions' })
    expect(view?.restrictions.length).toBeGreaterThan(0)
    expect(view?.setOn).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/)
    expect(view?.nextReview).toBe('10 Dec')
  })
  it('shows no card when the worker has no health profile', () => {
    expect(noPrecautions.precaution).toBeNull()
    expect(precautionViewFromApi(noPrecautions.precaution)).toBeNull()
  })
  it('keeps W-0412 on High-priority in mock mode', () => {
    expect(mockPrecautionView()).toMatchObject({ level: 'high', setOn: '12 Oct' })
  })
})

describe('worker account', () => {
  it('is first run when the consent history is empty', async () => {
    fetchMock.mockResolvedValueOnce(json(200, noPrecautions)).mockResolvedValueOnce(json(200, []))
    const account = await loadWorkerAccount()
    expect(account.hasChosen).toBe(false)
    expect(calls()).toEqual(['GET /me', `GET /workers/${noPrecautions.worker!.id}/consents`])
  })
  it('has chosen when there is any consent record, and shows the worker code', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, noPrecautions))
      .mockResolvedValueOnce(json(200, [{ purpose: 'symptom_reports', granted: false }]))
    const account = await loadWorkerAccount()
    expect(account.hasChosen).toBe(true)
    expect(account.workerCode).toBe(noPrecautions.worker!.employeeCode)
  })
  it('saves consent with the agreed policy version', async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, { healthPrecautions: true, wearableBand: false, symptomReports: true }),
    )
    await saveConsents({ health: true, band: false, reports: true })
    expect(calls()).toEqual(['PUT /me/consents'])
    expect(bodyOf(0)).toMatchObject({ policyVersion: '2026-11-v1', healthPrecautions: true })
  })
})

describe('health profile calls', () => {
  it('treats no profile yet (404) as an empty form', async () => {
    fetchMock.mockResolvedValueOnce(json(404, { statusCode: 404, message: 'Not found' }))
    await expect(loadHealthProfile('w1')).resolves.toMatchObject({
      ageWasSaved: false,
      answers: { conditions: [] },
    })
  })
  it('throws a conflict when health sharing is off (409)', async () => {
    fetchMock.mockResolvedValueOnce(
      json(409, { statusCode: 409, message: 'Health consent required' }),
    )
    await expect(
      saveHealthProfile(
        'w1',
        { ageRange: '', conditions: [], heatIllness: null, medicines: [], acclimatisation: null },
        true,
      ),
    ).rejects.toMatchObject({ kind: 'conflict' })
    expect(bodyOf(0)).toMatchObject({ ageRange: null })
  })
  it('counts deleting a missing profile as deleted', async () => {
    fetchMock.mockResolvedValueOnce(json(404, {}))
    await expect(deleteHealthProfile('w1')).resolves.toBeUndefined()
    expect(calls()).toEqual(['DELETE /workers/w1/health-profile'])
  })
})
