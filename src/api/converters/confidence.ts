import { twoWay, type ConfidenceCode } from './codes'

/** How sure the forecast is, in the app's words. The backend's "medium" is shown as "moderate". */
export type ForecastConfidence = 'high' | 'moderate' | 'low'

const CONFIDENCE = twoWay<ForecastConfidence, ConfidenceCode>([
  ['high', 'high'],
  ['moderate', 'medium'],
  ['low', 'low'],
])

export function confidenceToCode(confidence: ForecastConfidence): ConfidenceCode {
  return CONFIDENCE.toCode(confidence) as ConfidenceCode
}

/** null when the server sends no confidence or an unknown one: the UI then leaves it out. */
export function confidenceFromCode(code: unknown): ForecastConfidence | null {
  return CONFIDENCE.fromCode(code)
}
