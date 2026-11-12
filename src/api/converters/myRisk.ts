import type { ForecastHour } from '../../components/ForecastStrip'
import { formatTime } from '../../lib/format'
import type { RiskLevel } from '../../lib/risk'
import type { MyRiskResponse } from '../types/responses'
import { confidenceFromCode } from './confidence'
import { riskLevelFromCode } from './risk'

/** The fixed break place (DECISIONS.md: the backend has no break place). */
export const BREAK_PLACE = 'shaded rest area'

export interface HazardRow {
  id: string
  icon: 'dust' | 'storm'
  title: string
  detail: string
  /** The pill next to the title, as on supervisor Today. */
  pill: { status: 'hazard-moderate' | 'hazard-possible'; label: string }
}

export interface DataSource {
  label: string
  ok: boolean
}

/** Everything Home and What to do show from GET /me/risk, in the app's words. */
export interface RiskView {
  level: RiskLevel
  /** action.what: the main instruction, as the engine wrote it (in the worker's language). */
  instruction: string
  /** action.when, in plain words. */
  when: string
  /** assessedAt as "10:32" in the site timezone. */
  updatedAt: string
  /** Engine text, shown as received. */
  reasons: string[]
  nextBreak: { title: string; detail: string } | null
  forecast: { hours: ForecastHour[]; confidence: string | null }
  hazards: HazardRow[]
  dataSources: DataSource[]
  /** dataQuality "degraded": show "No fresh heat data". */
  degraded: boolean
  crewLevel: RiskLevel | null
  /** The first recommendation (highest level first), acknowledged by "I understand". */
  recommendationId: string | null
}

const FORECAST_HOURS = 6

/** Known action.when values in plain words. Anything else is tidied, never shown as a code. */
const WHEN_TEXT: Record<string, string> = {
  immediately: 'Now',
  now: 'Now',
}
export function whenText(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return ''
  const known = WHEN_TEXT[value.trim().toLowerCase()]
  if (known) return known
  const words = value.trim().replace(/[_-]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function minutesText(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** "Next break in 12 min" and "15 min in the shaded rest area", or "On break now". */
export function nextBreakText(
  nextBreak: Partial<MyRiskResponse['nextBreak']> | null | undefined,
): RiskView['nextBreak'] {
  if (!nextBreak) return null
  const duration =
    typeof nextBreak.durationMinutes === 'number' && nextBreak.durationMinutes > 0
      ? `${nextBreak.durationMinutes} min in the ${BREAK_PLACE}`
      : `In the ${BREAK_PLACE}`
  if (nextBreak.onBreakNow) {
    const since = formatTime(nextBreak.since as string | null | undefined)
    return { title: 'On break now', detail: since ? `Since ${since}. ${duration}` : duration }
  }
  if (typeof nextBreak.minutesUntil !== 'number' || nextBreak.minutesUntil < 0) return null
  const title =
    nextBreak.minutesUntil === 0
      ? 'Break now'
      : `Next break in ${minutesText(nextBreak.minutesUntil)}`
  return { title, detail: duration }
}

/**
 * The next six hours. A possible higher level is shown as that level marked "Possible" (as in
 * the design), only when the engine sends one.
 */
export function forecastHours(hours: unknown): ForecastHour[] {
  if (!Array.isArray(hours)) return []
  return hours
    .map((hour): ForecastHour | null => {
      if (!hour || typeof hour !== 'object') return null
      const h = hour as Record<string, unknown>
      const level = riskLevelFromCode(h.level)
      const time = formatTime(h.at as string)
      if (!level || !time) return null
      const possible = riskLevelFromCode(h.possibleLevel)
      return possible && possible > level
        ? { time, level: possible, possible: true }
        : { time, level }
    })
    .filter((hour): hour is ForecastHour => hour !== null)
    .slice(0, FORECAST_HOURS)
}

function timeRange(from: unknown, to: unknown): string {
  const start = formatTime(from as string)
  const end = formatTime(to as string)
  if (start && end) return `${start} to ${end}`
  if (start) return `from ${start}`
  return ''
}

/** Dust and thunderstorm hazards mapped to the Home rows and the supervisor pills. */
export function hazardRows(hazards: unknown): HazardRow[] {
  if (!Array.isArray(hazards)) return []
  return hazards
    .map((hazard, index): HazardRow | null => {
      if (!hazard || typeof hazard !== 'object') return null
      const h = hazard as Record<string, unknown>
      const when = timeRange(h.from, h.to)
      if (h.type === 'dust' && (h.severity === 'moderate' || h.severity === 'high')) {
        return {
          id: `dust-${index}`,
          icon: 'dust',
          title: when ? `Dusty air ${when}` : 'Dusty air',
          detail: 'Wear your dust mask outdoors. Rinse eyes at breaks.',
          pill:
            h.severity === 'high'
              ? { status: 'hazard-possible', label: 'High' }
              : { status: 'hazard-moderate', label: 'Moderate' },
        }
      }
      if (h.type === 'thunderstorm') {
        return {
          id: `storm-${index}`,
          icon: 'storm',
          title: when ? `Storms possible ${when}` : 'Storms possible',
          detail: 'Stop work at height if you hear thunder. Your supervisor will confirm.',
          pill: { status: 'hazard-possible', label: 'Possible' },
        }
      }
      return null
    })
    .filter((row): row is HazardRow => row !== null)
}

/** Weather always; site sensor and band only when the site or worker has one. */
export function dataSourceChips(sources: unknown): DataSource[] {
  const s = (sources && typeof sources === 'object' ? sources : {}) as Record<string, unknown>
  const ok = (value: unknown) =>
    !!value && typeof value === 'object' && (value as { ok?: unknown }).ok === true
  const chips: DataSource[] = [{ label: 'Weather', ok: ok(s.weather) }]
  if (s.siteSensor) chips.push({ label: 'Site sensor', ok: ok(s.siteSensor) })
  if (s.wearable) chips.push({ label: 'Your band', ok: ok(s.wearable) })
  return chips
}

/** GET /me/risk as the app shows it. Returns null when there is no usable level. */
export function riskViewFromApi(body: unknown): RiskView | null {
  if (!body || typeof body !== 'object') return null
  const r = body as Partial<MyRiskResponse> & Record<string, unknown>
  const level = riskLevelFromCode(r.level)
  if (!level) return null
  const recommendations = Array.isArray(r.recommendations) ? r.recommendations : []
  const confidence = confidenceFromCode(r.forecast?.confidence)
  return {
    level,
    instruction: typeof r.action?.what === 'string' ? r.action.what : '',
    when: whenText(r.action?.when),
    updatedAt: formatTime(r.assessedAt),
    reasons: Array.isArray(r.reasons)
      ? r.reasons
          .map((reason) => (typeof reason?.effect === 'string' ? reason.effect.trim() : ''))
          .filter(Boolean)
      : [],
    nextBreak: nextBreakText(r.nextBreak),
    forecast: {
      hours: forecastHours(r.forecast?.hours),
      confidence: confidence ? `Confidence: ${confidence}` : null,
    },
    hazards: hazardRows(r.hazards),
    dataSources: dataSourceChips(r.dataSources),
    degraded: r.dataQuality === 'degraded',
    crewLevel: riskLevelFromCode(r.crewLevel),
    recommendationId: typeof recommendations[0]?.id === 'string' ? recommendations[0].id : null,
  }
}

/**
 * What field mode keeps on the device: level, time and forecast only. No reasons or other text
 * from the engine, which can mention the worker's health.
 */
export interface SavedRisk {
  level: RiskLevel
  assessedAt: string
  hours: Array<{ at: string; level: number; possibleLevel: number | null }>
}

export function savedRiskFromApi(body: unknown): SavedRisk | null {
  if (!body || typeof body !== 'object') return null
  const r = body as Partial<MyRiskResponse>
  const level = riskLevelFromCode(r.level)
  if (!level || typeof r.assessedAt !== 'string') return null
  const hours = Array.isArray(r.forecast?.hours) ? r.forecast.hours : []
  return {
    level,
    assessedAt: r.assessedAt,
    hours: hours
      .filter((h) => typeof h?.at === 'string' && riskLevelFromCode(h.level))
      .map((h) => ({
        at: h.at,
        level: h.level,
        possibleLevel: typeof h.possibleLevel === 'number' ? h.possibleLevel : null,
      })),
  }
}
