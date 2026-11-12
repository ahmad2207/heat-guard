/**
 * Supervisor action codes in our wording (DECISIONS.md, supervisor action wording). Unknown codes
 * use the backend's English text when there is one, otherwise the code tidied into words. A raw
 * code is never shown.
 */
const ACTION_TEXT: Record<string, string> = {
  'supervisor.suspend_activity': 'Stop the affected activity now',
  'supervisor.extra_breaks_reduce_load': 'Add extra breaks and reduce heavy work',
  'supervisor.increase_monitoring': 'Check on the crew more often',
  'supervisor.reschedule_before_peak': 'Move heavy work before the hottest hours',
  'supervisor.review_ppe_cooling':
    'Check cooling and rest options for crews in heavy protective equipment',
  'supervisor.worker_reduced_exposure': 'Worker [code] needs reduced exposure today',
  'supervisor.worker_earlier_breaks': 'Worker [code] needs earlier breaks today',
  'crew.rotate_and_cool': 'Rotate [crew] between hot and shaded tasks and add cooling',
}

/** The worker-level codes, which name one worker. */
const WORKER_CODES: Record<string, { one: string; many: string }> = {
  'supervisor.worker_reduced_exposure': {
    one: '1 worker needs reduced exposure today',
    many: '[n] workers need reduced exposure today',
  },
  'supervisor.worker_earlier_breaks': {
    one: '1 worker needs earlier breaks today',
    many: '[n] workers need earlier breaks today',
  },
}

function tidy(code: string): string {
  const words = (code.split('.').pop() ?? code).replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : ''
}

export interface ActionContext {
  /** Worker code for worker-level actions, for example W-0412. Never a UUID. */
  workerCode?: string
  /** Crew name for crew-level actions, for example "Crew B" or "Crews A and B". */
  crew?: string
  /** For a summary row with no single worker: how many workers it covers. */
  workerCount?: number
  /** The backend's own English text, used for codes we do not know. */
  fallback?: string
}

export function supervisorActionText(code: unknown, context: ActionContext = {}): string {
  const key = typeof code === 'string' ? code : ''
  const summary = WORKER_CODES[key]
  if (summary && !context.workerCode) {
    const count = context.workerCount ?? 1
    return count === 1 ? summary.one : summary.many.replace('[n]', String(count))
  }
  const text = ACTION_TEXT[key]
  if (text) {
    return text
      .replace('[code]', context.workerCode ?? '')
      .replace('[crew]', context.crew || 'the crew')
  }
  return context.fallback?.trim() || tidy(key)
}

/** "Crew B", "Crews A and B", "Crews A, B and C". */
export function crewNames(names: string[]): string {
  const sorted = [...new Set(names)].sort((a, b) => a.localeCompare(b))
  const letters = sorted.map((name) => name.replace(/^Crew\s+/i, ''))
  if (sorted.length === 0) return 'Site'
  if (sorted.length === 1) return sorted[0]
  return `Crews ${letters.slice(0, -1).join(', ')} and ${letters[letters.length - 1]}`
}
