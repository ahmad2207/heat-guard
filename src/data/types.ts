import type { RiskLevel } from '../lib/risk'

// The forecast hour shape is shared with the ForecastStrip component.
export type { ForecastHour } from '../components/ForecastStrip'
import type { ForecastHour } from '../components/ForecastStrip'

/* ---------- Shared ---------- */

export type Language = 'English' | 'Hausa' | 'Yoruba' | 'Igbo' | 'Pidgin'

export type CrewId = 'A' | 'B' | 'C' | 'D'

export type PrecautionLevelId = 'standard' | 'enhanced' | 'high'

export interface PrecautionLevelDefinition {
  id: PrecautionLevelId
  name: string
  hint: string
  /** What the supervisor dashboard shows. */
  supervisorText: string
  /** What the worker app shows. */
  workerText: string
  /** Work restrictions recorded by occupational health. */
  restriction: string
}

/* ---------- Worker ---------- */

export interface ConsentChoices {
  health: boolean
  band: boolean
  reports: boolean
}

export interface SharingChoices extends ConsentChoices {
  voice: boolean
}

export interface Worker {
  id: string
  crew: string
  task: string
  ageRange: string
  language: Language
  precaution: {
    level: PrecautionLevelId
    setBy: string
    setOn: string
    nextReview: string
    restrictions: string[]
  }
  /** Choices on the consent screen. */
  consent: ConsentChoices
  /** Choices on My data, which add "Read warnings aloud". */
  sharing: SharingChoices
}

export interface DataSource {
  label: string
  ok: boolean
}

export interface WorkerHazard {
  id: string
  icon: 'dust' | 'storm'
  title: string
  detail: string
}

export interface WorkerStatus {
  updatedAt: string
  dataSources: DataSource[]
  currentRiskLevel: RiskLevel
  nextBreak: { title: string; detail: string }
  water: { cupsToday: number; advice: string }
  reasons: string[]
  forecast: { title: string; confidence: string; hours: ForecastHour[] }
  hazards: WorkerHazard[]
}

export interface WhatToDoAction {
  id: string
  /** `watch` is a neutral warning icon; `unwell` and `urgent` use the red warning style. */
  icon: 'rest' | 'water' | 'cool' | 'lighter' | 'shift' | 'watch' | 'unwell' | 'urgent'
  title: string
  /** Second line under the title. One-line actions leave it out. */
  detail?: string
  /** The "Feel unwell?" action links to the report screen. */
  linksToReport?: boolean
}

/** What to do content for one risk level. */
export interface WhatToDoLevel {
  headline: string
  actions: WhatToDoAction[]
  why: string
  when: string
}

export interface WhatToDo {
  byLevel: Record<RiskLevel, WhatToDoLevel>
  /** Who the advice is for, by the worker's level compared with their crew's current level. */
  who: { above: string; same: string; below: string }
  warningSigns: { title: string; text: string }
  confirmedText: string
}

export interface SymptomReportContent {
  emergency: { title: string; text: string; phoneLabel: string; phoneNumber: string }
  symptoms: Array<{ id: string; label: string }>
  sentTitle: string
  sentText: string
  privacy: string
}

export interface FieldModeContent {
  connection: { title: string; detail: string }
  band: { title: string; detail: string }
  battery: { title: string; detail: string }
  assumedLevel: RiskLevel
  safetyText: string
  lastKnown: string
  standardPlan: string[]
  savedForecast: { title: string; note: string; hours: ForecastHour[] }
}

export interface DataAccessEntry {
  id: string
  who: string
  detail: string
}

/* ---------- Supervisor ---------- */

export interface Site {
  name: string
  shift: string
  hours: string
  workersOnShift: number
}

export interface ClimateHazard {
  id: string
  icon: 'dust' | 'storm'
  title: string
  severity: 'Moderate' | 'Possible'
  detail: string
}

export interface SystemHealthRow {
  id: string
  title: string
  detail: string
  value: string
  status: 'ok' | 'check'
}

export type NeedsAttentionAlert =
  | {
      id: string
      kind: 'symptom'
      title: string
      meta: string
      text: string
      actions: [string, string]
    }
  | {
      id: string
      kind: 'crew-risk'
      level: RiskLevel
      title: string
      meta: string
      why: string
      do: string
      actions: [string, string]
    }
  | {
      id: string
      kind: 'precaution'
      title: string
      meta: string
      do: string
      note: string
      actions: [string, string]
    }

export interface ActionToday {
  id: string
  title: string
  meta: string
  status: 'done' | 'acknowledged' | 'pending'
}

export interface Figure {
  value: string
  label: string
}

export interface CrewRow {
  id: CrewId
  name: string
  activity: string
  workload: string
  ppe: string
  workers: number
  now: RiskLevel
  peak: { level: RiskLevel; possible?: boolean }
  nextAction: string
}

export interface DayBar {
  day: string
  hours: number
}

/** H heavy, M moderate, L light or shaded, B break. One letter per hour. */
export type TaskType = 'H' | 'M' | 'L' | 'B'

export interface PlanCrew {
  id: CrewId
  name: string
  meta: string
}

export interface MeasureCard {
  id: string
  title: string
  value: string
  summary: string
  detail: string
}

export interface Bar {
  label: string
  value: number
}

/* ---------- Occupational health ---------- */

export interface Escalation {
  workerId: string
  crew: string
  reportedAt: string
  symptoms: string
  conditions: string
  firstAid: string
  outcomes: string[]
  outcomeNote: string
}

export interface ProfileToReview {
  workerId: string
  crew: string
  reason: string
  open?: boolean
}

export interface OhProfile {
  workerId: string
  crew: string
  task: string
  consent: string
  recorded: string[]
  recordedNote: string
  level: PrecautionLevelId
}
