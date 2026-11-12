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

  // The actions never change, so components and effects that depend on them (the session and
  // account providers) do not run again each time a preference changes.
  const actions = useMemo<Omit<WorkerPreferencesValue, keyof WorkerPreferences>>(() => {
    const update = (change: (current: WorkerPreferences) => WorkerPreferences) => {
      setCleared(false)
      setPreferences(change)
    }
    return {
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
        })),
      skipProfile: () => update((p) => ({ ...p, onboardingComplete: true })),
      deleteHealthAnswers: () =>
        update((p) => ({
          ...p,
          profile: EMPTY_HEALTH_PROFILE,
          profileSent: false,
        })),
      loadSampleAnswers: () =>
        update((p) => ({ ...p, profile: HEALTH_PROFILE_SAMPLE, profileSent: false })),
      applyServer: (values) =>
        update((p) => ({
          ...p,
          ...values,
          onboardingComplete: p.onboardingComplete || values.consentGiven,
        })),
      resetOnboarding: () => {
        clearPreferences()
        setCleared(true)
        setPreferences(DEFAULT_PREFERENCES)
      },
    }
  }, [])

  const value = useMemo<WorkerPreferencesValue>(
    () => ({ ...preferences, ...actions }),
    [preferences, actions],
  )

  return (
    <WorkerPreferencesContext.Provider value={value}>{children}</WorkerPreferencesContext.Provider>
  )
}
