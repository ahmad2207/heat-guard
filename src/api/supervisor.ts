/**
 * Supervisor pages (api mode). Mock mode keeps the sample data, so screens call these only when
 * isMockMode is false. Supervisor actions are not queued offline: they need the live page.
 */
import { setSiteTimeZone } from '../lib/format'
import { apiRequest, type RequestOptions } from './client'
import { crewsFromApi, type CrewSummary } from './converters/crew'
import { measuresViewFromApi, type MeasurePeriod, type MeasuresView } from './converters/measures'
import { planViewFromApi, type PlanView } from './converters/plan'
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

/* ---------- Shift plan ---------- */

type PlanResponse = ResponseOf<'/api/v1/sites/{siteId}/plan', 'get'>

/** GET /sites/{id}/plan: today's current and suggested plans, with the backend's too-hot cells. */
export async function loadPlan(siteId: string, options: LoadOptions = {}): Promise<PlanView> {
  return planViewFromApi(
    await apiRequest<PlanResponse>(`/sites/${encodeURIComponent(siteId)}/plan`, options),
  )
}

/** PUT /sites/{id}/plan: saves an edited plan. The answer has the backend's numbers. */
export async function savePlan(siteId: string, tasks: Record<string, string[]>): Promise<PlanView> {
  return planViewFromApi(
    await apiRequest<PlanResponse>(`/sites/${encodeURIComponent(siteId)}/plan`, {
      method: 'PUT',
      body: { crews: tasks },
    }),
  )
}

/**
 * POST /sites/{id}/plan/send. "current" sends the saved (edited) plan, "suggested" the
 * suggestion. It notifies no one yet; it marks the plan as sent.
 */
export async function sendPlan(siteId: string, use: 'current' | 'suggested'): Promise<PlanView> {
  return planViewFromApi(
    await apiRequest<PlanResponse>(`/sites/${encodeURIComponent(siteId)}/plan/send`, {
      method: 'POST',
      body: { use },
    }),
  )
}

/* ---------- Measures ---------- */

/** GET /sites/{id}/measures?period=. Crew names come from the site's crew list. */
export async function loadMeasures(
  siteId: string,
  period: MeasurePeriod,
  options: LoadOptions = {},
): Promise<MeasuresView> {
  const [body, crews] = await Promise.all([
    apiRequest<unknown>(
      `/sites/${encodeURIComponent(siteId)}/measures?period=${encodeURIComponent(period)}`,
      options,
    ),
    loadCrewOptions(siteId, options),
  ])
  return measuresViewFromApi(body, new Map(crews.map((crew) => [crew.id, crew.name])))
}
