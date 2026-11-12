import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SITE_TIME_ZONE,
  formatDate,
  formatRelative,
  formatTime,
  getSiteTimeZone,
  setSiteTimeZone,
} from './format'

afterEach(() => setSiteTimeZone(DEFAULT_SITE_TIME_ZONE))

describe('formatTime', () => {
  it('shows UTC times in the site timezone (Lagos is UTC+1)', () => {
    expect(formatTime('2026-11-12T09:32:00Z')).toBe('10:32')
  })
  it('uses another timezone when the site has one', () => {
    setSiteTimeZone('Asia/Kolkata')
    expect(formatTime('2026-11-12T09:32:00Z')).toBe('15:02')
  })
  it('uses 00 for midnight, not 24', () => {
    expect(formatTime('2026-11-12T23:05:00Z')).toBe('00:05')
  })
  it('accepts an explicit timezone', () => {
    expect(formatTime('2026-11-12T09:32:00Z', 'UTC')).toBe('09:32')
  })
  it('returns an empty string for missing or invalid times', () => {
    expect(formatTime(null)).toBe('')
    expect(formatTime('not a time')).toBe('')
  })
})

describe('formatDate', () => {
  it('shows dates like "12 Oct"', () => {
    expect(formatDate('2026-10-12T08:00:00Z')).toBe('12 Oct')
  })
  it('uses the site date when the UTC date is still the day before', () => {
    // 23:30 UTC on 11 Oct is 00:30 on 12 Oct in Lagos.
    expect(formatDate('2026-10-11T23:30:00Z')).toBe('12 Oct')
  })
  it('returns an empty string for invalid dates', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('setSiteTimeZone', () => {
  it('ignores unknown timezone names', () => {
    setSiteTimeZone('Mars/Olympus')
    expect(getSiteTimeZone()).toBe(DEFAULT_SITE_TIME_ZONE)
    setSiteTimeZone(null)
    expect(getSiteTimeZone()).toBe(DEFAULT_SITE_TIME_ZONE)
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-11-12T09:32:00Z')
  it('shows future times as "in 12 min"', () => {
    expect(formatRelative('2026-11-12T09:44:00Z', now)).toBe('in 12 min')
  })
  it('shows past times as "5 min ago"', () => {
    expect(formatRelative('2026-11-12T09:27:00Z', now)).toBe('5 min ago')
  })
  it('shows hours and minutes', () => {
    expect(formatRelative('2026-11-12T10:52:00Z', now)).toBe('in 1 h 20 min')
    expect(formatRelative('2026-11-12T11:32:00Z', now)).toBe('in 2 h')
    expect(formatRelative('2026-11-12T08:02:00Z', now)).toBe('1 h 30 min ago')
  })
  it('shows "now" within half a minute', () => {
    expect(formatRelative('2026-11-12T09:32:20Z', now)).toBe('now')
  })
  it('rounds to the nearest minute', () => {
    expect(formatRelative('2026-11-12T09:44:40Z', now)).toBe('in 13 min')
  })
  it('returns an empty string for invalid times', () => {
    expect(formatRelative(undefined, now)).toBe('')
  })
})
