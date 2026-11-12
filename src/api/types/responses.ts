/**
 * Response types taken from the generated schema (src/api/schema.d.ts, built from
 * docs/backend/openapi.json). Regenerate with npm run generate-api-types; never edit by hand.
 */
import type { paths } from '../schema'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** The success response (200, else 201) of one operation. */
type Success<R> = R extends { 200: infer A } ? A : R extends { 201: infer B } ? B : never
type Json<T> = T extends { content: { 'application/json': infer J } } ? J : never

/** The JSON body an endpoint returns on success, for example ResponseOf<'/api/v1/me/risk', 'get'>. */
export type ResponseOf<P extends keyof paths, M extends Method> =
  paths[P] extends Record<M, { responses: infer R }> ? Json<Success<R>> : never

/** GET /health */
export type HealthCheckResponse = ResponseOf<'/api/v1/health', 'get'>

/** POST /auth/login. POST /auth/refresh returns the same shape. */
export type AuthTokensResponse = ResponseOf<'/api/v1/auth/login', 'post'>

/** GET /users/me: the signed-in account (role, and workerId for workers). */
export type UserMeResponse = ResponseOf<'/api/v1/users/me', 'get'>

/** GET /me/risk */
export type MyRiskResponse = ResponseOf<'/api/v1/me/risk', 'get'>

/** GET /sites/{siteId}/today */
export type SiteTodayResponse = ResponseOf<'/api/v1/sites/{siteId}/today', 'get'>

/** One item of GET /me/help-requests (the worker's own; includes their shared symptoms). */
export type MyHelpRequest = ResponseOf<'/api/v1/me/help-requests', 'get'>[number]

/** One item of GET /sites/{siteId}/help-requests (supervisor; never symptoms). */
export type SiteHelpRequest = ResponseOf<'/api/v1/sites/{siteId}/help-requests', 'get'>[number]

/* ---------- GET /me ---------- */

/**
 * GET /me: from captured samples, schema missing in spec. The spec documents it only as "object"
 * with no example, so this type is built from docs/backend/samples/me-worker-W-0301.json and
 * me-supervisor-S-001.json (12 Nov 2026). Read it defensively; ask the backend team to document it.
 */
export type UserRole = 'worker' | 'supervisor' | 'admin' | 'occupational_health'

export interface MeResponse {
  user: { id: string; loginId: string; role: UserRole }
  /** null for supervisors. */
  worker: {
    /** A UUID. Show employeeCode (for example W-0301), never this. */
    id: string
    employeeCode: string
    displayName: string
    crew: { id: string; name: string } | null
    /** App language code: en, ha, yo, ig or pcm. */
    language: string
    readAloud: boolean
    acclimatization: {
      acclimatized: boolean
      startedOn: string | null
      daysSinceStart: number | null
    }
  } | null
  /** null for the supervisor sample: supervisors find their site with GET /sites. */
  site: {
    id: string
    name: string
    timezone: string
    emergencyNumber: string | null
    shifts: Array<{ name: string; start: string; end: string }>
  } | null
  /** Today's work assignment, or null. */
  assignment: {
    id: string
    siteId: string
    activity: { code: string; name: string }
    workload: string
    workEnvironment: string
    startsAt: string
    endsAt: string
    plannedBreaks: string[]
    breakMinutes: number
    clockedInAt: string | null
    clockedOutAt: string | null
    onBreakSince: string | null
    lastBreakEndedAt: string | null
  } | null
  /** The worker's own consent choices; null for supervisors. */
  consents: { healthPrecautions: boolean; wearableBand: boolean; symptomReports: boolean } | null
  /**
   * null in both samples, so the shape is not known yet. Only the demo workers W-0412 and W-0384
   * have one, and they are never used for captures. Ask the backend team before reading it.
   */
  precaution: unknown
}
