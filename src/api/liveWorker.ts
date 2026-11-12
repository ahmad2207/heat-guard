/**
 * The worker's live data (api mode): risk, water, and the actions that go through the outbox.
 * Mock mode keeps the sample data, so screens call these only when isMockMode is false.
 */
import { apiRequest, type RequestOptions } from './client'
import { savedRiskFromApi, type SavedRisk } from './converters/myRisk'
import { SHIFT_PATHS, type ShiftAction } from './converters/shift'
import { submit, type OutboxOutcome } from './outbox'
import type { MyRiskResponse, ResponseOf } from './types/responses'

export type LoadOptions = Pick<RequestOptions, 'signal' | 'onSlow'>
export type WaterResponse = ResponseOf<'/api/v1/me/water', 'get'>

/* ---------- Saved risk for field mode ---------- */

export const SAVED_RISK_KEY = 'heatguard.risk.v1'

export function loadSavedRisk(): SavedRisk | null {
  try {
    const raw = window.localStorage.getItem(SAVED_RISK_KEY)
    return raw ? savedRiskFromApi(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function saveRisk(response: MyRiskResponse): void {
  const saved = savedRiskFromApi(response)
  if (!saved) return
  try {
    // Stored in the response's own shape, so savedRiskFromApi reads it back the same way.
    window.localStorage.setItem(
      SAVED_RISK_KEY,
      JSON.stringify({
        level: saved.level,
        assessedAt: saved.assessedAt,
        forecast: { hours: saved.hours },
      }),
    )
  } catch {
    // Storage blocked: field mode falls back to the standard plan only.
  }
}

export function clearSavedRisk(): void {
  try {
    window.localStorage.removeItem(SAVED_RISK_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** GET /me/risk. Keeps the level, time and forecast on the device for field mode. */
export async function loadMyRisk(options: LoadOptions = {}): Promise<MyRiskResponse> {
  const response = await apiRequest<MyRiskResponse>('/me/risk', options)
  saveRisk(response)
  return response
}

/* ---------- Water ---------- */

export function loadWater(options: LoadOptions = {}): Promise<WaterResponse> {
  return apiRequest<WaterResponse>('/me/water', options)
}

/** "+ Cup": POST /me/water, or queued when offline. */
export function addCup(): Promise<OutboxOutcome> {
  return submit({ kind: 'water', path: '/me/water', body: { cups: 1 } })
}

/* ---------- What to do and Report ---------- */

/** "I understand": acknowledges the first recommendation from /me/risk. */
export function acknowledgeRecommendation(recommendationId: string): Promise<OutboxOutcome> {
  return submit({
    kind: 'acknowledge',
    path: `/recommendations/${encodeURIComponent(recommendationId)}/interventions`,
    body: { status: 'acknowledged' },
  })
}

/** "Alert first aider". Always sent, whatever the sharing choices. */
export function sendFirstAidAlert(): Promise<OutboxOutcome> {
  return submit({ kind: 'first-aid-alert', path: '/me/first-aid-alert' })
}

/**
 * "Send report". The alert always goes; the symptoms and note go only when the worker shares
 * symptom details (decision D5).
 */
export function sendSymptomReport(
  report: { symptoms: string[]; note: string },
  shareDetails: boolean,
): Promise<OutboxOutcome> {
  const note = report.note.trim()
  const body = shareDetails ? { symptoms: report.symptoms, ...(note ? { note } : {}) } : {}
  return submit({ kind: 'symptom-report', path: '/me/symptom-reports', body })
}

/* ---------- Shift buttons and heartbeat ---------- */

/** "Start shift", "Start break", "End break" and "End shift". Queued when offline. */
export function sendShiftAction(assignmentId: string, action: ShiftAction): Promise<OutboxOutcome> {
  return submit({
    kind: 'shift',
    path: `/assignments/${encodeURIComponent(assignmentId)}/${SHIFT_PATHS[action]}`,
  })
}

/**
 * POST /me/heartbeat: tells the backend the app is open, with the battery when the browser
 * reports it. Never queued: an old heartbeat means nothing. Failures are ignored.
 */
export async function sendHeartbeat(
  battery: { percent: number; charging: boolean } | null,
): Promise<void> {
  const body = battery ? { batteryPercent: battery.percent, charging: battery.charging } : {}
  await apiRequest('/me/heartbeat', { method: 'POST', body }).catch(() => {})
}
