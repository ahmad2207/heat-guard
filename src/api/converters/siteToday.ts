import type { ForecastHour } from '../../components/ForecastStrip'
import type {
  ActionToday,
  ClimateHazard,
  CrewRow,
  DayBar,
  Figure,
  SystemHealthRow,
} from '../../data/types'
import { formatDate, formatTime, getSiteTimeZone } from '../../lib/format'
import { riskName, type RiskLevel } from '../../lib/risk'
import type { SiteTodayResponse } from '../types/responses'
import { confidenceFromCode } from './confidence'
import { riskLevelFromCode } from './risk'
import { crewNames, supervisorActionText } from './supervisorActions'

/** One "Needs attention" card. Worker codes only, never the worker UUID or any health reason. */
export type AttentionItem =
  | {
      kind: 'help'
      id: string
      helpKind: 'first_aid_alert' | 'symptom_report'
      workerCode: string
      crewName: string
      /** "open" or "acknowledged". */
      status: string
      time: string
      acknowledgedAt: string | null
    }
  | {
      kind: 'critical'
      id: string
      workerCode: string
      crewName: string
      status: string
      time: string
    }
  | {
      kind: 'crew_risk'
      id: string
      crewName: string
      activity: string
      level: RiskLevel
      highOrAbove: number
      due: string | null
      doText: string
      status: string
      time: string
    }
  | {
      kind: 'worker_care'
      id: string
      workerCode: string
      crewName: string
      need: 'reduced_exposure' | 'earlier_breaks'
      status: string
      time: string
    }

export interface TodayView {
  siteName: string
  /** "Day shift · 07:00 to 17:00 · 29 workers on shift" */
  subtitle: string
  /** "Updated 13:04 · WBGT estimated from weather data" for the header. */
  status: string
  shifts: string[]
  /** The activities of the crews on this page, for the activity filter. */
  activities: Array<{ code: string; name: string }>
  siteHeat: {
    /** null when the backend has no current reading: never guessed. */
    level: RiskLevel | null
    wbgt: string
    wbgtNote: string
    peak: { title: string; text: string } | null
    hours: ForecastHour[]
    note: string
  }
  workersByLevel: { levels: Array<{ level: RiskLevel; count: number }>; noRecentData: number }
  hazards: ClimateHazard[]
  hazardsSource: string
  systemHealth: SystemHealthRow[]
  needsAttention: { open: number; items: AttentionItem[] }
  actionsToday: { done: number; total: number; actions: ActionToday[] }
  todaySoFar: Figure[]
  crews: CrewRow[]
  peakLabel: string
  last7Days: DayBar[]
  last7Summary: string
}

type Today = Partial<SiteTodayResponse> & Record<string, unknown>
type Obj = Record<string, unknown>

const obj = (value: unknown): Obj => (value && typeof value === 'object' ? (value as Obj) : {})
const list = (value: unknown): Obj[] => (Array.isArray(value) ? value.map(obj) : [])
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const str = (value: unknown) => (typeof value === 'string' ? value : '')

/** "very_heavy" becomes "Very heavy". Codes are never shown as they are. */
function words(code: unknown): string {
  const text = str(code).replace(/[_-]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

/**
 * The activity name to show: only the part before " / " ("Manual excavation / digging" shows
 * "Manual excavation"). Falls back to the code in words.
 */
export function activityName(name: unknown, code: unknown): string {
  const full = str(name).split(' / ')[0].trim()
  return full || words(code)
}

const PPE_TEXT: Record<string, string> = {
  standard: 'Standard',
  coverall: 'Coveralls',
  coveralls: 'Coveralls',
}
function ppeText(ppe: unknown): string {
  const p = obj(ppe)
  const items = Array.isArray(p.items) ? p.items : []
  if (items.some((item) => /weld/.test(String(item)))) return 'Welding PPE'
  return PPE_TEXT[str(p.engineClass)] ?? words(p.engineClass)
}

/** The level and whether it is only possible: a higher possible level shows as that level, "?". */
function shown(level: unknown, possibleLevel: unknown): { level: RiskLevel; possible?: boolean } {
  const base = riskLevelFromCode(level) ?? 1
  const possible = riskLevelFromCode(possibleLevel)
  return possible && possible > base ? { level: possible, possible: true } : { level: base }
}

function minutesText(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`
}

/** Weekday from the day's start, in the site timezone ("Mon"). */
function weekday(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: getSiteTimeZone(), weekday: 'short' }).format(
    date,
  )
}

export function todayViewFromApi(body: unknown): TodayView {
  const t = obj(body) as Today
  const site = obj(t.site)
  const shift = obj(t.shift)
  const crewsById = new Map(list(t.crews).map((c) => [str(c.crewId), c]))
  const crewName = (id: unknown) => str(crewsById.get(str(id))?.name) || 'Crew'

  // Header
  const shiftHours = [formatTime(str(shift.start)), formatTime(str(shift.end))].filter(Boolean)
  const subtitle = [
    str(shift.name),
    shiftHours.length === 2 ? `${shiftHours[0]} to ${shiftHours[1]}` : '',
    `${num(t.workersOnShift)} workers on shift`,
  ]
    .filter(Boolean)
    .join(' · ')
  const heat = obj(t.siteHeat)
  const now = obj(heat.now)
  const method = str(now.wbgtMethod)
  const updated = formatTime(str(t.updatedAt))
  const status = [
    updated && `Updated ${updated}`,
    method === 'estimated'
      ? 'WBGT estimated from weather data'
      : method && `WBGT ${words(method).toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(' · ')

  // Site heat
  const peak = obj(heat.peak)
  const peakLevel = riskLevelFromCode(peak.level)
  const peakFrom = formatTime(str(peak.from))
  const peakTo = formatTime(str(peak.to))
  const confidence = confidenceFromCode(peak.confidence)
  const peakView =
    peakLevel && peakFrom
      ? {
          title: peakTo
            ? `Peak expected ${peakFrom} to ${peakTo}`
            : `Peak expected from ${peakFrom}`,
          text:
            (peak.possible === true
              ? `May reach ${riskName(peakLevel)}.`
              : `Expected to reach ${riskName(peakLevel)}.`) +
            (confidence ? ` Confidence ${confidence}.` : ''),
        }
      : null
  const hours = list(heat.hours)
    .map((h): ForecastHour | null => {
      const time = formatTime(str(h.hourStart)).slice(0, 2)
      if (!time) return null
      return { time, ...shown(h.level, h.possibleLevel), ...(h.now === true ? { now: true } : {}) }
    })
    .filter((h): h is ForecastHour => h !== null)
  const reference = obj(heat.reference)
  const workload = str(reference.workload).replace(/_/g, ' ') || 'moderate'
  const clothing = PPE_TEXT[str(reference.ppe)]?.toLowerCase() ?? 'standard'
  const note =
    (hours.some((h) => h.possible) ? '"4?" means Critical is possible but not certain. ' : '') +
    `Levels shown are for ${workload} work in ${clothing === 'coveralls' ? 'coveralls' : `${clothing} clothing`}.`

  // Workers by level
  const d = obj(t.distribution)
  const workersByLevel = {
    levels: [
      { level: 4 as RiskLevel, count: num(d.critical) },
      { level: 3 as RiskLevel, count: num(d.high) },
      { level: 2 as RiskLevel, count: num(d.elevated) },
      { level: 1 as RiskLevel, count: num(d.low) },
    ],
    noRecentData: num(d.noRecentData),
  }

  // Hazards
  const hazards = list(t.hazards)
    .map((h, index): ClimateHazard | null => {
      const from = formatTime(str(h.from))
      const to = formatTime(str(h.to))
      const when = from && to ? ` ${from} to ${to}` : from ? ` from ${from}` : ''
      if (h.type === 'dust' && (h.severity === 'moderate' || h.severity === 'high')) {
        return {
          id: `dust-${index}`,
          icon: 'dust',
          title: `Dust and air quality${when}`,
          severity: h.severity === 'high' ? 'High' : 'Moderate',
          detail: 'Masks for drivers and outdoor crews. Extra eye-rinse stations.',
        }
      }
      if (h.type === 'thunderstorm') {
        return {
          id: `storm-${index}`,
          icon: 'storm',
          title: `Thunderstorms${when}`,
          severity: 'Possible',
          detail: 'Plan to stop crane and work at height. Secure loose materials before it starts.',
        }
      }
      return null
    })
    .filter((h): h is ClimateHazard => h !== null)

  // System health
  const health = obj(t.systemHealth)
  const weather = obj(health.weatherFeed)
  const sensors =
    health.siteSensors === null || health.siteSensors === undefined ? null : obj(health.siteSensors)
  const apps = obj(health.workerApps)
  const wearables = obj(health.wearables)
  const notReporting = Math.max(0, num(apps.onShift) - num(apps.reporting))
  const systemHealth: SystemHealthRow[] = [
    {
      id: 'weather',
      title: 'Weather feed',
      detail: 'Updated every 15 min',
      value: formatTime(str(weather.lastAt)) || 'No data',
      status: weather.ok === true ? 'ok' : 'check',
    },
    sensors
      ? {
          id: 'sensors',
          title: 'Site sensors',
          detail: 'Last reading',
          value: formatTime(str(sensors.lastAt)) || 'No data',
          status: sensors.ok === true ? 'ok' : 'check',
        }
      : {
          id: 'sensors',
          title: 'Site sensors',
          detail: 'No site sensors',
          value: '',
          status: null,
        },
    {
      id: 'apps',
      title: 'Worker apps reporting',
      detail: [
        notReporting > 0 ? `${notReporting} not reporting, treated as High.` : 'All reporting.',
        num(apps.lowBattery) > 0 ? `${num(apps.lowBattery)} on low battery.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      value: `${num(apps.reporting)} of ${num(apps.onShift)}`,
      status: notReporting > 0 || num(apps.lowBattery) > 0 ? 'check' : 'ok',
    },
    ...(wearables.available === true
      ? [
          {
            id: 'wearables',
            title: 'Consented wearables',
            detail: 'Only risk levels reach this dashboard',
            value: `${num(wearables.connected)} connected`,
            status: 'ok' as const,
          },
        ]
      : []),
  ]

  // Needs attention
  const items = list(obj(t.needsAttention).items)
    .map((i): AttentionItem | null => {
      const time = formatTime(str(i.createdAt))
      const status = str(i.status) || 'open'
      const workerCode = str(i.workerCode)
      if (i.kind === 'help' && workerCode) {
        return {
          kind: 'help',
          id: str(i.helpRequestId),
          helpKind: i.helpKind === 'symptom_report' ? 'symptom_report' : 'first_aid_alert',
          workerCode,
          crewName: crewName(i.crewId),
          status,
          time,
          acknowledgedAt: formatTime(str(i.acknowledgedAt)) || null,
        }
      }
      if (i.kind === 'critical' && workerCode) {
        return {
          kind: 'critical',
          id: str(i.recommendationId),
          workerCode,
          crewName: crewName(i.crewId),
          status,
          time,
        }
      }
      if (i.kind === 'crew_risk') {
        const crew = crewsById.get(str(i.crewId))
        const name = crewName(i.crewId)
        return {
          kind: 'crew_risk',
          id: str(i.recommendationId),
          crewName: name,
          activity: activityName(crew?.activityName, i.activity),
          level: riskLevelFromCode(i.level) ?? 3,
          highOrAbove: num(i.highOrAbove),
          due: formatTime(str(i.dueAt)) || null,
          doText: crew ? supervisorActionText(obj(crew.nextAction).code, { crew: name }) : '',
          status,
          time,
        }
      }
      if (i.kind === 'worker_care' && workerCode) {
        return {
          kind: 'worker_care',
          id: str(i.recommendationId),
          workerCode,
          crewName: crewName(i.crewId),
          // The need only; the reason is never sent (D1).
          need: i.need === 'earlier_breaks' ? 'earlier_breaks' : 'reduced_exposure',
          status,
          time,
        }
      }
      return null
    })
    .filter((i): i is AttentionItem => i !== null && i.id !== '')

  // Actions today
  const a = obj(t.actionsToday)
  const actions = list(a.actions).map((action, index): ActionToday => {
    const crews = (Array.isArray(action.crewIds) ? action.crewIds : []).map((id) => crewName(id))
    const first = formatTime(str(action.firstAt))
    const due = formatTime(str(action.dueAt))
    const when = due ? `by ${due}` : first ? `from ${first}` : ''
    const state = str(action.status)
    return {
      id: `${str(action.code)}-${index}`,
      title: supervisorActionText(action.code, {
        crew: crewNames(crews),
        workerCount: num(action.workerCount),
      }),
      meta: [crewNames(crews), when].filter(Boolean).join(' · '),
      status:
        state === 'done' || state === 'implemented'
          ? 'done'
          : state === 'acknowledged'
            ? 'acknowledged'
            : 'pending',
    }
  })

  // Today so far
  const s = obj(t.todaySoFar)
  const warnings = obj(s.warnings)
  const followed = obj(s.actionsFollowed)
  const lead =
    typeof s.warningLeadMinutes === 'number' ? minutesText(s.warningLeadMinutes) : 'Not yet'
  const escalations = num(s.emergencyEscalations)
  const todaySoFar: Figure[] = [
    { value: lead, label: 'Warning lead time' },
    {
      value: `${num(warnings.notBorneOut)} of ${num(warnings.periods)}`,
      label:
        warnings.provisional === true
          ? 'Warnings not borne out (provisional)'
          : 'Warnings not borne out',
    },
    { value: `${num(followed.percent)}%`, label: 'Actions followed' },
    { value: String(num(s.symptomReports)), label: 'Symptom reports' },
    {
      value: String(escalations),
      label: escalations === 1 ? 'Emergency escalation' : 'Emergency escalations',
    },
    { value: minutesText(num(s.workTimePausedMinutes)), label: 'Work time paused' },
  ]

  // Crews
  const crews: CrewRow[] = list(t.crews).map((c) => {
    const next = obj(c.nextAction)
    const due = formatTime(str(next.dueAt))
    const action = next.code
      ? supervisorActionText(next.code, { crew: str(c.name) })
      : 'Routine breaks'
    const peakRow = obj(c.peak)
    return {
      id: str(c.crewId),
      name: str(c.name),
      activity: activityName(c.activityName, c.activity),
      workload: words(c.workload),
      ppe: ppeText(c.ppe),
      workers: num(c.workers),
      now: riskLevelFromCode(c.now),
      peak: shown(peakRow.level, peakRow.possibleLevel),
      nextAction: due ? `${action} · by ${due}` : action,
    }
  })

  // Last 7 days
  const days = list(t.last7Days)
  const onTime = days.reduce((sum, day) => sum + num(obj(day.actions).onTime), 0)
  const total = days.reduce((sum, day) => sum + num(obj(day.actions).total), 0)

  return {
    siteName: str(site.name),
    subtitle,
    status,
    shifts: list(t.shifts)
      .map((sh) => str(sh.name))
      .filter(Boolean),
    activities: [
      ...new Map(
        list(t.crews)
          .filter((c) => str(c.activity))
          .map((c) => [str(c.activity), activityName(c.activityName, c.activity)] as const),
      ),
    ]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    siteHeat: {
      level: riskLevelFromCode(now.level),
      wbgt: typeof now.wbgtC === 'number' ? `${now.wbgtC.toFixed(1)}°C` : 'No reading',
      wbgtNote: method ? `WBGT, ${words(method).toLowerCase()}` : 'WBGT',
      peak: peakView,
      hours,
      note,
    },
    workersByLevel,
    hazards,
    hazardsSource: updated
      ? `Source: weather forecast · ${formatTime(str(weather.lastAt)) || updated}`
      : 'Source: weather forecast',
    systemHealth,
    needsAttention: { open: num(obj(t.needsAttention).open), items },
    actionsToday: { done: num(a.done), total: num(a.total), actions },
    todaySoFar,
    crews,
    peakLabel: peakFrom && peakTo ? `Peak ${peakFrom} to ${peakTo}` : 'Peak today',
    last7Days: days.map((day) => ({
      day: weekday(str(day.dayStart)) || formatDate(str(day.date)),
      hours: num(day.hoursAtHighOrAbove),
    })),
    last7Summary: `Hours at High or above · actions done on time: ${onTime} of ${total}`,
  }
}
