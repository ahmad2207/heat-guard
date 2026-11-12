import { describe, expect, it } from 'vitest'
import type { Language, PrecautionLevelId } from '../../data/types'
import type { RiskLevel } from '../../lib/risk'
import {
  ageRangeFromCode,
  ageRangeToCode,
  confidenceFromCode,
  confidenceToCode,
  consentFromApi,
  consentToApi,
  crewFromApi,
  crewsFromApi,
  languageFromCode,
  languageToCode,
  precautionFromCode,
  precautionToCode,
  riskLevelFromCode,
  riskLevelToCode,
  type ForecastConfidence,
} from '.'

describe('languages', () => {
  const pairs: Array<[Language, string]> = [
    ['English', 'en'],
    ['Hausa', 'ha'],
    ['Yoruba', 'yo'],
    ['Igbo', 'ig'],
    ['Pidgin', 'pcm'],
  ]
  it.each(pairs)('%s <-> %s', (language, code) => {
    expect(languageToCode(language)).toBe(code)
    expect(languageFromCode(code)).toBe(language)
  })
  it('falls back to English for unknown or missing codes', () => {
    expect(languageFromCode('fr')).toBe('English')
    expect(languageFromCode('EN')).toBe('English')
    expect(languageFromCode(undefined)).toBe('English')
    expect(languageFromCode(42)).toBe('English')
  })
})

describe('precaution levels', () => {
  const pairs: Array<[PrecautionLevelId, string]> = [
    ['standard', 'standard'],
    ['enhanced', 'enhanced'],
    ['high', 'high_priority'],
  ]
  it.each(pairs)('%s <-> %s', (level, code) => {
    expect(precautionToCode(level)).toBe(code)
    expect(precautionFromCode(code)).toBe(level)
  })
  it('treats unknown or missing codes as standard', () => {
    expect(precautionFromCode('high')).toBe('standard')
    expect(precautionFromCode('critical')).toBe('standard')
    expect(precautionFromCode(null)).toBe('standard')
  })
})

describe('age ranges', () => {
  const pairs: Array<[string, string]> = [
    ['Prefer not to say', 'prefer_not_to_say'],
    ['Under 25', 'under_25'],
    ['25 to 39', '25_39'],
    ['40 to 54', '40_54'],
    ['55 or over', '55_plus'],
  ]
  it.each(pairs)('%s <-> %s', (label, code) => {
    expect(ageRangeToCode(label)).toBe(code)
    expect(ageRangeFromCode(code)).toBe(label)
  })
  it('leaves the field out for "Not answered" or an unknown label', () => {
    expect(ageRangeToCode('')).toBeUndefined()
    expect(ageRangeToCode('60 plus')).toBeUndefined()
  })
  it('reads unknown or missing codes as "Not answered"', () => {
    expect(ageRangeFromCode('65_plus')).toBe('')
    expect(ageRangeFromCode(undefined)).toBe('')
  })
})

describe('consent names', () => {
  it('maps app switches to backend names', () => {
    expect(consentToApi({ health: true, band: false, reports: true })).toEqual({
      healthPrecautions: true,
      wearableBand: false,
      symptomReports: true,
      policyVersion: '2026-11-v1',
    })
  })
  it('accepts another policy version', () => {
    expect(
      consentToApi({ health: false, band: false, reports: false }, '2027-01-v2'),
    ).toMatchObject({
      policyVersion: '2027-01-v2',
    })
  })
  it('maps backend names to app switches', () => {
    expect(
      consentFromApi({ healthPrecautions: false, wearableBand: true, symptomReports: true }),
    ).toEqual({ health: false, band: true, reports: true })
  })
  it('reads anything missing or not a boolean as off', () => {
    expect(consentFromApi({ healthPrecautions: 'yes', unknownPurpose: true })).toEqual({
      health: false,
      band: false,
      reports: false,
    })
    expect(consentFromApi(null)).toEqual({ health: false, band: false, reports: false })
  })
})

describe('forecast confidence', () => {
  const pairs: Array<[ForecastConfidence, string]> = [
    ['high', 'high'],
    ['moderate', 'medium'],
    ['low', 'low'],
  ]
  it.each(pairs)('%s <-> %s', (confidence, code) => {
    expect(confidenceToCode(confidence)).toBe(code)
    expect(confidenceFromCode(code)).toBe(confidence)
  })
  it('shows medium as moderate, never the raw code', () => {
    expect(confidenceFromCode('medium')).toBe('moderate')
  })
  it('returns null for unknown or missing codes', () => {
    expect(confidenceFromCode('moderate')).toBeNull()
    expect(confidenceFromCode(undefined)).toBeNull()
  })
})

describe('risk levels', () => {
  it.each([1, 2, 3, 4] as RiskLevel[])('level %i both ways', (level) => {
    expect(riskLevelToCode(level)).toBe(level)
    expect(riskLevelFromCode(level)).toBe(level)
  })
  it('accepts numeric strings', () => {
    expect(riskLevelFromCode('3')).toBe(3)
  })
  it('returns null for out of range or missing levels', () => {
    for (const value of [0, 5, 2.5, -1, '', 'high', null, undefined, Number.NaN]) {
      expect(riskLevelFromCode(value)).toBeNull()
    }
  })
})

describe('crews', () => {
  it('keeps backend IDs and names', () => {
    expect(crewFromApi({ id: 'c6f1-uuid', name: 'Crew A', siteId: 's1' })).toEqual({
      id: 'c6f1-uuid',
      name: 'Crew A',
    })
  })
  it('drops crews without an ID and names unnamed crews', () => {
    expect(crewsFromApi([{ id: 'x', name: '  ' }, { name: 'No ID' }, null, 'bad'])).toEqual([
      { id: 'x', name: 'Unnamed crew' },
    ])
  })
  it('returns an empty list for a non-list body', () => {
    expect(crewsFromApi({ id: 'x' })).toEqual([])
  })
})
