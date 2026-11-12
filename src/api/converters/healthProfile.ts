import type { HealthProfileAnswers } from '../../data/types'
import { ageRangeFromCode, ageRangeToCode } from './ageRange'
import type { Schemas } from './codes'

export type HealthProfileBody = Schemas['UpdateOwnHealthDataDto']
type ConditionCode = NonNullable<HealthProfileBody['healthConditions']>[number]
type MedicationCode = NonNullable<HealthProfileBody['medications']>[number]
type HeatIllnessCode = NonNullable<HealthProfileBody['heatIllness']>
type AcclimatisationCode = NonNullable<HealthProfileBody['acclimatisation']>

// The app's option IDs (HEALTH_PROFILE in mock.ts) are the backend codes, so these lists only
// filter out anything unknown in either direction.
const CONDITIONS: readonly ConditionCode[] = ['heart', 'lungs', 'kidney', 'meta', 'other', 'none']
const MEDICATIONS: readonly MedicationCode[] = ['water', 'bp', 'allergy', 'mood', 'unsure', 'none']
const HEAT_ILLNESS: readonly HeatIllnessCode[] = ['no', 'recent', 'old', 'unsure']
const ACCLIMATISATION: readonly AcclimatisationCode[] = ['new', 'adjusting', 'over2', 'back']

const pick = <T extends string>(allowed: readonly T[], values: unknown): T[] =>
  Array.isArray(values) ? values.filter((v): v is T => allowed.includes(v as T)) : []
const one = <T extends string>(allowed: readonly T[], value: unknown): T | null =>
  allowed.includes(value as T) ? (value as T) : null

/** The saved profile from GET /workers/{id}/health-profile, as the form's answers. */
export function healthAnswersFromApi(body: unknown): HealthProfileAnswers {
  const v = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  return {
    ageRange: ageRangeFromCode(v.ageRange),
    conditions: pick(CONDITIONS, v.healthConditions),
    heatIllness: one(HEAT_ILLNESS, v.heatIllness),
    medicines: pick(MEDICATIONS, v.medications),
    acclimatisation: one(ACCLIMATISATION, v.acclimatisationAnswer),
  }
}

/**
 * The body for PUT /workers/{id}/health-profile. "Not answered" leaves the age range out, or
 * sends null to clear it when a range was saved before (decision: clear with ageRange: null).
 * Unanswered single choices are left out.
 */
export function healthAnswersToApi(
  answers: HealthProfileAnswers,
  { ageWasSaved }: { ageWasSaved: boolean },
): HealthProfileBody {
  const body: HealthProfileBody = {
    healthConditions: pick(CONDITIONS, answers.conditions),
    medications: pick(MEDICATIONS, answers.medicines),
  }
  const age = ageRangeToCode(answers.ageRange)
  if (age) body.ageRange = age
  // The generated type has no null; the backend accepts it to clear the saved range.
  else if (ageWasSaved) (body as Record<string, unknown>).ageRange = null
  const heatIllness = one(HEAT_ILLNESS, answers.heatIllness)
  if (heatIllness) body.heatIllness = heatIllness
  const acclimatisation = one(ACCLIMATISATION, answers.acclimatisation)
  if (acclimatisation) body.acclimatisation = acclimatisation
  return body
}
