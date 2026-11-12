/**
 * The backend sends UTC times. The app shows them in the site's timezone (site.timezone), so a
 * supervisor and the workers always see the same clock time whatever the phone is set to.
 */
export const DEFAULT_SITE_TIME_ZONE = 'Africa/Lagos'

let siteTimeZone = DEFAULT_SITE_TIME_ZONE

/** True when Intl knows the timezone name. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return true
  } catch {
    return false
  }
}

/** Set once the site is loaded. Unknown names are ignored and the current zone is kept. */
export function setSiteTimeZone(timeZone: string | null | undefined): void {
  if (timeZone && isValidTimeZone(timeZone)) siteTimeZone = timeZone
}

export function getSiteTimeZone(): string {
  return siteTimeZone
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "10:32", 24-hour, in the site timezone. Empty for a missing or invalid time. */
export function formatTime(
  value: string | number | Date | null | undefined,
  timeZone = siteTimeZone,
): string {
  const date = value == null ? null : toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** "12 Oct", in the site timezone. Empty for a missing or invalid date. */
export function formatDate(
  value: string | number | Date | null | undefined,
  timeZone = siteTimeZone,
): string {
  const date = value == null ? null : toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short' }).format(date)
}

function duration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/**
 * "in 12 min", "5 min ago", "in 1 h 20 min" or "now" (under a minute either way). Rounded to the
 * nearest minute. Empty for a missing or invalid time.
 */
export function formatRelative(
  value: string | number | Date | null | undefined,
  now: number | Date = Date.now(),
): string {
  const date = value == null ? null : toDate(value)
  if (!date) return ''
  const minutes = Math.round((date.getTime() - Number(now)) / 60_000)
  if (minutes === 0) return 'now'
  return minutes > 0 ? `in ${duration(minutes)}` : `${duration(-minutes)} ago`
}
