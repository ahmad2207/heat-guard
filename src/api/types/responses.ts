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
 * GET /me: the signed-in person, their worker record, site, today's assignment, consent choices
 * and their own precaution summary. The captured samples in docs/backend/samples/ are kept as
 * reference.
 */
export type MeResponse = ResponseOf<'/api/v1/me', 'get'>

export type UserRole = MeResponse['user']['role']

/**
 * The worker's own precaution summary. null when they have no health profile, and for
 * non-workers. Never shown to supervisors.
 */
export type MePrecaution = NonNullable<MeResponse['precaution']>
