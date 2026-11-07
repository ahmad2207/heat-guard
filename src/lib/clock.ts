import { SITE_TIME } from '../data/mock'

// When this module first loads, which is when the page loads.
const pageLoadedAt = Date.now()

/**
 * Demo clock: the sample site time (10:32) plus the real minutes since the page loaded, as HH:MM.
 * Used for every time the app shows after an action, so it matches the sample data.
 *
 * Replace with the real device time when the backend is connected.
 */
export function now(): string {
  const [hours, minutes] = SITE_TIME.split(':').map(Number)
  const elapsed = Math.floor((Date.now() - pageLoadedAt) / 60_000)
  const total = (hours * 60 + minutes + elapsed) % (24 * 60)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}
