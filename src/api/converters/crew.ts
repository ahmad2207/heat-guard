import type { CrewId } from '../../data/types'

/** A crew as the app uses it. In api mode the ID and the name come from the backend. */
export interface CrewSummary {
  id: CrewId
  name: string
}

/** Crew from GET /sites/:siteId/crews. Returns null for a crew without an ID. */
export function crewFromApi(body: unknown): CrewSummary | null {
  if (!body || typeof body !== 'object') return null
  const { id, name } = body as Record<string, unknown>
  if (typeof id !== 'string' || !id) return null
  return { id, name: typeof name === 'string' && name.trim() ? name.trim() : 'Unnamed crew' }
}

export function crewsFromApi(body: unknown): CrewSummary[] {
  if (!Array.isArray(body)) return []
  return body.map(crewFromApi).filter((crew): crew is CrewSummary => crew !== null)
}
