import { isMockMode } from '../api/config'
import { SITE_TIME } from '../data/mock'
import { formatTime } from './format'

// When this module first loads, which is when the page loads.
const pageLoadedAt = Date.now()

/**
 * The current time as HH:MM, used for every time the app shows after an action.
 *
 * Mock mode: a demo clock, the sample site time (10:32) plus the real minutes since the page
 * loaded, so it matches the sample data.
 * API mode: the device clock, shown in the site timezone.
 */
export function now(): string {
  if (!isMockMode) return formatTime(new Date())
  const [hours, minutes] = SITE_TIME.split(':').map(Number)
  const elapsed = Math.floor((Date.now() - pageLoadedAt) / 60_000)
  const total = (hours * 60 + minutes + elapsed) % (24 * 60)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}
