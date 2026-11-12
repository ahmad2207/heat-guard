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
  WhatToDoAction,
  Worker,
  WorkerStatus,
  CrewId,
  OhOutcome,
  PrecautionRecord,
  HealthProfileAnswers,
  HealthProfileContent,
  OnboardingContent,
  SwitchContent,
} from './types'

/* =========================================================================
 * Shared
 * ========================================================================= */

export const LANGUAGES: Language[] = ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin']

/** SAMPLE: the site time the prototype starts at. Used by the demo clock in src/lib/clock.ts. */
export const SITE_TIME = '10:32'

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
 * W-0412 is on High-priority precautions on every screen. In mock mode screens read the level
 * from PRECAUTION_DEFAULTS (via precautionFor) and the wording from PRECAUTION_LEVELS.
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

/** Home "Why" reason shown only while the worker is on Enhanced or High-priority precautions. */
export const EXTRA_PRECAUTIONS_REASON = 'Extra precautions on your profile'

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
    EXTRA_PRECAUTIONS_REASON,
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

const FEEL_UNWELL: WhatToDoAction = {
  id: 'unwell',
  icon: 'unwell',
  title: 'Feel unwell?',
  detail: 'Report it at once. A first aider will come to you.',
  linksToReport: true,
}

const COOL_DOWN: WhatToDoAction = {
  id: 'cool',
  icon: 'cool',
  title: 'Cool down',
  detail: 'Wet cloth on neck and arms during breaks. Keep welding PPE on while welding.',
}

const DESIGN_WHEN =
  'Now until 15:00. Between 13:00 and 15:00 the risk may reach Critical (possible, not certain).'

/**
 * What to do, by risk level. Level 3 is the design (design-reference/source/Alert.dc.html),
 * adapted to W-0412's welding work. Levels 1, 2 and 4 are the approved prototype wording.
 * Actions never ask workers to remove protective equipment.
 */
export const WHAT_TO_DO: WhatToDo = {
  byLevel: {
    1: {
      headline: 'Your heat risk is low',
      actions: [
        { id: 'rest', icon: 'rest', title: 'Keep your normal breaks' },
        { id: 'water', icon: 'water', title: 'Drink a cup of water every 15 to 20 minutes' },
        {
          id: 'watch',
          icon: 'watch',
          title: 'Watch for warning signs: headache, dizziness or feeling sick',
        },
        { ...FEEL_UNWELL, detail: 'Report it at once.' },
      ],
      why: 'Conditions are manageable for your work right now, but heat can build quickly later in the day.',
      when: 'Until conditions change. HeatGuard will warn you early if they do.',
    },
    2: {
      headline: 'Heat is building. Take care now',
      actions: [
        { id: 'rest', icon: 'rest', title: 'Take every break on time, in the shade' },
        {
          id: 'water',
          icon: 'water',
          title: 'Drink a cup of water every 15 to 20 minutes, even if you are not thirsty',
        },
        { id: 'cool', icon: 'cool', title: 'Cool down at breaks: wet cloth on your neck and arms' },
        { id: 'watch', icon: 'watch', title: 'Watch yourself and your crew for warning signs' },
        { ...FEEL_UNWELL, detail: 'Report it at once.' },
      ],
      why: 'The heat and your work mean your body is working harder to stay cool.',
      when: 'For the next few hours. Check the forecast on your Status screen.',
    },
    3: {
      headline: 'Your heat risk is high and likely to rise after 13:00',
      actions: [
        { id: 'rest', icon: 'rest', title: 'Rest', detail: '15 min in shade every 45 min' },
        {
          id: 'water',
          icon: 'water',
          title: 'Water',
          detail: 'A cup at every break, even if not thirsty',
        },
        COOL_DOWN,
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
          detail:
            'Welding may move to shaded prep work 12:00 to 15:00. Your supervisor will confirm.',
        },
        FEEL_UNWELL,
      ],
      why: 'Welding in welding PPE on a hot, humid day makes your body heat up faster than it can cool. Your band shows your heart rate has been high for 20 minutes, and your profile asks for extra care.',
      when: DESIGN_WHEN,
    },
    4: {
      headline: 'Critical heat risk. Stop strenuous work now',
      actions: [
        {
          id: 'stop',
          icon: 'rest',
          title: 'Stop strenuous work and move to shade or the cooled rest area',
        },
        {
          id: 'cool',
          icon: 'cool',
          title:
            'Rest and cool down with water on your neck and arms. Follow site rules for your protective equipment',
        },
        { id: 'water', icon: 'water', title: 'Drink water in small amounts, often' },
        {
          id: 'return',
          icon: 'shift',
          title: 'Return to work only when your supervisor says it is safe',
        },
        {
          id: 'unwell',
          icon: 'urgent',
          title: 'Dizzy, confused or feeling sick?',
          detail: 'Get help now',
          linksToReport: true,
        },
      ],
      why: 'The heat is now too high for strenuous work, and your body may not be able to cool itself.',
      when: 'Now, until the risk drops or your supervisor says work can restart.',
    },
  },
  /** Chosen by comparing the worker's level with their crew's current level. */
  who: {
    above:
      "You. Your precautions put you above your crew's level today. Your supervisor has your adjusted plan, without any health details.",
    same: 'You and your crew. Your supervisor has the same advice for the whole crew.',
    below: 'Your crew. Your supervisor has advice for the whole crew.',
  },
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
  alertedText: 'First aider alerted. Stay where you are.',
  symptoms: [
    { id: 'headache', label: 'Headache' },
    { id: 'dizzy', label: 'Dizzy' },
    { id: 'thirst', label: 'Very thirsty' },
    { id: 'sick', label: 'Feel sick' },
    { id: 'cramps', label: 'Muscle cramps' },
    { id: 'weak', label: 'Very tired or weak' },
  ],
  noteLabel: 'Anything else? (optional)',
  notePlaceholder: 'Type or use voice',
  sendDisabledLabel: 'Tick a symptom or add a note to send',
  sentTitle: 'Report sent',
  sentText:
    'Stop work and rest in the shade now. Your supervisor has been asked to check on you. If you feel worse, use the emergency buttons above.',
  // Decision D5: the alert always goes through; details are kept only with symptom sharing on.
  sentTextNoDetails: 'Your supervisor and first aider were alerted. No symptom details were kept.',
  privacy: 'Details stay private; your supervisor only sees that you need help.',
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
  batterySaverAt: 20,
  batteryNormalDetail: 'Alarms still sound.',
  // "Still offline, trying again" is the design's label after a failed try.
  reconnect: {
    idle: 'Try to reconnect',
    checking: 'Checking connection',
    failed: 'Still offline, trying again',
  },
  backOnline: 'Back online. Data updated.',
  assumedLevel: 3,
  safetyText:
    'We cannot get new weather data, so HeatGuard is assuming high risk to keep you safe until it reconnects.',
  lastKnown: 'Last known level: Elevated at 08:40',
  standardPlan: [
    '15 min break in shade every 45 min',
    'Drink water at every break',
    'Avoid the heaviest work between 12:00 and 15:00',
    'Break reminders still work offline',
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
 * precautionFor, the same as every other screen.
 */
export const MY_DATA = {
  title: 'My data and privacy',
  precautionLabel: 'Your precaution level',
  healthProfileLink: 'Health profile',
  sharingTitle: 'What you share',
  sharing: [
    {
      id: 'health',
      label: 'Health precautions',
      description: 'Kept private, never shown to your supervisor',
    },
    {
      id: 'band',
      label: 'Wearable band',
      description: 'Heart rate and skin temperature. Pause any time.',
    },
    {
      id: 'reports',
      label: 'Share symptom details',
      description: 'Kept private; your supervisor only sees that you need help',
    },
    { id: 'voice', label: 'Read warnings aloud', description: 'In your chosen language' },
  ] satisfies SwitchContent[],
  accessTitle: 'Who looked at your data',
  accessPeriod: 'Last 30 days',
  accessLog: [
    { id: 'supervisor', who: 'Your supervisor', detail: 'Risk level and actions only · today' },
  ] satisfies DataAccessEntry[],
  promise:
    'Never used for discipline, rankings or job decisions. Health information is deleted 30 days after you leave the site.',
  download: 'Download my data',
  downloadFileName: 'heatguard-my-data.json',
  delete: 'Delete my health information',
  deleteConfirm: 'Delete your health answers? This cannot be undone.',
  setOn: (date: string) => `Set on ${date}`,
  deleteConfirmButton: 'Delete',
  deleteCancel: 'Cancel',
  deleted: 'Your health answers have been deleted.',
} as const

/** Shown after "Request a review" on My data or the health profile. */
export const REVIEW_REQUESTED = 'Review requested. A nurse will contact you.'

/** Short codes for the language button. Language choice is visual only for now. */
export const LANGUAGE_CODES: Record<Language, string> = {
  English: 'EN',
  Hausa: 'HA',
  Yoruba: 'YO',
  Igbo: 'IG',
  Pidgin: 'PCM',
}

/** Screen 1, from design-reference/source/Onboarding.dc.html. */
export const ONBOARDING: OnboardingContent = {
  steps: { current: 1, total: 2, label: 'Step 1 of 2' },
  heading: 'You decide what to share',
  intro:
    'HeatGuard warns you about heat and weather risks at work. The more you share, the more personal your advice. Everything below is optional except your work details.',
  workDetails: {
    title: 'Work details',
    detail: 'Crew, task, shift and PPE. Needed to send any warning.',
    badge: 'Always on',
  },
  switches: [
    {
      id: 'health',
      label: 'Health precautions',
      description:
        'Lets HeatGuard give you extra care based on your health answers. Without it you get standard advice.',
    },
    {
      id: 'band',
      label: 'Wearable band',
      description:
        'Heart rate and skin temperature for earlier warnings. You can pause it any time.',
    },
    {
      id: 'reports',
      label: 'Share symptom details',
      description: 'Kept private; your supervisor only sees that you need help',
    },
  ],
  promiseTitle: 'Our promise',
  promise:
    'Your supervisor only sees your risk level and the actions to take. Your health information is never used for discipline, rankings or job decisions. You can change these choices or delete your data at any time.',
  agree: 'Agree and continue',
  privacyLink: 'Read the full privacy notice',
}

/** Screen 2, from design-reference/source/HealthProfile.dc.html. */
export const HEALTH_PROFILE: HealthProfileContent = {
  title: 'My health profile',
  intro:
    'Your health answers stay private and are never shown to your supervisor. Your answer about getting used to the heat is part of your work record.',
  sharingOffNote: {
    before: 'You chose not to share health information. You can turn it on in ',
    link: 'My data',
    after: '.',
  },
  about: {
    title: '1. About you',
    workerIdLabel: 'Worker ID',
    ageLabel: 'Age range',
    ageNotAnswered: 'Not answered',
    ageOptions: ['Prefer not to say', 'Under 25', '25 to 39', '40 to 54', '55 or over'],
    why: 'Why we ask: the body copes with heat less well with age.',
  },
  conditions: {
    title: '2. Health conditions',
    intro: 'Tick any you have been told you have. You do not need to give details.',
    options: [
      {
        id: 'heart',
        label: 'Heart or blood pressure',
        hint: 'For example heart disease or high blood pressure',
      },
      { id: 'lungs', label: 'Breathing', hint: 'For example asthma or COPD' },
      { id: 'kidney', label: 'Kidneys', hint: 'Any kidney condition' },
      {
        id: 'meta',
        label: 'Diabetes, thyroid or weight-related',
        hint: 'Conditions that affect how your body uses energy',
      },
      {
        id: 'other',
        label: 'Something else that affects heat',
        hint: 'Your answer stays private and is never shown to your supervisor',
      },
      { id: 'none', label: 'None of these' },
    ],
  },
  heatIllness: {
    title: '3. Past heat illness',
    intro: 'Have you ever had heat exhaustion or heat stroke, or fainted from the heat?',
    options: [
      { id: 'no', label: 'No' },
      { id: 'recent', label: 'Yes, in the last 12 months' },
      { id: 'old', label: 'Yes, longer ago' },
      { id: 'unsure', label: 'Not sure' },
    ],
  },
  medicines: {
    title: '4. Medicines',
    intro: 'Some medicines make it harder to stay cool or hydrated. Tick the type, not the name.',
    options: [
      { id: 'water', label: 'Water tablets', hint: 'Make you pass more urine' },
      { id: 'bp', label: 'Heart or blood pressure medicine', hint: 'Taken every day' },
      { id: 'allergy', label: 'Allergy or sleep medicine', hint: 'Can reduce sweating' },
      {
        id: 'mood',
        label: 'Medicine for mood, nerves or seizures',
        hint: 'Some affect body temperature',
      },
      { id: 'unsure', label: 'Not sure', hint: 'You can leave this and update it later' },
      { id: 'none', label: 'None of these' },
    ],
    footnote: 'Not sure? You can leave this and update it later.',
  },
  acclimatisation: {
    title: '5. Getting used to the heat',
    intro: 'How long have you been doing this kind of work in this heat?',
    options: [
      { id: 'new', label: 'Less than 1 week' },
      { id: 'adjusting', label: '1 to 2 weeks' },
      { id: 'over2', label: 'More than 2 weeks' },
      { id: 'back', label: 'Back after a week or more away' },
    ],
    footnote:
      'New or returning workers need about 1 to 2 weeks to adjust, so they get extra care at first.',
    sharedTag: 'Shared with your work record',
    sharedNote: 'This answer helps plan your breaks and is part of your work record.',
  },
  precautions: {
    title: '6. Precautions set for you',
    intro:
      'Extra care HeatGuard gives you based on your answers. Your supervisor only sees the actions, never the reason.',
  },
  send: 'Save my answers',
  skip: 'Skip for now',
  footnote: 'You can change or delete these answers at any time in My data.',
  sentText: 'Saved. Your answers stay private.',
  goToStatus: 'Go to my status',
}

/** A health profile with no answers. First run starts here, and "Delete" returns to it. */
export const EMPTY_HEALTH_PROFILE: HealthProfileAnswers = {
  ageRange: '',
  conditions: [],
  heatIllness: null,
  medicines: [],
  acclimatisation: null,
}

/**
 * SAMPLE: W-0412's answers, from the design's starting state (HealthProfile.dc.html). Loaded only
 * from the dev panel ("Load W-0412 sample answers") for demos.
 */
export const HEALTH_PROFILE_SAMPLE: HealthProfileAnswers = {
  ageRange: WORKER.ageRange,
  conditions: ['heart'],
  heatIllness: 'no',
  medicines: ['bp'],
  acclimatisation: 'over2',
}

/* =========================================================================
 * Supervisor Today (screen 8)
 * ========================================================================= */

export const SUPERVISOR_HEADER_STATUS = {
  today: 'Updated 10:32 · WBGT estimated from weather data',
  plan: 'Forecast updated 10:30',
  initials: 'SU',
} as const

/** Filter options on Today. Each option lists the crews it shows; null means all crews. */
export const FILTERS: {
  crews: Array<{ label: string; crews: CrewId[] | null }>
  activities: Array<{ label: string; crews: CrewId[] | null }>
  shifts: string[]
} = {
  crews: [
    { label: 'All crews', crews: null },
    { label: 'Crew A', crews: ['A'] },
    { label: 'Crew B', crews: ['B'] },
    { label: 'Crew C', crews: ['C'] },
    { label: 'Crew D', crews: ['D'] },
  ],
  activities: [
    { label: 'All activities', crews: null },
    { label: 'Excavation', crews: ['B'] },
    { label: 'Concrete work', crews: ['A'] },
    { label: 'Welding', crews: ['C'] },
    { label: 'Logistics', crews: ['D'] },
  ],
  // Visual only for now.
  shifts: ['Day shift', 'Night shift'],
}

/** Wording on Today that is not part of a section's data. */
export const TODAY_TEXT = {
  hourByHour: 'Today, hour by hour',
  measuresLink: 'All safety and productivity measures',
  noCrews: 'No crews match these filters.',
  nothingNeedsAttention: 'Nothing needs attention for these filters.',
  resolvedToday: 'Resolved today',
  onMyWay: 'On my way',
  occupationalHealth: 'Occupational health',
  reassignedTo: 'Reassigned to',
  reassignTo: 'Reassign to',
  cancel: 'Cancel',
}

/** Choices shown after "Reassign" on an individual precaution alert. */
export const REASSIGN_OPTIONS = ['Shaded prep work', 'Lighter duty', 'Rest area']

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
    crew: 'B',
    workerId: 'W-0388',
    title: 'Worker W-0388 reported feeling unwell',
    meta: 'Crew B · 10:21',
    text: 'Check on them now, move them to shade and stop their work. First aider notified.',
    actions: ['I am on my way', 'Mark resolved'],
  },
  {
    id: 'crew-b-high',
    kind: 'crew-risk',
    crew: 'B',
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
    crew: 'C',
    workerId: 'W-0412',
    title: 'Worker W-0412 needs reduced exposure today',
    meta: 'Crew C · Now',
    do: 'reassign to shaded or lighter duty until 15:00 and add a recovery break every 30 min.',
    note: 'Health reasons are never shown.',
    actions: ['Reassign', 'Acknowledge'],
  },
  {
    // SAMPLE: W-0384 is enhanced in the backend demo. Crew A is a guess until the backend data is used.
    id: 'w0384-precaution',
    kind: 'precaution',
    crew: 'A',
    workerId: 'W-0384',
    title: 'Worker W-0384 needs earlier breaks today',
    meta: 'Crew A · Now',
    do: 'add an extra 10 min break each hour at level 3 and above.',
    note: 'Health reasons are never shown.',
    actions: ['Reassign', 'Acknowledge'],
  },
]

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
  sentText: 'Plan applied for today. Let your crews know about the changes.',
  note: 'HeatGuard suggests, you decide. Plans never require removing protective equipment, and are not used to judge individual productivity.',
}

/** Wording on the shift plan. From Planner.dc.html, plus the edit-mode lines (not in the design). */
export const PLAN_TEXT = {
  title: 'Shift plan',
  subtitle:
    '[SITE NAME] · Day shift · 07:00 to 17:00 · plan breaks, rotation and task timing around the heat',
  toggleLabel: 'Plan to show',
  current: 'Current plan',
  suggested: 'Suggested plan',
  editing: 'Suggested plan, editing',
  strenuousTitle: 'Strenuous work in hot hours',
  strenuousNote: 'Heavy work at High or above, or any strenuous work at Critical',
  workingTitle: 'Working hours',
  workingNoteSame: 'Across all crews, same in both plans',
  workingNoteDifferent: 'Across all crews',
  reducedTitle: 'Workers needing reduced exposure',
  reducedNote: 'Health reasons are never shown',
  fewerHours: (hours: number) =>
    `This plan has ${hours} fewer working ${hours === 1 ? 'hour' : 'hours'} than the current plan.`,
  timelineNote: 'Red outline: work that is too strenuous for the forecast heat',
  siteHeat: 'Site heat',
  tooHot: 'Too hot',
  legend: {
    H: 'Heavy',
    M: 'Moderate',
    L: 'Light or shaded',
    B: 'Break',
    tooHot: 'Too strenuous for the heat',
  },
  editHint: 'Tap a task to change it: Heavy, Moderate, Light, Break.',
  changesTitle: 'What the suggested plan changes',
  sendTitle: 'Send to crews',
  useSuggested: 'Use suggested plan',
  adjustFirst: 'Adjust first',
  useThis: 'Use this plan',
  cancelChanges: 'Cancel changes',
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
    detail: 'Emergency button use, first-aider alerts and emergency calls.',
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
  title: 'Safety and productivity measures',
  periodLabel: 'Period',
  leadTimesTitle: 'How early warnings came',
  byCrewTitle: 'Actions followed, by crew',
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
  { workerId: 'W-0384', crew: 'Crew A', reason: 'Worker requested a review · yesterday' },
  {
    workerId: 'W-0456',
    crew: 'Crew B',
    reason: 'New starter, not yet acclimatised · day 3 of 14',
  },
  { workerId: 'W-0307', crew: 'Crew D', reason: 'Restriction due to end · Friday' },
]
export const PROFILES_WAITING = '4 waiting'

const RECORDED_NOTE = 'Only factors with a clear link to heat risk are collected.'

/**
 * Profiles for the "Profiles to review" rows. W-0412 is the design. W-0384, W-0456 and W-0307 are
 * SAMPLE profiles written for the prototype to match their row text.
 */
export const OH_PROFILES: Record<string, OhProfile> = {
  'W-0412': {
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
    recordedNote: RECORDED_NOTE,
  },
  'W-0384': {
    workerId: 'W-0384',
    crew: 'Crew A',
    task: 'concrete work',
    consent: 'Consent: health information yes · wearable band no · can be withdrawn by the worker',
    recorded: ['Breathing condition on file', 'Acclimatised', 'No past heat illness'],
    recordedNote: RECORDED_NOTE,
  },
  'W-0456': {
    workerId: 'W-0456',
    crew: 'Crew B',
    task: 'excavation',
    consent:
      'Consent: health information yes · wearable band yes, since 04 Nov · can be withdrawn by the worker',
    recorded: ['New starter: day 3 of 14 getting used to the heat', 'No conditions reported'],
    recordedNote: RECORDED_NOTE,
  },
  'W-0307': {
    workerId: 'W-0307',
    crew: 'Crew D',
    task: 'site logistics',
    consent: 'Consent: health information yes · wearable band no · can be withdrawn by the worker',
    recorded: ['Heat illness in the last 12 months', 'Acclimatised'],
    recordedNote: RECORDED_NOTE,
  },
}

/**
 * SAMPLE: precaution levels by worker, matching the backend demo data (W-0412 high_priority,
 * W-0384 enhanced). In mock mode this is the only source of precaution levels.
 */
export const PRECAUTION_DEFAULTS: Record<string, PrecautionRecord> = {
  'W-0412': { level: 'high', setOn: '12 Oct', nextReview: '9 Nov' },
  'W-0384': { level: 'enhanced', setOn: '28 Oct' },
}

/** A worker's precaution level in mock mode. Workers not listed are on standard precautions. */
export function precautionFor(workerId: string): PrecautionRecord {
  return PRECAUTION_DEFAULTS[workerId] ?? { level: 'standard', setOn: '' }
}

/**
 * The supervisor alert for a worker on Enhanced or High-priority precautions. Standard has no
 * alert. High-priority is the design wording; Enhanced is written for the prototype. Neither
 * ever includes health reasons.
 */
export const PRECAUTION_ALERTS = {
  enhanced: {
    title: (workerId: string) => `Worker ${workerId} needs earlier breaks today`,
    do: 'add an extra 10 min break each hour at level 3 and above.',
  },
  high: {
    title: (workerId: string) => `Worker ${workerId} needs reduced exposure today`,
    do: 'reassign to shaded or lighter duty until 15:00 and add a recovery break every 30 min.',
  },
}

/** Outcome buttons on the escalation card. The supervisor only ever sees the supervisorSees line. */
export const OH_OUTCOMES: OhOutcome[] = [
  {
    id: 'fit',
    label: 'Fit to return later today',
    supervisorSees: 'Back at work later today',
    variant: 'primary',
  },
  {
    id: 'rest',
    label: 'Rest for the shift',
    supervisorSees: 'Resting for the shift',
    variant: 'secondary',
  },
  {
    id: 'clinic',
    label: 'Refer to clinic',
    supervisorSees: 'Referred to clinic',
    variant: 'danger',
  },
]

/**
 * How the worker's own health profile answers appear in "What you record", as categories. Used
 * only when the worker has sent their answers with health sharing switched on.
 */
export const RECORDED_CATEGORIES = {
  conditions: {
    heart: 'Heart or blood pressure condition',
    lungs: 'Breathing condition',
    kidney: 'Kidney condition',
    meta: 'Diabetes, thyroid or weight-related condition',
    other: 'Other condition that affects heat',
    none: 'No conditions reported',
  } as Record<string, string>,
  heatIllness: {
    no: 'No past heat illness',
    recent: 'Heat illness in the last 12 months',
    old: 'Heat illness, longer ago',
    unsure: 'Not sure about past heat illness',
  } as Record<string, string>,
  medicines: {
    water: 'Water tablets',
    bp: 'Blood pressure medicine',
    allergy: 'Allergy or sleep medicine',
    mood: 'Medicine for mood, nerves or seizures',
    unsure: 'Not sure about medicines, nurse to check',
    none: 'No relevant medicines',
  } as Record<string, string>,
  acclimatisation: {
    new: 'Less than 1 week in this heat',
    adjusting: '1 to 2 weeks in this heat',
    over2: 'Acclimatised',
    back: 'Returning after time away',
  } as Record<string, string>,
  age: (range: string) => `Age ${range}`,
  updatedByWorker: 'Updated by the worker',
  notShared: 'The worker chose not to share health information. Only work details are used.',
}

export const OH_TEXT = {
  title: 'Cases and profiles',
  subtitle: '[SITE NAME] · health details on this page are never shown to supervisors or employers',
  clinicalNoteLabel: 'Clinical note (occupational health only)',
  clinicalNotePlaceholder: 'Assessment and advice',
  outcome: 'Outcome',
  supervisorSees: 'The supervisor sees',
  reviewTitle: 'Profiles to review',
  selected: 'Open',
  whatYouRecord: 'What you record',
  precautionLevel: 'Precaution level',
  workRestrictions: 'Work restrictions',
  preview: 'Preview: what others see',
  supervisorDashboard: 'Supervisor dashboard',
  noHealthDetails: 'No conditions, medicines or symptoms.',
  workerApp: 'Worker app',
  save: 'Save and notify worker',
  savedText: 'Saved. The worker can see this decision and ask for a review.',
  privacy:
    'Every view of a health record is logged and visible to the worker. Health information cannot be exported to HR systems or used for discipline, productivity rankings or employment decisions.',
}
