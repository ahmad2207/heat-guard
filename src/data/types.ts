import type { RiskLevel } from '../lib/risk'

// The forecast hour shape is shared with the ForecastStrip component.
export type { ForecastHour } from '../components/ForecastStrip'
import type { ForecastHour } from '../components/ForecastStrip'

/* ---------- Shared ---------- */

export type Language = 'English' | 'Hausa' | 'Yoruba' | 'Igbo' | 'Pidgin'

/** A crew ID. Sample data uses A to D; in api mode IDs and names come from the backend. */
export type CrewId = string

export type PrecautionLevelId = 'standard' | 'enhanced' | 'high'

export interface PrecautionLevelDefinition {
  id: PrecautionLevelId
  name: string
  /** What the worker app shows. */
  workerText: string
  /** The worker's restriction text for this level. */
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
  /** Shown after "Alert first aider" is pressed. */
  alertedText: string
  symptoms: Array<{ id: string; label: string }>
  noteLabel: string
  notePlaceholder: string
  /** Send button label when nothing is ticked and the note is empty. */
  sendDisabledLabel: string
  sentTitle: string
  sentText: string
  /** Shown instead of sentText when symptom sharing is off (decision D5). */
  sentTextNoDetails: string
  privacy: string
}

export interface FieldModeContent {
  connection: { title: string; detail: string }
  band: { title: string; detail: string }
  /** Sample battery state, used when the browser cannot report the real battery. */
  battery: { title: string; detail: string }
  /** Real battery at or below this percent, and not charging, shows battery saver as on. */
  batterySaverAt: number
  /** Detail line for a real battery above the saver level. */
  batteryNormalDetail: string
  reconnect: { idle: string; checking: string; failed: string }
  backOnline: string
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

/** Every alert belongs to a crew, so the crew and activity filters can apply to it. */
export type NeedsAttentionAlert =
  | {
      id: string
      kind: 'symptom'
      crew: CrewId
      /** The worker whose escalation outcome, if any, is shown on the card. */
      workerId: string
      title: string
      meta: string
      text: string
      actions: [string, string]
    }
  | {
      id: string
      kind: 'crew-risk'
      crew: CrewId
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
      crew: CrewId
      /** The worker whose saved precaution level this alert follows. */
      workerId: string
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

/* ---------- Precaution levels ---------- */

/** A worker's precaution level. */
export interface PrecautionRecord {
  level: PrecautionLevelId
  /** Shown as "Set on 12 Oct". Empty when the worker is on standard precautions by default. */
  setOn: string
  nextReview?: string
}

/* ---------- Consent, health profile and My data (screens 1, 2 and 6) ---------- */

export interface ChoiceOption {
  id: string
  label: string
  hint?: string
}

/** The worker's health profile answers. Every question is optional. */
export interface HealthProfileAnswers {
  ageRange: string
  conditions: string[]
  heatIllness: string | null
  medicines: string[]
  acclimatisation: string | null
}

export interface SwitchContent {
  id: keyof SharingChoices
  label: string
  description: string
}

export interface OnboardingContent {
  steps: { current: number; total: number; label: string }
  heading: string
  intro: string
  workDetails: { title: string; detail: string; badge: string }
  switches: SwitchContent[]
  promiseTitle: string
  promise: string
  agree: string
  saving: string
  privacyLink: string
}

export interface HealthProfileContent {
  title: string
  intro: string
  sharingOffNote: { before: string; link: string; after: string }
  about: {
    title: string
    workerIdLabel: string
    ageLabel: string
    /** First option of the select when the question has no answer yet. */
    ageNotAnswered: string
    ageOptions: string[]
    why: string
  }
  conditions: { title: string; intro: string; options: ChoiceOption[] }
  heatIllness: { title: string; intro: string; options: ChoiceOption[] }
  medicines: { title: string; intro: string; options: ChoiceOption[]; footnote: string }
  acclimatisation: {
    title: string
    intro: string
    options: ChoiceOption[]
    footnote: string
    /** Decision D4: this answer feeds the work record, so it is tagged and explained. */
    sharedTag: string
    sharedNote: string
  }
  precautions: { title: string; intro: string }
  send: string
  skip: string
  footnote: string
  sentText: string
  saving: string
  consentNeeded: { before: string; link: string; after: string }
  goToStatus: string
}
