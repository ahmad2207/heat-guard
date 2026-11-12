import { describe, expect, it } from 'vitest'
import { sanitiseSession } from './sessionCache'

const worker = {
  role: 'worker',
  loginId: 'W-0301',
  worker: {
    id: 'uuid-1',
    code: 'W-0301',
    displayName: 'W-0301',
    crewName: 'Crew A',
    language: 'en',
  },
  site: { id: 'site-1', name: 'Abuja Demo Site', timezone: 'Africa/Lagos', emergencyNumber: '112' },
}

describe('sanitiseSession', () => {
  it('keeps a well-formed session', () => {
    expect(sanitiseSession(worker)).toEqual(worker)
  })
  it('drops bad or missing data', () => {
    expect(sanitiseSession(null)).toBeNull()
    expect(sanitiseSession('W-0301')).toBeNull()
    expect(sanitiseSession({ ...worker, role: 'admin' })).toBeNull()
    expect(sanitiseSession({ ...worker, worker: null })).toBeNull()
  })
  it('keeps a supervisor without a worker and fills safe defaults', () => {
    expect(
      sanitiseSession({ role: 'supervisor', loginId: 'S-001', worker: null, site: { id: 1 } }),
    ).toEqual({
      role: 'supervisor',
      loginId: 'S-001',
      worker: null,
      site: null,
    })
  })
  it('never carries extra fields such as health data or tokens', () => {
    const saved = sanitiseSession({ ...worker, accessToken: 'x', precaution: { level: 'high' } })
    expect(saved).not.toHaveProperty('accessToken')
    expect(saved).not.toHaveProperty('precaution')
  })
})
