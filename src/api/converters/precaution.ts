import type { PrecautionLevelId } from '../../data/types'
import { twoWay, type PrecautionCode } from './codes'

const PRECAUTION = twoWay<PrecautionLevelId, PrecautionCode>([
  ['standard', 'standard'],
  ['enhanced', 'enhanced'],
  ['high', 'high_priority'],
])

export function precautionToCode(level: PrecautionLevelId): PrecautionCode {
  return PRECAUTION.toCode(level) as PrecautionCode
}

/**
 * Unknown or missing codes are treated as standard precautions: the worker still gets the
 * crew's heat plan, and no extra care is promised that the server did not set.
 */
export function precautionFromCode(code: unknown): PrecautionLevelId {
  return PRECAUTION.fromCode(code) ?? 'standard'
}
