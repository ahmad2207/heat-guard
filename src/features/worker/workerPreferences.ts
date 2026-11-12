import { createContext, useContext } from 'react'
import { EMPTY_HEALTH_PROFILE, LANGUAGES, WORKER } from '../../data/mock'
import type { HealthProfileAnswers, Language, SharingChoices } from '../../data/types'

/** The worker's own choices: consent, sharing, language and health profile answers. */
export interface WorkerPreferences {
  /** True once the worker has pressed "Agree and continue". */
  consentGiven: boolean
  language: Language
  /** Shared by the consent screen and My data. */
  sharing: SharingChoices
  profile: HealthProfileAnswers
  /** True after "Save my answers", until the answers change again. */
  profileSent: boolean
  /** True once the worker leaves the health profile with Send or "Skip for now" on first run. */
  onboardingComplete: boolean
  reviewRequested: boolean
}

export interface WorkerPreferencesValue extends WorkerPreferences {
  setLanguage: (language: Language) => void
  setSharing: (id: keyof SharingChoices, on: boolean) => void
  giveConsent: () => void
  setProfile: (update: (profile: HealthProfileAnswers) => HealthProfileAnswers) => void
  sendProfile: () => void
  /** Leaves first run without sending ("Skip for now"). */
  skipProfile: () => void
  requestReview: () => void
  /** Clears the health profile answers only. Consent choices stay. */
  deleteHealthAnswers: () => void
  /** Fills in W-0412's sample answers (dev panel, for demos). */
  loadSampleAnswers: () => void
  /** Clears the saved consent and profile (dev panel). */
  resetOnboarding: () => void
}

export const STORAGE_KEY = 'heatguard.worker.v1'

export const DEFAULT_PREFERENCES: WorkerPreferences = {
  consentGiven: false,
  language: WORKER.language,
  sharing: { ...WORKER.consent, voice: WORKER.sharing.voice },
  profile: EMPTY_HEALTH_PROFILE,
  profileSent: false,
  onboardingComplete: false,
  reviewRequested: false,
}

const isBool = (value: unknown): value is boolean => typeof value === 'boolean'
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
const isStringOrNull = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

/** Keeps only well-formed saved values, so an old or edited entry cannot break the app. */
function sanitise(saved: unknown): WorkerPreferences {
  const d = DEFAULT_PREFERENCES
  if (!saved || typeof saved !== 'object') return d
  const s = saved as Record<string, unknown>
  const sharing = (s.sharing ?? {}) as Record<string, unknown>
  const profile = (s.profile ?? {}) as Record<string, unknown>
  return {
    consentGiven: isBool(s.consentGiven) ? s.consentGiven : d.consentGiven,
    language: LANGUAGES.includes(s.language as Language) ? (s.language as Language) : d.language,
    sharing: {
      health: isBool(sharing.health) ? sharing.health : d.sharing.health,
      band: isBool(sharing.band) ? sharing.band : d.sharing.band,
      reports: isBool(sharing.reports) ? sharing.reports : d.sharing.reports,
      voice: isBool(sharing.voice) ? sharing.voice : d.sharing.voice,
    },
    profile: {
      ageRange: typeof profile.ageRange === 'string' ? profile.ageRange : d.profile.ageRange,
      conditions: isStringArray(profile.conditions) ? profile.conditions : d.profile.conditions,
      heatIllness: isStringOrNull(profile.heatIllness)
        ? profile.heatIllness
        : d.profile.heatIllness,
      medicines: isStringArray(profile.medicines) ? profile.medicines : d.profile.medicines,
      acclimatisation: isStringOrNull(profile.acclimatisation)
        ? profile.acclimatisation
        : d.profile.acclimatisation,
    },
    profileSent: isBool(s.profileSent) ? s.profileSent : d.profileSent,
    onboardingComplete: isBool(s.onboardingComplete) ? s.onboardingComplete : d.onboardingComplete,
    reviewRequested: isBool(s.reviewRequested) ? s.reviewRequested : d.reviewRequested,
  }
}

/** Reads saved preferences. Falls back to the defaults if storage is blocked or the data is bad. */
export function loadPreferences(): WorkerPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? sanitise(JSON.parse(raw)) : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/** True when something has been saved before. */
export function hasSavedPreferences(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function savePreferences(preferences: WorkerPreferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage full or blocked (for example private browsing). The app keeps working in memory.
  }
}

export function clearPreferences(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

export const WorkerPreferencesContext = createContext<WorkerPreferencesValue | null>(null)

export function useWorkerPreferences(): WorkerPreferencesValue {
  const value = useContext(WorkerPreferencesContext)
  if (!value) throw new Error('useWorkerPreferences must be used inside WorkerPreferencesProvider')
  return value
}
