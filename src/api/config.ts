/**
 * Where the app gets its data from.
 *
 * VITE_API_URL is the backend host only, for example https://health-heat.onrender.com. Routes are
 * under /api/v1 on that host.
 * VITE_DATA_SOURCE is "api" or "mock". When it is not set, the app uses the API if VITE_API_URL is
 * set and sample data if it is empty, so a fresh checkout runs on sample data.
 */
export type DataSource = 'api' | 'mock'

/** Trims the host and drops any trailing slash, so paths can always start with "/". */
export function normaliseApiUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

export function resolveDataSource(explicit: string | undefined, apiUrl: string): DataSource {
  const value = (explicit ?? '').trim().toLowerCase()
  if (value === 'api' || value === 'mock') return value
  return apiUrl ? 'api' : 'mock'
}

export const API_URL = normaliseApiUrl(import.meta.env.VITE_API_URL)
export const API_BASE = `${API_URL}/api/v1`
export const DATA_SOURCE: DataSource = resolveDataSource(import.meta.env.VITE_DATA_SOURCE, API_URL)
export const isMockMode = DATA_SOURCE === 'mock'
