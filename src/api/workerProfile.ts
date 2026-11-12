/**
 * The worker's own account, consent, health profile and data (api mode). Mock mode keeps using
 * the WorkerPreferences store, so screens call these only when isMockMode is false.
 */
import type { HealthProfileAnswers, Language } from '../data/types'
import { apiRequest, type RequestOptions } from './client'
import { consentFromApi, consentToApi, type ConsentChoices } from './converters/consent'
import { healthAnswersFromApi, healthAnswersToApi } from './converters/healthProfile'
import { accessLogFromApi, type AccessLogRow } from './converters/accessLog'
import { languageFromCode, languageToCode } from './converters/language'
import { ApiError } from './errors'
import type { MePrecaution, MeResponse, ResponseOf } from './types/responses'

export type LoadOptions = Pick<RequestOptions, 'signal' | 'onSlow'>

export interface WorkerAccount {
  /** UUID, for API paths only. */
  workerId: string
  /** Shown on screen, for example W-0301. */
  workerCode: string
  language: Language
  readAloud: boolean
  consents: ConsentChoices
  /** True once the worker has made any consent choice (the consent history is not empty). */
  hasChosen: boolean
  /** null: no health profile, so no precaution card. */
  precaution: MePrecaution | null
}

type ConsentHistory = ResponseOf<'/api/v1/workers/{workerId}/consents', 'get'>

const workerPath = (workerId: string, rest: string) =>
  `/workers/${encodeURIComponent(workerId)}/${rest}`

function accountFromMe(me: MeResponse, hasChosen: boolean): WorkerAccount {
  if (!me.worker) throw new ApiError('forbidden', 403, 'This page is for workers.')
  return {
    workerId: me.worker.id,
    workerCode: me.worker.employeeCode,
    language: languageFromCode(me.worker.language),
    readAloud: me.worker.readAloud === true,
    consents: consentFromApi(me.consents),
    hasChosen,
    precaution: me.precaution ?? null,
  }
}

/** GET /me, then the consent history: never chosen means first run (show /worker/welcome). */
export async function loadWorkerAccount(options: LoadOptions = {}): Promise<WorkerAccount> {
  const me = await apiRequest<MeResponse>('/me', options)
  if (!me.worker) return accountFromMe(me, false)
  const history = await apiRequest<ConsentHistory>(workerPath(me.worker.id, 'consents'), options)
  return accountFromMe(me, Array.isArray(history) && history.length > 0)
}

/** PATCH /me/preferences. Returns the updated account fields from the /me-shaped response. */
export async function saveLanguage(language: Language): Promise<void> {
  await apiRequest('/me/preferences', {
    method: 'PATCH',
    body: { language: languageToCode(language) },
  })
}

export async function saveReadAloud(readAloud: boolean): Promise<void> {
  await apiRequest('/me/preferences', { method: 'PATCH', body: { readAloud } })
}

/** PUT /me/consents with the agreed policy version. Returns the choices the server stored. */
export async function saveConsents(choices: ConsentChoices): Promise<ConsentChoices> {
  const saved = await apiRequest<unknown>('/me/consents', {
    method: 'PUT',
    body: consentToApi(choices),
  })
  return saved ? consentFromApi(saved) : choices
}

export interface SavedHealthProfile {
  answers: HealthProfileAnswers
  /** True when an age range is saved, so "Not answered" must clear it with null. */
  ageWasSaved: boolean
}

const EMPTY: SavedHealthProfile = {
  answers: {
    ageRange: '',
    conditions: [],
    heatIllness: null,
    medicines: [],
    acclimatisation: null,
  },
  ageWasSaved: false,
}

/** GET /workers/{id}/health-profile. No profile yet (404) is an empty form, not an error. */
export async function loadHealthProfile(
  workerId: string,
  options: LoadOptions = {},
): Promise<SavedHealthProfile> {
  try {
    const body = await apiRequest<unknown>(workerPath(workerId, 'health-profile'), options)
    if (!body) return EMPTY
    const answers = healthAnswersFromApi(body)
    return { answers, ageWasSaved: answers.ageRange !== '' }
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not-found') return EMPTY
    throw error
  }
}

/**
 * PUT /workers/{id}/health-profile. Without health consent the server answers 409, which is
 * thrown as an ApiError with kind "conflict" for the screen to explain.
 */
export async function saveHealthProfile(
  workerId: string,
  answers: HealthProfileAnswers,
  ageWasSaved: boolean,
): Promise<SavedHealthProfile> {
  const body = await apiRequest<unknown>(workerPath(workerId, 'health-profile'), {
    method: 'PUT',
    body: healthAnswersToApi(answers, { ageWasSaved }),
  })
  const saved = body ? healthAnswersFromApi(body) : answers
  return { answers: saved, ageWasSaved: saved.ageRange !== '' }
}

/** DELETE /workers/{id}/health-profile. Nothing to delete (404) counts as deleted. Consent stays. */
export async function deleteHealthProfile(workerId: string): Promise<void> {
  try {
    await apiRequest(workerPath(workerId, 'health-profile'), { method: 'DELETE' })
  } catch (error) {
    if (!(error instanceof ApiError && error.kind === 'not-found')) throw error
  }
}

/** GET /me/access-log, in plain words. */
export async function loadAccessLog(options: LoadOptions = {}): Promise<AccessLogRow[]> {
  return accessLogFromApi(await apiRequest<unknown>('/me/access-log', options))
}

/** GET /workers/{id}/data-export: everything the backend holds about the worker. */
export async function loadDataExport(workerId: string): Promise<unknown> {
  return apiRequest<unknown>(workerPath(workerId, 'data-export'))
}
