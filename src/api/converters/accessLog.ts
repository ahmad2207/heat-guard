import { formatDate, formatTime } from '../../lib/format'

/** One "Who looked at your data" row, in plain words. Never shows a raw role or action code. */
export interface AccessLogRow {
  id: string
  /** Used for the icon: the supervisor row has its own. */
  kind: 'supervisor' | 'other'
  title: string
  detail: string
}

/** Plain words per role (DECISIONS.md, access log roles). */
const ROLE_TEXT: Record<string, string> = {
  supervisor: 'Your supervisor viewed your risk level and actions',
  occupational_health: 'Occupational health viewed your health profile',
  admin: 'A site administrator viewed your account',
  worker: 'You viewed your own data',
}
export const UNKNOWN_ROLE_TEXT = 'Someone at your site viewed your data'

export function accessRoleText(role: unknown): string {
  return (typeof role === 'string' && ROLE_TEXT[role]) || UNKNOWN_ROLE_TEXT
}

const times = (count: number) => (count === 1 ? 'once' : `${count} times`)

/** Rows from GET /me/access-log, newest first. Bad entries are skipped. */
export function accessLogFromApi(body: unknown): AccessLogRow[] {
  if (!Array.isArray(body)) return []
  return body
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .filter((e) => typeof e.lastAt === 'string' && formatDate(e.lastAt) !== '')
    .sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)))
    .map((e, index) => {
      const count = typeof e.count === 'number' && e.count > 0 ? e.count : 1
      const last = String(e.lastAt)
      return {
        id: `${String(e.date)}-${index}`,
        kind: e.actorRole === 'supervisor' ? 'supervisor' : 'other',
        title: accessRoleText(e.actorRole),
        detail: `${formatDate(last)} · last at ${formatTime(last)} · ${times(count)}`,
      }
    })
}
