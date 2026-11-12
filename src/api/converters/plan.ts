import type { TaskType } from '../../data/types'
import { formatTime } from '../../lib/format'
import type { RiskLevel } from '../../lib/risk'
import { riskLevelFromCode } from './risk'

/** One hour column of the plan: its label and the site heat (null when there is no reading). */
export interface PlanHour {
  label: string
  level: RiskLevel | null
  /** The level shown is only possible, not certain ("4?"). */
  possible: boolean
}

export interface PlanCrewRow {
  id: string
  name: string
  /** "Concrete work · 8 · standard PPE". */
  meta: string
}

export interface PlanVersion {
  /** One task per hour, by crew ID. */
  tasks: Record<string, TaskType[]>
  /** "crewId:hour" for every too-hot cell, as the backend decided. */
  tooHot: Set<string>
  tooHotCrewHours: number
  workingCrewHours: number
}

export interface PlanView {
  status: string
  /** "16:03" when the plan was last sent, or empty. */
  sentAt: string
  hours: PlanHour[]
  crews: PlanCrewRow[]
  current: PlanVersion
  suggested: PlanVersion
  workersNeedingReducedExposure: number
  /** The backend's too-hot rule, for the edit preview only: heavy work from this level, moderate from this. */
  rule: { heavyFrom: number; moderateFrom: number }
  /** "07:00 to 17:00". */
  span: string
}

type Obj = Record<string, unknown>
const obj = (value: unknown): Obj => (value && typeof value === 'object' ? (value as Obj) : {})
const list = (value: unknown): Obj[] => (Array.isArray(value) ? value.map(obj) : [])
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const str = (value: unknown) => (typeof value === 'string' ? value : '')
const TASKS: TaskType[] = ['H', 'M', 'L', 'B']

export const cellKey = (crewId: string, hour: number) => `${crewId}:${hour}`

function words(code: string): string {
  const text = code.replace(/[_-]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

function ppeText(items: unknown): string {
  const ppe = (Array.isArray(items) ? items : []).map(String)
  if (ppe.some((item) => /weld/.test(item))) return 'welding PPE'
  if (ppe.some((item) => /coverall/.test(item))) return 'coveralls'
  return 'standard PPE'
}

function version(value: unknown, crews: PlanCrewRow[], hourCount: number): PlanVersion {
  const v = obj(value)
  const raw = obj(v.tasks)
  const tasks: Record<string, TaskType[]> = {}
  for (const crew of crews) {
    const row = Array.isArray(raw[crew.id]) ? (raw[crew.id] as unknown[]) : []
    // Unknown letters show as Light; missing hours too, so every row is as long as the plan.
    tasks[crew.id] = Array.from({ length: hourCount }, (_, i) =>
      TASKS.includes(row[i] as TaskType) ? (row[i] as TaskType) : 'L',
    )
  }
  return {
    tasks,
    tooHot: new Set(list(v.tooHotCells).map((cell) => cellKey(str(cell.crewId), num(cell.hour)))),
    tooHotCrewHours: num(v.tooHotCrewHours),
    workingCrewHours: num(v.workingCrewHours),
  }
}

/** GET, PUT /sites/{id}/plan and POST .../send all return this shape. */
export function planViewFromApi(body: unknown): PlanView {
  const p = obj(body)
  const hoursRaw = list(p.hours)
  const hours: PlanHour[] = hoursRaw.map((h) => {
    const level = riskLevelFromCode(h.level)
    const possibleLevel = riskLevelFromCode(h.possibleLevel)
    const higher = possibleLevel !== null && (level === null || possibleLevel > level)
    return {
      label: str(h.label) || formatTime(str(h.start)),
      level: higher ? possibleLevel : level,
      possible: higher,
    }
  })
  const crews: PlanCrewRow[] = list(p.crews)
    .filter((c) => str(c.crewId))
    .map((c) => ({
      id: str(c.crewId),
      name: str(c.name) || 'Crew',
      meta: [words(str(c.activity)), String(num(c.workers)), ppeText(c.ppe)]
        .filter(Boolean)
        .join(' · '),
    }))
  const lastStart = str(hoursRaw[hoursRaw.length - 1]?.start)
  const end = lastStart ? formatTime(new Date(Date.parse(lastStart) + 60 * 60_000)) : ''
  const rule = obj(p.rule)
  return {
    status: str(p.status),
    sentAt: formatTime(str(p.sentAt)),
    hours,
    crews,
    current: version(p.current, crews, hours.length),
    suggested: version(p.suggested, crews, hours.length),
    workersNeedingReducedExposure: num(p.workersNeedingReducedExposure),
    rule: { heavyFrom: num(rule.heavyFrom) || 3, moderateFrom: num(rule.moderateFrom) || 4 },
    span: hours.length > 0 && end ? `${hours[0].label} to ${end}` : '',
  }
}

/** The edit preview only: the backend's rule applied on the phone. Saved numbers come from the backend. */
export function previewTooHot(task: TaskType, hour: PlanHour, rule: PlanView['rule']): boolean {
  if (hour.level === null) return false
  return (
    (task === 'H' && hour.level >= rule.heavyFrom) ||
    (task === 'M' && hour.level >= rule.moderateFrom)
  )
}

export function previewVersion(
  tasks: Record<string, TaskType[]>,
  view: Pick<PlanView, 'hours' | 'rule'>,
): PlanVersion {
  const tooHot = new Set<string>()
  let working = 0
  for (const [crewId, row] of Object.entries(tasks)) {
    row.forEach((task, i) => {
      if (task !== 'B') working++
      if (view.hours[i] && previewTooHot(task, view.hours[i], view.rule))
        tooHot.add(cellKey(crewId, i))
    })
  }
  return { tasks, tooHot, tooHotCrewHours: tooHot.size, workingCrewHours: working }
}

/**
 * "11:00 to 14:00 and 16:00" from hour indexes, using the plan's hour labels: a run of hours
 * reads "start to end", a single hour reads its own time (as in DECISIONS.md).
 */
function ranges(indexes: number[], hours: PlanHour[], end: string): string {
  const parts: string[] = []
  let start = -1
  indexes.forEach((hour, i) => {
    if (start === -1) start = hour
    const next = indexes[i + 1]
    if (next !== hour + 1) {
      const to = hours[hour + 1]?.label ?? end
      parts.push(hour === start || !to ? hours[start].label : `${hours[start].label} to ${to}`)
      start = -1
    }
  })
  return parts.join(' and ')
}

/**
 * "What the suggested plan changes", written by the app by comparing the current and suggested
 * tasks per crew (DECISIONS.md). For example "heavy work moved out of 11:00 to 14:00 and into
 * 16:00 to 17:00". Crews without changes are left out.
 */
export function planChanges(view: PlanView): Array<{ who: string; text: string }> {
  const end = view.span.split(' to ')[1] ?? ''
  const changes: Array<{ who: string; text: string }> = []
  for (const crew of view.crews) {
    const now = view.current.tasks[crew.id] ?? []
    const next = view.suggested.tasks[crew.id] ?? []
    const hoursWhere = (test: (a: TaskType, b: TaskType) => boolean) =>
      now.map((task, i) => (test(task, next[i]) ? i : -1)).filter((i) => i >= 0)
    const heavyOut = hoursWhere((a, b) => a === 'H' && b !== 'H')
    const heavyIn = hoursWhere((a, b) => a !== 'H' && b === 'H')
    const breaksIn = hoursWhere((a, b) => a !== 'B' && b === 'B')
    const breaksOut = hoursWhere((a, b) => a === 'B' && b !== 'B')
    const lighter = hoursWhere((a, b) => a === 'M' && b === 'L')
    // "at 14:00" for one hour, "from 11:00 to 14:00" for a run of hours.
    const during = (indexes: number[]) => {
      const text = ranges(indexes, view.hours, end)
      return indexes.length === 1 ? `at ${text}` : `from ${text}`
    }
    const parts: string[] = []
    if (heavyOut.length && heavyIn.length) {
      parts.push(
        `heavy work moved out of ${ranges(heavyOut, view.hours, end)} and into ${ranges(heavyIn, view.hours, end)}`,
      )
    } else if (heavyOut.length) {
      parts.push(`no heavy work ${during(heavyOut)}`)
    } else if (heavyIn.length) {
      parts.push(`heavy work added ${during(heavyIn)}`)
    }
    if (lighter.length) parts.push(`lighter tasks ${during(lighter)}`)
    if (breaksIn.length) parts.push(`extra break ${during(breaksIn)}`)
    if (breaksOut.length) parts.push(`no break ${during(breaksOut)}`)
    if (parts.length === 0 && now.some((task, i) => task !== next[i]))
      parts.push('tasks rearranged')
    if (parts.length) {
      const text = parts.join('; ')
      changes.push({ who: crew.name, text: `${text.charAt(0).toUpperCase()}${text.slice(1)}.` })
    }
  }
  return changes
}
