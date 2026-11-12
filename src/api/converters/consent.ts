import type { SharingChoices } from '../../data/types'
import type { Schemas } from './codes'

export type ConsentChoicesBody = Schemas['ConsentChoicesDto']

/** The three consent switches. "Read warnings aloud" (voice) is a preference, not a consent. */
export type ConsentChoices = Pick<SharingChoices, 'health' | 'band' | 'reports'>

/** For PUT /me/consents. policyVersion is the privacy notice version the worker saw. */
export function consentToApi(choices: ConsentChoices, policyVersion: string): ConsentChoicesBody {
  return {
    healthPrecautions: choices.health,
    wearableBand: choices.band,
    symptomReports: choices.reports,
    policyVersion,
  }
}

/** Anything missing or not a boolean is read as "off", the private choice. */
export function consentFromApi(body: unknown): ConsentChoices {
  const value = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  return {
    health: value.healthPrecautions === true,
    band: value.wearableBand === true,
    reports: value.symptomReports === true,
  }
}
