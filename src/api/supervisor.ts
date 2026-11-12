/**
 * Supervisor pages (api mode). Mock mode keeps the sample data, so screens call these only when
 * isMockMode is false. Supervisor actions are not queued offline: they need the live page.
 */
import { setSiteTimeZone } from '../lib/format'
import { apiRequest, type RequestOptions } from './client'
import { crewsFromApi, type CrewSummary } from './converters/crew'
import { todayViewFromApi, type TodayView } from './converters/siteToday'
import type { ResponseOf } from './types/responses'

export type LoadOptions = Pick<RequestOptions, 'signal' | 'onSlow'>

export interface TodayFilters {
  crewId: string
  /** Activity code, for example excavation. */
  activity: string
  /** Shift name, for example "Day shift". */
  shift: string
}

export const NO_FILTERS: TodayFilters = { crewId: '', activity: '', shift: '' }

/** GET /sites/{siteId}/today with the filters as query parameters (empty ones left out). */
export async function loadSiteToday(
  siteId: string,
  filters: TodayFilters,
  options: LoadOptions = {},
): Promise<TodayView> {
  const query = new URLSearchParams()
  if (filters.crewId) query.set('crewId', filters.crewId)
  if (filters.activity) query.set('activity', filters.activity)
  if (filters.shift) query.set('shift', filters.shift)
  const qs = query.toString()
  const body = await apiRequest<ResponseOf<'/api/v1/sites/{siteId}/today', 'get'>>(
    `/sites/${encodeURIComponent(siteId)}/today${qs ? `?${qs}` : ''}`,
    options,
  )
  setSiteTimeZone(body?.site?.timezone)
  return todayViewFromApi(body)
}

/**
 * The crew choices: every crew at the site (GET /sites/{id}/crews), not just the ones on the
 * filtered page, so the dropdown keeps every option after one is picked. Activity choices come
 * from the site's crews on an unfiltered Today (TodayView.activities): the activity categories
 * list is a general catalogue, not this site's activities.
 */
export async function loadCrewOptions(
  siteId: string,
  options: LoadOptions = {},
): Promise<CrewSummary[]> {
  return crewsFromApi(
    await apiRequest<unknown>(`/sites/${encodeURIComponent(siteId)}/crews`, options),
  )
}

/** "I am on my way": POST /help-requests/{id}/acknowledge. */
export async function acknowledgeHelp(helpRequestId: string): Promise<void> {
  await apiRequest(`/help-requests/${encodeURIComponent(helpRequestId)}/acknowledge`, {
    method: 'POST',
  })
}

/** "Mark resolved": POST /help-requests/{id}/resolve. */
export async function resolveHelp(helpRequestId: string): Promise<void> {
  await apiRequest(`/help-requests/${encodeURIComponent(helpRequestId)}/resolve`, {
    method: 'POST',
  })
}

export type InterventionStatus = 'acknowledged' | 'implemented' | 'reassigned' | 'dismissed'

/** POST /recommendations/{id}/interventions. Reassign sends the chosen option as the note. */
export async function recordIntervention(
  recommendationId: string,
  status: InterventionStatus,
  note?: string,
): Promise<void> {
  await apiRequest(`/recommendations/${encodeURIComponent(recommendationId)}/interventions`, {
    method: 'POST',
    body: note ? { status, note } : { status },
  })
}
