import type { Bar, MeasureCard } from '../../data/types'

export type MeasurePeriod = '7d' | '30d' | 'season'

export const MEASURE_PERIOD_OPTIONS: Array<{ value: MeasurePeriod; label: string }> = [
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'season', label: 'This season' },
]

export const NOT_TRACKED = 'Not tracked yet'

export interface MeasuresView {
  cards: MeasureCard[]
  leadTimes: Bar[]
  byCrew: Bar[]
}

type Obj = Record<string, unknown>
const obj = (value: unknown): Obj => (value && typeof value === 'object' ? (value as Obj) : {})
const list = (value: unknown): Obj[] => (Array.isArray(value) ? value.map(obj) : [])
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** "1 h 35 m", "40 m". */
function minutes(value: number): string {
  const h = Math.floor(value / 60)
  const m = Math.round(value % 60)
  if (h === 0) return `${m} m`
  return m === 0 ? `${h} h` : `${h} h ${m} m`
}

/** Whole hours, for lost work time ("41 h"). */
const hours = (value: number) => `${Math.round(value / 60)} h`

const BUCKETS: Record<string, string> = {
  under_30m: 'Under 30 min',
  '30_60m': '30 to 60 min',
  '1_2h': '1 to 2 h',
  '2_3h': '2 to 3 h',
  over_3h: 'Over 3 h',
}
function bucketLabel(code: string): string {
  if (BUCKETS[code]) return BUCKETS[code]
  const words = code.replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Other'
}

/**
 * GET /sites/{id}/measures as the page shows it. Figures the backend marks provisional carry a
 * "Provisional" badge; heat-related incidents that are not tracked yet say so.
 * crewNames maps crew IDs to names (the response has IDs only).
 */
export function measuresViewFromApi(body: unknown, crewNames: Map<string, string>): MeasuresView {
  const m = obj(body)
  const lead = obj(m.warningLeadTime)
  const falseAlarms = obj(m.falseAlarms)
  const missed = obj(m.missedWarnings)
  const actions = obj(m.actionsFollowed)
  const symptoms = obj(m.symptomsAndIncidents)
  const escalations = obj(m.emergencyEscalations)
  const lost = obj(m.lostWorkTime)
  const compliance = obj(m.compliance)
  const incidents = symptoms.heatIncidents
  const escalationCount = num(escalations.count)

  const cards: MeasureCard[] = [
    {
      id: 'lead-time',
      title: 'Warning lead time',
      value: isNum(lead.medianMinutes) ? minutes(lead.medianMinutes) : 'No data yet',
      summary: 'Median',
      detail:
        'Time from a warning to conditions reaching that level, forecast against observed WBGT.',
      provisional: lead.provisional === true,
    },
    {
      id: 'false-alarms',
      title: 'False alarms',
      value: `${num(falseAlarms.percent)}%`,
      summary: `${num(falseAlarms.count)} of ${num(falseAlarms.of)} warnings`,
      detail: 'Warnings where conditions stayed below the forecast level.',
      provisional: falseAlarms.provisional === true,
    },
    {
      id: 'missed',
      title: 'Missed warnings',
      value: String(num(missed.count)),
      summary: `of ${num(missed.ofHighPeriods)} High or Critical periods`,
      detail: 'Periods that reached High or above with no warning issued first.',
      provisional: missed.provisional === true,
    },
    {
      id: 'actions',
      title: 'Actions followed',
      value: `${num(actions.percent)}%`,
      summary: `${num(actions.done)} of ${num(actions.total)} actions`,
      detail: 'Share of recommended controls marked Done or confirmed on time.',
    },
    {
      id: 'symptoms',
      title: 'Symptoms and incidents',
      value: isNum(incidents)
        ? `${num(symptoms.symptomReports)} · ${incidents}`
        : String(num(symptoms.symptomReports)),
      summary: isNum(incidents)
        ? 'Symptom reports · heat-related incidents'
        : `Symptom reports · heat-related incidents: ${NOT_TRACKED.toLowerCase()}`,
      detail: 'From worker reports and incident logs, by crew and risk level.',
    },
    {
      id: 'escalations',
      title: 'Emergency escalations',
      value: String(escalationCount),
      summary:
        escalationCount === 0
          ? 'None in this period'
          : `${num(escalations.acknowledgedWithin10Min)} of ${escalationCount} answered within 10 min`,
      detail: 'Emergency button use, first-aider alerts and emergency calls.',
    },
    {
      id: 'lost-time',
      title: 'Lost work time',
      value: hours(num(lost.pausedMinutes)),
      summary: `Rest and pauses, of ${hours(num(lost.scheduledMinutes))} scheduled`,
      detail: 'Heat-related breaks and work pauses, reported against total crew hours.',
    },
    {
      id: 'compliance',
      title: 'Compliance',
      value: isNum(compliance.percent) ? `${compliance.percent}%` : 'No data yet',
      summary: `${num(compliance.shiftsMeetingPlan)} of ${num(compliance.shifts)} shifts meeting the site heat plan`,
      detail: 'Break schedules and pause rules met, per crew and shift.',
      provisional: compliance.provisional === true,
    },
  ]

  return {
    cards,
    leadTimes: list(m.leadTimeHistogram).map((b) => ({
      label: bucketLabel(String(b.bucket ?? '')),
      value: num(b.count),
    })),
    byCrew: list(actions.byCrew).map((c) => ({
      label: c.grouped === true ? 'Small crews' : (crewNames.get(String(c.crewId)) ?? 'Crew'),
      value: num(c.percent),
    })),
  }
}
