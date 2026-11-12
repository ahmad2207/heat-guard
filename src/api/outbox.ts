/**
 * Actions a worker takes while offline, kept on the device and sent in order once the app is
 * online and signed in: "+ Cup", "I understand", first-aid alerts and symptom reports.
 *
 * - Sent oldest first. A 409 (already done) drops the item quietly, as does any other refusal
 *   (4xx) that could never succeed.
 * - No connection, a timeout or a server error stops the run; the rest wait for the next try.
 * - The server records the time it receives an item, not when it was pressed (the API has no
 *   field for that).
 * - Cleared on sign out. A queued symptom report holds the symptoms the worker chose to share
 *   until it is sent.
 */
import { apiRequest } from './client'
import { ApiError, isUnreachable } from './errors'

export const OUTBOX_KEY = 'heatguard.outbox.v1'

export type OutboxKind = 'water' | 'acknowledge' | 'first-aid-alert' | 'symptom-report'

export interface OutboxItem {
  id: string
  kind: OutboxKind
  path: string
  body?: unknown
  createdAt: string
}

export type OutboxOutcome =
  | { status: 'sent'; response: unknown }
  /** Refused by the server (for example 409 already done). Not retried. */
  | { status: 'dropped'; error: ApiError }
  /** Waiting for a connection. */
  | { status: 'queued' }

const KINDS: OutboxKind[] = ['water', 'acknowledge', 'first-aid-alert', 'symptom-report']

function read(): OutboxItem[] {
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY)
    const items: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(items)) return []
    return items.filter(
      (item): item is OutboxItem =>
        !!item &&
        typeof item.id === 'string' &&
        KINDS.includes(item.kind) &&
        typeof item.path === 'string' &&
        item.path.startsWith('/'),
    )
  } catch {
    return []
  }
}

function write(items: OutboxItem[]): void {
  try {
    if (items.length === 0) window.localStorage.removeItem(OUTBOX_KEY)
    else window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
  } catch {
    // Storage blocked: items stay in memory for this page only.
    memory = items
  }
  notify()
}

let memory: OutboxItem[] | null = null
const all = () => memory ?? read()

const listeners = new Set<() => void>()
function notify() {
  listeners.forEach((listener) => listener())
}
/** Called whenever the queue changes. Returns an unsubscribe function. */
export function subscribeOutbox(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function pendingItems(): OutboxItem[] {
  return all()
}

export function clearOutbox(): void {
  memory = null
  write([])
}

let counter = 0
function newId(): string {
  counter += 1
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}

/** Adds an item to the end of the queue. */
export function enqueue(item: Omit<OutboxItem, 'id' | 'createdAt'>): OutboxItem {
  const full: OutboxItem = { ...item, id: newId(), createdAt: new Date().toISOString() }
  write([...all(), full])
  return full
}

const isWaiting = isUnreachable

let running: Promise<Map<string, OutboxOutcome>> | null = null

/**
 * Sends queued items in order. Returns what happened to each item it tried. Only one run at a
 * time; a second call waits for the current run and then runs again.
 */
export function flushOutbox(): Promise<Map<string, OutboxOutcome>> {
  const next = (running ?? Promise.resolve(new Map())).then(async () => {
    const outcomes = new Map<string, OutboxOutcome>()
    for (const item of all()) {
      try {
        const response = await apiRequest<unknown>(item.path, { method: 'POST', body: item.body })
        outcomes.set(item.id, { status: 'sent', response })
      } catch (error) {
        if (isWaiting(error)) break
        // A signed-out session is not the item's fault: stop and keep it. Sign out clears the
        // queue anyway.
        if (error instanceof ApiError && error.kind === 'unauthorised') break
        // A refusal (409 already done, or any other 4xx) never succeeds on retry: drop it.
        outcomes.set(item.id, {
          status: 'dropped',
          error: error instanceof ApiError ? error : new ApiError('unknown', 0, String(error)),
        })
      }
      write(all().filter((queued) => queued.id !== item.id))
    }
    return outcomes
  })
  running = next.finally(() => {
    if (running === next) running = null
  }) as Promise<Map<string, OutboxOutcome>>
  return next
}

/**
 * Queues an action and tries to send it straight away, after anything already waiting.
 * Resolves with "sent", "dropped" or "queued" (offline: it will be sent later).
 */
export async function submit(item: Omit<OutboxItem, 'id' | 'createdAt'>): Promise<OutboxOutcome> {
  const queued = enqueue(item)
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'queued' }
  const outcomes = await flushOutbox()
  return outcomes.get(queued.id) ?? { status: 'queued' }
}
