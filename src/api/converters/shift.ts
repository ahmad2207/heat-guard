import { formatTime } from '../../lib/format'

export type ShiftAction = 'clock-in' | 'break-start' | 'break-end' | 'clock-out'

/** The state fields of today's assignment (GET /me assignment, or an action's response). */
export interface ShiftTimes {
  startsAt: string
  endsAt: string
  clockedInAt: string | null
  onBreakSince: string | null
  lastBreakEndedAt: string | null
  clockedOutAt: string | null
}

export type ShiftPhase = 'not-started' | 'working' | 'on-break' | 'ended'

export interface ShiftView {
  phase: ShiftPhase
  /** "On break since 12:10", "Shift started at 07:02" and so on. */
  status: string
  /** The buttons to show, in order. "End shift" asks to confirm. */
  actions: ShiftAction[]
}

export const SHIFT_LABELS: Record<ShiftAction, string> = {
  'clock-in': 'Start shift',
  'break-start': 'Start break',
  'break-end': 'End break',
  'clock-out': 'End shift',
}

/** POST /assignments/{id}/... for each action. */
export const SHIFT_PATHS: Record<ShiftAction, string> = {
  'clock-in': 'clock-in',
  'break-start': 'break/start',
  'break-end': 'break/end',
  'clock-out': 'clock-out',
}

/** One action at a time: Start shift; then Start break and End shift; during a break End break. */
export function shiftView(times: ShiftTimes): ShiftView {
  if (times.clockedOutAt) {
    return {
      phase: 'ended',
      status: `Shift ended at ${formatTime(times.clockedOutAt)}`,
      actions: [],
    }
  }
  if (!times.clockedInAt) {
    const hours = [formatTime(times.startsAt), formatTime(times.endsAt)].filter(Boolean)
    return {
      phase: 'not-started',
      status: hours.length === 2 ? `Today ${hours[0]} to ${hours[1]}` : 'Not started yet',
      actions: ['clock-in'],
    }
  }
  if (times.onBreakSince) {
    return {
      phase: 'on-break',
      status: `On break since ${formatTime(times.onBreakSince)}`,
      actions: ['break-end'],
    }
  }
  const status = times.lastBreakEndedAt
    ? `Back from break at ${formatTime(times.lastBreakEndedAt)}`
    : `Shift started at ${formatTime(times.clockedInAt)}`
  return { phase: 'working', status, actions: ['break-start', 'clock-out'] }
}

/** What an action changes, applied on the phone straight away (used while it is queued). */
export function applyShiftAction(times: ShiftTimes, action: ShiftAction, at: string): ShiftTimes {
  switch (action) {
    case 'clock-in':
      return { ...times, clockedInAt: at, onBreakSince: null, clockedOutAt: null }
    case 'break-start':
      return { ...times, onBreakSince: at }
    case 'break-end':
      return { ...times, onBreakSince: null, lastBreakEndedAt: at }
    case 'clock-out':
      return { ...times, onBreakSince: null, clockedOutAt: at }
  }
}

const str = (value: unknown) => (typeof value === 'string' && value ? value : null)

/** The state fields from an assignment, or null when there is none. */
export function shiftTimesFromApi(body: unknown): ShiftTimes | null {
  if (!body || typeof body !== 'object') return null
  const a = body as Record<string, unknown>
  if (typeof a.startsAt !== 'string' || typeof a.endsAt !== 'string') return null
  return {
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    clockedInAt: str(a.clockedInAt),
    onBreakSince: str(a.onBreakSince),
    lastBreakEndedAt: str(a.lastBreakEndedAt),
    clockedOutAt: str(a.clockedOutAt),
  }
}
