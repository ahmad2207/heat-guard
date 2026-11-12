import { precautionFromCode } from '../../api/converters/precaution'
import type { MePrecaution } from '../../api/types/responses'
import { PRECAUTION_LEVELS, precautionFor, WORKER } from '../../data/mock'
import type { PrecautionLevelId } from '../../data/types'
import { formatDate } from '../../lib/format'

/** What the precaution card on Health profile and My data shows. */
export interface PrecautionView {
  level: PrecautionLevelId
  name: string
  restrictions: string[]
  /** "12 Oct", or empty when not known. */
  setOn: string
  /** "10 Dec", or empty. */
  nextReview: string
}

/** A date-only value (2026-12-10) is a calendar date: show it as is, not shifted by timezone. */
const showDate = (value: string | null | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatDate(`${value}T12:00:00Z`, 'UTC')
    : formatDate(value)

/** From GET /me precaution. null (no health profile) means no card at all, not "Standard". */
export function precautionViewFromApi(precaution: MePrecaution | null): PrecautionView | null {
  if (!precaution) return null
  const level = precautionFromCode(precaution.level)
  const definition = PRECAUTION_LEVELS[level]
  const restrictions = (precaution.restrictions ?? []).filter((r) => r.trim() !== '')
  return {
    level,
    name: definition.name,
    restrictions: restrictions.length > 0 ? restrictions : [definition.restriction],
    setOn: showDate(precaution.setOn),
    nextReview: showDate(precaution.nextReviewOn),
  }
}

/** SAMPLE: W-0412's card in mock mode, from PRECAUTION_DEFAULTS. */
export function mockPrecautionView(): PrecautionView {
  const record = precautionFor(WORKER.id)
  const definition = PRECAUTION_LEVELS[record.level]
  return {
    level: record.level,
    name: definition.name,
    // High-priority uses the design's two lines; other levels show their restriction text.
    restrictions:
      record.level === 'high' ? WORKER.precaution.restrictions : [definition.restriction],
    setOn: record.setOn,
    nextReview: record.nextReview ?? '',
  }
}
