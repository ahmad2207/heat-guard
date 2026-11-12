/**
 * The data layer. Each function returns the app's own types, from the backend (converted) or
 * from the sample data in src/data/mock.ts, depending on VITE_DATA_SOURCE.
 *
 * Phase 2 sets up the pattern with one example per area. No screen calls these yet.
 */
import { CURRENT_RISK_LEVEL, PLAN_CREWS, SITE, WORKER } from '../data/mock'
import type { Language } from '../data/types'
import { DEFAULT_SITE_TIME_ZONE, setSiteTimeZone } from '../lib/format'
import type { RiskLevel } from '../lib/risk'
import { apiRequest, type RequestOptions } from './client'
import { isMockMode } from './config'
import { crewsFromApi, languageFromCode, riskLevelFromCode, type CrewSummary } from './converters'
import type { MeResponse, MyRiskResponse, SiteTodayResponse } from './types/responses'
import type { Schemas } from './converters/codes'

/** Cancel and slow-signal options, the same shape useApiData passes in. */
export type LoadOptions = Pick<RequestOptions, 'signal' | 'onSlow'>

/* ---------- Session ---------- */

export interface SiteSummary {
  id: string
  name: string
  timezone: string
}

/** The person's site. Also sets the site timezone that every time on screen uses. */
export async function getMySite(options: LoadOptions = {}): Promise<SiteSummary> {
  if (isMockMode) return { id: 'sample-site', name: SITE.name, timezone: DEFAULT_SITE_TIME_ZONE }
  const sites = await apiRequest<Schemas['Site'][]>('/sites', options)
  const site = sites[0]
  setSiteTimeZone(site?.timezone)
  return {
    id: site?.id ?? '',
    name: site?.name ?? '',
    timezone: site?.timezone ?? DEFAULT_SITE_TIME_ZONE,
  }
}

/* ---------- Worker ---------- */

export interface WorkerSettings {
  /** The worker code shown on screen, for example W-0301. */
  workerCode: string
  language: Language
  readAloud: boolean
}

export async function getMySettings(options: LoadOptions = {}): Promise<WorkerSettings> {
  if (isMockMode) {
    return { workerCode: WORKER.id, language: WORKER.language, readAloud: WORKER.sharing.voice }
  }
  const me = await apiRequest<MeResponse>('/me', options)
  return {
    // The worker code (W-0301) is what screens show; the UUID is only for API paths.
    workerCode: me.worker?.employeeCode ?? '',
    language: languageFromCode(me.worker?.language),
    readAloud: me.worker?.readAloud === true,
  }
}

/** The worker's current risk level, or null when the server has none (never guessed). */
export async function getMyRiskLevel(options: LoadOptions = {}): Promise<RiskLevel | null> {
  if (isMockMode) return CURRENT_RISK_LEVEL
  const risk = await apiRequest<MyRiskResponse>('/me/risk', options)
  return riskLevelFromCode(risk.level)
}

/* ---------- Supervisor ---------- */

export async function getCrews(siteId: string, options: LoadOptions = {}): Promise<CrewSummary[]> {
  if (isMockMode) return PLAN_CREWS.map(({ id, name }) => ({ id, name }))
  const crews = await apiRequest<unknown>(`/sites/${encodeURIComponent(siteId)}/crews`, options)
  return crewsFromApi(crews)
}

export async function getSiteToday(
  siteId: string,
  options: LoadOptions = {},
): Promise<{ siteName: string; workersOnShift: number | null }> {
  if (isMockMode) return { siteName: SITE.name, workersOnShift: SITE.workersOnShift }
  const today = await apiRequest<SiteTodayResponse>(
    `/sites/${encodeURIComponent(siteId)}/today`,
    options,
  )
  setSiteTimeZone(today.site?.timezone)
  return {
    siteName: today.site?.name ?? '',
    workersOnShift: typeof today.workersOnShift === 'number' ? today.workersOnShift : null,
  }
}
