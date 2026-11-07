import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { EMPTY_HEALTH_PROFILE, HEALTH_PROFILE_SAMPLE } from '../../data/mock'
import {
  clearPreferences,
  DEFAULT_PREFERENCES,
  hasSavedPreferences,
  loadPreferences,
  savePreferences,
  WorkerPreferencesContext,
  type WorkerPreferences,
  type WorkerPreferencesValue,
} from './workerPreferences'

/** Holds the worker's consent and health profile, saved to localStorage. */
export function WorkerPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<WorkerPreferences>(loadPreferences)
  // Nothing is written until the worker makes a choice, and after a reset storage stays empty
  // until they change something again.
  const [cleared, setCleared] = useState(() => !hasSavedPreferences())

  useEffect(() => {
    if (cleared) return
    savePreferences(preferences)
  }, [preferences, cleared])

  const value = useMemo<WorkerPreferencesValue>(() => {
    const update = (change: (current: WorkerPreferences) => WorkerPreferences) => {
      setCleared(false)
      setPreferences(change)
    }
    return {
      ...preferences,
      setLanguage: (language) => update((p) => ({ ...p, language })),
      setSharing: (id, on) => update((p) => ({ ...p, sharing: { ...p.sharing, [id]: on } })),
      giveConsent: () => update((p) => ({ ...p, consentGiven: true })),
      setProfile: (change) =>
        update((p) => ({ ...p, profile: change(p.profile), profileSent: false })),
      sendProfile: () =>
        update((p) => ({
          ...p,
          profileSent: true,
          onboardingComplete: true,
          sentProfile: { answers: p.profile, sentAt: new Date().toISOString() },
        })),
      skipProfile: () => update((p) => ({ ...p, onboardingComplete: true })),
      requestReview: () => update((p) => ({ ...p, reviewRequested: true })),
      deleteHealthAnswers: () =>
        update((p) => ({
          ...p,
          profile: EMPTY_HEALTH_PROFILE,
          profileSent: false,
          sentProfile: undefined,
        })),
      loadSampleAnswers: () =>
        update((p) => ({ ...p, profile: HEALTH_PROFILE_SAMPLE, profileSent: false })),
      resetOnboarding: () => {
        clearPreferences()
        setCleared(true)
        setPreferences(DEFAULT_PREFERENCES)
      },
    }
  }, [preferences])

  return (
    <WorkerPreferencesContext.Provider value={value}>{children}</WorkerPreferencesContext.Provider>
  )
}
