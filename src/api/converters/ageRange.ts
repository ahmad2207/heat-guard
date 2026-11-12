import { twoWay, type AgeRangeCode } from './codes'

/** The labels on the health profile (HEALTH_PROFILE.ageOptions). "" means "Not answered". */
const AGE_RANGE = twoWay<string, AgeRangeCode>([
  ['Prefer not to say', 'prefer_not_to_say'],
  ['Under 25', 'under_25'],
  ['25 to 39', '25_39'],
  ['40 to 54', '40_54'],
  ['55 or over', '55_plus'],
])

/** The code to send, or undefined to leave the field out ("Not answered" or an unknown label). */
export function ageRangeToCode(label: string): AgeRangeCode | undefined {
  return AGE_RANGE.toCode(label) ?? undefined
}

/** The label to show. Missing or unknown codes read as "Not answered" (""). */
export function ageRangeFromCode(code: unknown): string {
  return AGE_RANGE.fromCode(code) ?? ''
}
