/**
 * SAMPLE DATA for the prototype, to be replaced by the risk engine.
 *
 * Every number and label is copied from design-reference/ (screens, html and source).
 * [SITE NAME] and [EMERGENCY NO.] are placeholders from the design.
 */
import type { RiskLevel } from '../lib/risk'
import type {
  ActionToday,
  Bar,
  ClimateHazard,
  CrewRow,
  DataAccessEntry,
  DayBar,
  Escalation,
  FieldModeContent,
  Figure,
  ForecastHour,
  Language,
  MeasureCard,
  NeedsAttentionAlert,
  OhProfile,
  PlanCrew,
  PrecautionLevelDefinition,
  PrecautionLevelId,
  ProfileToReview,
  Site,
  SymptomReportContent,
  SystemHealthRow,
  TaskType,
  WhatToDo,
  Worker,
  WorkerStatus,
  CrewId,
} from './types'

/* =========================================================================
 * Shared
 * ========================================================================= */

export const LANGUAGES: Language[] = ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin']

export const SITE: Site = {
  name: '[SITE NAME]',
  shift: 'Day shift',
  hours: '07:00 to 17:00',
  workersOnShift: 29,
}

/** From design-reference/source/OccHealth.dc.html. */
export const PRECAUTION_LEVELS: Record<PrecautionLevelId, PrecautionLevelDefinition> = {
  standard: {
    id: 'standard',
    name: 'Standard precautions',
    hint: 'Same advice as the rest of the crew.',
    supervisorText: 'No extra action needed.',
    workerText: 'You follow your crew’s heat plan.',
    restriction: 'None.',
  },
  enhanced: {
    id: 'enhanced',
    name: 'Enhanced precautions',
    hint: 'Earlier warnings and extra breaks.',
    supervisorText: 'Earlier breaks at level 3 and above.',
    workerText: 'You will get warnings earlier and extra break reminders.',
    restriction: 'Extra 10 min break each hour at level 3 and above.',
  },
  high: {
    id: 'high',
    name: 'High-priority precautions',
    hint: 'Conservative exposure, set by a professional.',
    supervisorText:
      'Reduce exposure today: shaded or lighter duty at level 3 and above, break every 30 min.',
    workerText:
      'Your plan includes lighter or shaded work in hot hours and a break every 30 minutes.',
    restriction:
      'No heavy work at level 3 and above. Recovery break every 30 min. Review in 4 weeks.',
  },
}

/* =========================================================================
 * Worker (screens 1 to 7)
 * ========================================================================= */

/*
 * W-0412 is on High-priority precautions on every screen. Screens read the level from
 * WORKER.precaution.level and the wording from PRECAUTION_LEVELS.
 */
export const WORKER: Worker = {
  id: 'W-0412',
  crew: 'Crew C',
  task: 'welding',
  ageRange: '40 to 54',
  language: 'English',
  precaution: {
    level: 'high',
    setBy: 'occupational health',
    setOn: '12 Oct',
    nextReview: '9 Nov',
    restrictions: [
      'No heavy work at level 3 and above',
      'Recovery break every 30 min at level 3 and above',
    ],
  },
  // 01-consent: health on, band off, symptom reports on.
  consent: { health: true, band: false, reports: true },
  // 06-my-data: everything on except reading warnings aloud.
  sharing: { health: true, band: true, reports: true, voice: false },
}

/**
 * Starting level for worker Home. The dev panel can change it.
 * W-0412 is at level 3 while Crew C is at level 2: their personal precautions raise their level.
 */
export const CURRENT_RISK_LEVEL: RiskLevel = 3

/** Worker content describes W-0412's own work in Crew C (welding, welding PPE). */
export const WORKER_STATUS: WorkerStatus = {
  updatedAt: '10:32',
  dataSources: [
    { label: 'Weather', ok: true },
    { label: 'Site sensor', ok: true },
    { label: 'Your band', ok: true },
  ],
  currentRiskLevel: CURRENT_RISK_LEVEL,
  nextBreak: { title: 'Next break in 12 min', detail: '15 min in the shaded rest area' },
  water: { cupsToday: 4, advice: 'Aim for a cup every 15 to 20 min' },
  reasons: [
    'Hot and humid',
    'Moderate work: welding',
    'Welding PPE holds heat',
    'Heart rate up 20 min (your band)',
    'Extra precautions on your profile',
  ],
  forecast: {
    title: 'Next 6 hours',
    confidence: 'Confidence: moderate',
    hours: [
      { time: '11:00', level: 3 },
      { time: '12:00', level: 3 },
      { time: '13:00', level: 4, possible: true },
      { time: '14:00', level: 4, possible: true },
      { time: '15:00', level: 3 },
      { time: '16:00', level: 2 },
    ],
  },
  hazards: [
    {
      id: 'dust',
      icon: 'dust',
      title: 'Dusty air',
      detail: 'Wear your dust mask outdoors. Rinse eyes at breaks.',
    },
    {
      id: 'storm',
      icon: 'storm',
      title: 'Storms possible after 16:00',
      detail: 'Stop work at height if you hear thunder. Your supervisor will confirm.',
    },
  ],
}

/** From design-reference/source/Alert.dc.html. */
export const WHAT_TO_DO: WhatToDo = {
  level: 3,
  headline: 'Your heat risk is high and likely to rise after 13:00',
  actions: [
    { id: 'rest', icon: 'rest', title: 'Rest', detail: '15 min in shade every 45 min' },
    {
      id: 'water',
      icon: 'water',
      title: 'Water',
      detail: 'A cup at every break, even if not thirsty',
    },
    {
      id: 'cool',
      icon: 'cool',
      title: 'Cool down',
      detail: 'Wet cloth on neck and arms during breaks. Keep welding PPE on while welding.',
    },
    {
      id: 'lighter',
      icon: 'lighter',
      title: 'Lighter work',
      detail: 'Ask your supervisor for lighter tasks until 15:00',
    },
    {
      id: 'shift',
      icon: 'shift',
      title: 'Shift change possible',
      detail: 'Welding may move to shaded prep work 12:00 to 15:00. Your supervisor will confirm.',
    },
    {
      id: 'unwell',
      icon: 'unwell',
      title: 'Feel unwell?',
      detail: 'Report it at once. A first aider will come to you.',
    },
  ],
  why: 'Welding in welding PPE on a hot, humid day makes your body heat up faster than it can cool. Your band shows your heart rate has been high for 20 minutes, and your profile asks for extra care.',
  when: 'Now until 15:00. Between 13:00 and 15:00 the risk may reach Critical (possible, not certain).',
  who: 'You and your crew. Your supervisor has the same advice for the whole crew.',
  warningSigns: {
    title: 'Stop and get help if you feel',
    text: 'Dizzy, confused, sick, very weak, or you stop sweating and your skin feels hot.',
  },
  confirmedText: 'Confirmed. Supervisor notified.',
}

/** From design-reference/source/Report.dc.html. */
export const SYMPTOM_REPORT: SymptomReportContent = {
  emergency: {
    title: 'Someone confused, fainted or not sweating with hot skin?',
    text: 'This is an emergency. Move them to shade, cool them with water and call for help.',
    phoneLabel: '[EMERGENCY NO.]',
    // Placeholder number used by the design's tel: link. Replace per site.
    phoneNumber: '112',
  },
  symptoms: [
    { id: 'headache', label: 'Headache' },
    { id: 'dizzy', label: 'Dizzy' },
    { id: 'thirst', label: 'Very thirsty' },
    { id: 'sick', label: 'Feel sick' },
    { id: 'cramps', label: 'Muscle cramps' },
    { id: 'weak', label: 'Very tired or weak' },
  ],
  sentTitle: 'Report sent',
  sentText:
    'Stop work and rest in the shade now. Your supervisor has been asked to check on you. If you feel worse, use the emergency buttons above.',
  privacy:
    'Your supervisor sees that you need help, not which symptoms you ticked. Details go to occupational health only.',
}

/** From design-reference/source/Offline.dc.html. */
export const FIELD_MODE: FieldModeContent = {
  connection: { title: 'No connection', detail: 'Last update 08:40 · 1 hr 52 min ago' },
  band: {
    title: 'Band disconnected',
    detail: 'Body signals paused. Weather-based advice continues.',
  },
  battery: {
    title: 'Battery 14% · saver on',
    detail: 'Screen dimmed, updates every 15 min. Alarms still sound.',
  },
  assumedLevel: 3,
  safetyText:
    'We cannot get new weather data, so HeatGuard is assuming high risk to keep you safe until it reconnects.',
  lastKnown: 'Last known level: Elevated at 08:40',
  standardPlan: [
    '15 min break in shade every 45 min',
    'Drink water at every break',
    'Avoid the heaviest work between 12:00 and 15:00',
    'Break alarms work offline. Critical alerts also come by SMS.',
  ],
  savedForecast: {
    title: 'Saved forecast',
    note: 'From 08:40, may be out of date',
    hours: [
      { time: '11:00', level: 3 },
      { time: '12:00', level: 3 },
      { time: '13:00', level: 4, possible: true },
      { time: '14:00', level: 3 },
    ],
  },
}

/**
 * From design-reference/source/Privacy.dc.html. The precaution level shown on My data comes from
 * WORKER.precaution, the same as every other screen.
 */
export const MY_DATA = {
  accessPeriod: 'Last 30 days',
  accessLog: [
    {
      id: 'nurse',
      who: 'Occupational health nurse',
      detail: 'Health details · 12 Oct · reviewed your precaution level',
    },
    { id: 'supervisor', who: 'Your supervisor', detail: 'Risk level and actions only · today' },
  ] satisfies DataAccessEntry[],
  promise:
    'Never used for discipline, rankings or job decisions. Health information is deleted 30 days after you leave the site.',
} as const

/* =========================================================================
 * Supervisor Today (screen 8)
 * ========================================================================= */

export const SUPERVISOR_HEADER_STATUS = {
  today: 'Updated 10:32 · WBGT estimated from weather data',
  plan: 'Forecast updated 10:30',
  initials: 'SU',
} as const

export const FILTERS = {
  crews: ['All crews', 'Crew A', 'Crew B', 'Crew C', 'Crew D'],
  activities: ['All activities', 'Excavation', 'Concrete work', 'Welding', 'Logistics'],
  shifts: ['Day shift', 'Night shift'],
} as const

export const SITE_HEAT_NOW = {
  level: 3 as RiskLevel,
  wbgt: '30.8°C',
  wbgtNote: 'WBGT, estimated',
  peak: {
    title: 'Peak expected 13:00 to 15:00',
    text: 'May reach Critical. Confidence moderate: forecast humidity is uncertain.',
  },
}

export const SITE_HEAT_BY_HOUR: ForecastHour[] = [
  { time: '07', level: 1 },
  { time: '08', level: 1 },
  { time: '09', level: 2 },
  { time: '10', level: 3, now: true },
  { time: '11', level: 3 },
  { time: '12', level: 3 },
  { time: '13', level: 4, possible: true },
  { time: '14', level: 4, possible: true },
  { time: '15', level: 3 },
  { time: '16', level: 2 },
  { time: '17', level: 2 },
]

export const SITE_HEAT_NOTE =
  '"4?" means Critical is possible but not certain. Levels shown are for moderate work in standard clothing.'

export const WORKERS_BY_LEVEL = {
  levels: [
    { level: 4 as RiskLevel, count: 0 },
    { level: 3 as RiskLevel, count: 9 },
    { level: 2 as RiskLevel, count: 12 },
    { level: 1 as RiskLevel, count: 6 },
  ],
  noRecentData: 2,
  note: 'Workers with no recent data are treated as High until their app reconnects.',
}

export const CLIMATE_HAZARDS: ClimateHazard[] = [
  {
    id: 'dust',
    icon: 'dust',
    title: 'Dust and air quality',
    severity: 'Moderate',
    detail: 'Masks for drivers and outdoor crews. Extra eye-rinse stations.',
  },
  {
    id: 'storm',
    icon: 'storm',
    title: 'Thunderstorms 16:00 to 18:00',
    severity: 'Possible',
    detail: 'Plan to stop crane and work at height. Secure loose materials by 15:30.',
  },
]
export const CLIMATE_HAZARDS_SOURCE = 'Source: weather forecast · 10:30'

export const SYSTEM_HEALTH: SystemHealthRow[] = [
  {
    id: 'weather',
    title: 'Weather feed',
    detail: 'Updated every 15 min',
    value: '10:30',
    status: 'ok',
  },
  {
    id: 'sensors',
    title: 'Site sensors',
    detail: 'Dust sensor at Block 2 offline since 09:12',
    value: '2 of 3',
    status: 'check',
  },
  {
    id: 'apps',
    title: 'Worker apps reporting',
    detail: '2 offline, treated as High. 3 on low battery.',
    value: '27 of 29',
    status: 'check',
  },
  {
    id: 'wearables',
    title: 'Consented wearables',
    detail: 'Only risk levels reach this dashboard',
    value: '11 connected',
    status: 'ok',
  },
]

/** Symptom report first, as SCREENS.md requires. */
export const NEEDS_ATTENTION: NeedsAttentionAlert[] = [
  {
    id: 'w0388-unwell',
    kind: 'symptom',
    title: 'Worker W-0388 reported feeling unwell',
    meta: 'Crew B · 10:21',
    text: 'Check on them now, move them to shade and stop their work. First aider notified and case escalated to the occupational health nurse.',
    actions: ['I am on my way', 'Mark resolved'],
  },
  {
    id: 'crew-b-high',
    kind: 'crew-risk',
    level: 3,
    title: 'Crew B, excavation: 7 workers at High',
    meta: 'Before 12:00',
    why: 'very heavy digging in coveralls, risk may reach Critical from 13:00.',
    do: 'finish heavy digging before 12:00, or move it to 16:00 and switch to lighter tasks until then.',
    actions: ['Acknowledge', 'Change shift timing'],
  },
  {
    id: 'w0412-precaution',
    kind: 'precaution',
    title: 'Worker W-0412 needs reduced exposure today',
    meta: 'Crew C · Now',
    do: 'reassign to shaded or lighter duty until 15:00 and add a recovery break every 30 min.',
    note: 'Health reasons are visible to occupational health only.',
    actions: ['Reassign', 'Acknowledge'],
  },
]
export const NEEDS_ATTENTION_OPEN = '3 open'

export const ACTIONS_TODAY: ActionToday[] = [
  {
    id: 'breaks',
    title: 'Extra 15 min breaks every 45 min',
    meta: 'Crews B and C · from 10:00',
    status: 'done',
  },
  {
    id: 'rest-area',
    title: 'Set up cooled rest area near Block 2',
    meta: 'Site · by 11:00',
    status: 'done',
  },
  {
    id: 'digging',
    title: 'Move heavy digging before 12:00',
    meta: 'Crew B · by 12:00',
    status: 'acknowledged',
  },
  {
    id: 'welders',
    title: 'Rotate welders to shaded tasks hourly',
    meta: 'Crew C · 12:00 to 15:00',
    status: 'pending',
  },
  {
    id: 'pause',
    title: 'Prepare to pause outdoor work if Critical',
    meta: 'All crews · 13:00 to 15:00',
    status: 'pending',
  },
]
export const ACTIONS_TODAY_SUMMARY = '2 of 5 done'
export const ACTIONS_TODAY_NOTE =
  'Actions keep PPE in place. HeatGuard never suggests removing protective equipment.'

export const TODAY_SO_FAR: Figure[] = [
  { value: '1 h 40 m', label: 'Warning lead time' },
  { value: '1 of 6', label: 'Warnings not borne out' },
  { value: '86%', label: 'Actions followed' },
  { value: '2', label: 'Symptom reports' },
  { value: '1', label: 'Emergency escalation' },
  { value: '3.5 h', label: 'Work time paused' },
]

export const CREWS: CrewRow[] = [
  {
    id: 'A',
    name: 'Crew A',
    activity: 'Concrete work',
    workload: 'Heavy',
    ppe: 'Standard',
    workers: 8,
    now: 2,
    peak: { level: 3 },
    nextAction: 'Shade breaks from 12:00',
  },
  {
    id: 'B',
    name: 'Crew B',
    activity: 'Excavation',
    workload: 'Very heavy',
    ppe: 'Coveralls',
    workers: 7,
    now: 3,
    peak: { level: 4, possible: true },
    nextAction: 'Heavy digging before 12:00',
  },
  {
    id: 'C',
    name: 'Crew C',
    activity: 'Welding',
    workload: 'Moderate',
    ppe: 'Welding PPE',
    workers: 6,
    now: 2,
    peak: { level: 3 },
    nextAction: 'Rotate to shaded tasks hourly',
  },
  {
    id: 'D',
    name: 'Crew D',
    activity: 'Site logistics',
    workload: 'Light',
    ppe: 'Standard',
    workers: 8,
    now: 1,
    peak: { level: 2 },
    nextAction: 'Routine breaks',
  },
]
export const CREWS_PEAK_LABEL = 'Peak 13:00 to 15:00'

export const LAST_7_DAYS: DayBar[] = [
  { day: 'Thu', hours: 3 },
  { day: 'Fri', hours: 4 },
  { day: 'Sat', hours: 2 },
  { day: 'Sun', hours: 0 },
  { day: 'Mon', hours: 5 },
  { day: 'Tue', hours: 6 },
  { day: 'Wed', hours: 4 },
]
export const LAST_7_DAYS_SUMMARY = 'Hours at High or above · actions done on time: 18 of 21'

export const SUPERVISOR_PRIVACY =
  'You see risk levels and actions, never health conditions, medicines or symptoms. Health information is not used for discipline, productivity rankings or employment decisions.'

/* =========================================================================
 * Shift plan (screen 9). Copied exactly from design-reference/source/Planner.dc.html.
 * ========================================================================= */

export const PLAN_TIMES = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16']

/** Site heat per hour. Level 4 hours are shown as "4?" (possible). */
export const PLAN_HEAT: RiskLevel[] = [1, 1, 2, 3, 3, 3, 4, 4, 3, 2]

export const PLANS: Record<'current' | 'suggested', Record<CrewId, string>> = {
  current: { A: 'HHHHBHHBMM', B: 'HHHHHBHHHB', C: 'MMMMBMMMBM', D: 'LLLLBLLBLL' },
  suggested: { A: 'HHHMBLLBMH', B: 'HHHMBLBLMH', C: 'MMMMBLBLMM', D: 'LLLLBLLBLL' },
}

export const PLAN_CREWS: PlanCrew[] = [
  { id: 'A', name: 'Crew A', meta: 'Concrete · 8 · standard PPE' },
  { id: 'B', name: 'Crew B', meta: 'Excavation · 7 · coveralls' },
  { id: 'C', name: 'Crew C', meta: 'Welding · 6 · welding PPE' },
  { id: 'D', name: 'Crew D', meta: 'Logistics · 8 · standard PPE' },
]

export const TASK_LABELS: Record<TaskType, string> = {
  H: 'Heavy',
  M: 'Moderate',
  L: 'Light',
  B: 'Break',
}

/** The "too hot" rule: heavy work at level 3 or above, or moderate work at level 4. */
export function isTooHot(task: TaskType, level: RiskLevel): boolean {
  return (task === 'H' && level >= 3) || (task === 'M' && level >= 4)
}

/** Crew-hours that are too hot, and crew-hours of work (not breaks), for a plan. */
export function countPlan(plan: Record<CrewId, string>): { tooHot: number; working: number } {
  let tooHot = 0
  let working = 0
  for (const crew of PLAN_CREWS) {
    plan[crew.id].split('').forEach((task, i) => {
      if (isTooHot(task as TaskType, PLAN_HEAT[i])) tooHot++
      if (task !== 'B') working++
    })
  }
  return { tooHot, working }
}

export const WORKERS_NEEDING_REDUCED_EXPOSURE = 2

export const PLAN_CHANGES = [
  {
    who: 'Crew B',
    text: 'Finish heavy digging by 10:00, switch to light shaded work through the peak, return to heavy work at 16:00.',
  },
  {
    who: 'Crew A',
    text: 'Pour concrete in the morning; formwork and finishing between 12:00 and 14:00.',
  },
  {
    who: 'Crew C',
    text: 'Rotate welders to shaded prep work 12:00 to 15:00, with a break at 13:00. Welding PPE stays on while welding.',
  },
  {
    who: 'Site',
    text: 'Thunderstorms possible from 16:00: end work at height by 15:30 and secure loose materials.',
  },
]

export const PLAN_SEND = {
  text: 'Each worker gets their own timings and breaks in their language, with an audio option. Workers on reduced exposure get their adjusted plan without anyone else seeing why.',
  sentText: 'Plan sent to 29 workers. Changes are tracked under Actions today.',
  note: 'HeatGuard suggests, you decide. Plans never require removing protective equipment, and are not used to judge individual productivity.',
}

/* =========================================================================
 * Measures (screen 10)
 * ========================================================================= */

export const MEASURE_PERIODS = ['Last 30 days', 'Last 7 days', 'This season']

export const MEASURES: MeasureCard[] = [
  {
    id: 'lead-time',
    title: 'Warning lead time',
    value: '1 h 35 m',
    summary: 'Median · rules-only baseline: 40 m',
    detail:
      'Time from a warning to conditions reaching that level, forecast against observed WBGT.',
  },
  {
    id: 'false-alarms',
    title: 'False alarms',
    value: '14%',
    summary: '6 of 42 warnings · baseline: 22%',
    detail: 'Warnings where conditions stayed below the forecast level.',
  },
  {
    id: 'missed',
    title: 'Missed warnings',
    value: '2',
    summary: 'of 38 High or Critical periods',
    detail: 'Periods that reached High or above with no warning issued first.',
  },
  {
    id: 'actions',
    title: 'Actions followed',
    value: '87%',
    summary: 'Worker confirmations and supervisor tracking',
    detail: 'Share of recommended controls marked Done or confirmed on time.',
  },
  {
    id: 'symptoms',
    title: 'Symptoms and incidents',
    value: '9 · 0',
    summary: 'Symptom reports · heat-related incidents',
    detail: 'From worker reports and incident logs, by crew and risk level.',
  },
  {
    id: 'escalations',
    title: 'Emergency escalations',
    value: '3',
    summary: 'All reached a first aider within 10 min',
    detail: 'Emergency button use, first-aider alerts and clinical referrals.',
  },
  {
    id: 'lost-time',
    title: 'Lost work time',
    value: '41 h',
    summary: 'Rest and pauses across all crews',
    detail: 'Heat-related breaks and work pauses, reported against total crew hours.',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    value: '96%',
    summary: 'Shifts meeting the site heat plan',
    detail: 'Break schedules and pause rules met, per crew and shift.',
  },
]

export const WARNING_LEAD_TIMES: Bar[] = [
  { label: 'Under 30 min', value: 4 },
  { label: '30 to 60 min', value: 7 },
  { label: '1 to 2 h', value: 15 },
  { label: '2 to 3 h', value: 10 },
  { label: 'Over 3 h', value: 6 },
]

/** Percent of actions followed. */
export const ACTIONS_BY_CREW: Bar[] = [
  { label: 'Crew A', value: 91 },
  { label: 'Crew B', value: 78 },
  { label: 'Crew C', value: 88 },
  { label: 'Crew D', value: 95 },
]

export const MEASURES_TEXT = {
  subtitle: '[SITE NAME] · all crews · compared with a rules-only baseline',
  leadTimesNote: 'Number of warnings by lead time, last 30 days',
  byCrewNote: 'Crew-level only. Crews under 5 workers are grouped.',
  insight:
    'Crew B is lowest: heavy digging was rarely moved to cooler hours. Consider earlier shift starts.',
  privacy:
    'Measures are shown for crews and sites only. Individual workers are never ranked or shown here. Results from simulated scenarios are labelled, and no real-world safety benefit is claimed without field evidence.',
}

/* =========================================================================
 * Occupational health (screen 11)
 * ========================================================================= */

export const OH_ESCALATION: Escalation = {
  workerId: 'W-0388',
  crew: 'Crew B',
  reportedAt: 'Reported 10:21',
  symptoms: 'Dizzy, very thirsty',
  conditions: 'Level 3 · heavy digging · coveralls',
  firstAid: 'Attended 10:24 · resting in shade',
  outcomes: ['Fit to return later today', 'Rest for the shift', 'Refer to clinic'],
  outcomeNote:
    'The supervisor will only see the outcome: back at work, resting, or referred. Never the symptoms or this note.',
}

export const PROFILES_TO_REVIEW: ProfileToReview[] = [
  {
    workerId: 'W-0412',
    crew: 'Crew C',
    reason: 'Worker updated health information · today',
    open: true,
  },
  { workerId: 'W-0377', crew: 'Crew A', reason: 'Worker requested a review · yesterday' },
  {
    workerId: 'W-0451',
    crew: 'Crew B',
    reason: 'New starter, not yet acclimatised · day 3 of 14',
  },
  { workerId: 'W-0290', crew: 'Crew D', reason: 'Restriction due to end · Friday' },
]
export const PROFILES_WAITING = '4 waiting'

export const OH_PROFILE: OhProfile = {
  workerId: 'W-0412',
  crew: 'Crew C',
  task: 'welding',
  consent:
    'Consent: health information yes · wearable band yes, since 01 Nov · can be withdrawn by the worker',
  recorded: [
    'Heart condition on file',
    'Medicine that affects hydration',
    'Acclimatised',
    'No past heat illness',
  ],
  recordedNote: 'Only factors with a clear link to heat risk are collected.',
  level: 'high',
}

export const OH_TEXT = {
  subtitle: '[SITE NAME] · health details on this page are never shown to supervisors or employers',
  savedText: 'Saved. The worker can see this decision and ask for a review.',
  privacy:
    'Every view of a health record is logged and visible to the worker. Health information cannot be exported to HR systems or used for discipline, productivity rankings or employment decisions.',
}
