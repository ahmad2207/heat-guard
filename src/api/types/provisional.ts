/**
 * Response types for endpoints whose responses are not documented in docs/backend/openapi.json.
 * Written from docs/backend/HeatGuard_Frontend_To-Do.pdf and FRONTEND_BACKEND_GAPS.md.
 *
 * Every type here is provisional: confirm with the backend team. They stay small on purpose and
 * will be corrected when the team sends schemas or we capture sample responses. Converters read
 * them defensively, so a missing field never breaks a screen.
 */

/** Provisional: confirm with the backend team. GET /health */
export interface HealthCheckResponse {
  status?: string
}

/** Provisional: confirm with the backend team. POST /auth/login and POST /auth/refresh */
export interface AuthTokensResponse {
  accessToken: string
  refreshToken?: string
}

export type UserRole = 'worker' | 'supervisor' | 'admin'

/** Provisional: confirm with the backend team. GET /me */
export interface MeResponse {
  id: string
  role: UserRole
  /** Set for workers. */
  workerId?: string | null
  siteId?: string | null
  displayName?: string
  /** App language code: en, ha, yo, ig or pcm. */
  preferredLanguage?: string
  readAloud?: boolean
}

/** Provisional: confirm with the backend team. GET /me/risk */
export interface MyRiskResponse {
  /** 1 to 4. */
  level: number
  label?: string
  action?: string
  /** Level only (gaps doc: crewLevel in /me/risk). */
  crewLevel?: number | null
  nextBreak?: { startsAt: string; minutes?: number; place?: string } | null
  forecast?: {
    hours: Array<{ time: string; level: number; possible?: boolean }>
    /** high, medium or low; "medium" is shown as "moderate". */
    confidence?: string | null
  } | null
  dataSources?: { weather?: boolean; siteSensor?: boolean; band?: boolean } | null
  hazards?: Array<{ code: string; level?: string }>
  updatedAt?: string
}

/** Provisional: confirm with the backend team. GET /sites/:siteId/today (top of the page only) */
export interface SiteTodayResponse {
  site: { id: string; name: string; timezone: string }
  shift?: { name: string; start: string; end: string } | null
  workersOnShift?: number
}

/** Provisional: confirm with the backend team. GET /sites/:siteId/help-requests and /me/help-requests */
export interface HelpRequestResponse {
  id: string
  workerId: string
  kind: 'symptom_report' | 'first_aid'
  status: 'open' | 'acknowledged' | 'resolved'
  createdAt: string
}
