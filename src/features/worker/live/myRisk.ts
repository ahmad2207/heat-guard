import { createContext, useContext, useSyncExternalStore } from 'react'
import type { RiskView } from '../../../api/converters/myRisk'
import type { ApiError } from '../../../api/errors'
import { pendingItems, subscribeOutbox, type OutboxKind } from '../../../api/outbox'

export interface MyRiskValue {
  /** mock: sample data. loading: first load. ready: view is set. error: never loaded. */
  status: 'mock' | 'loading' | 'ready' | 'error'
  /** After 3 seconds of the first load: show "Waking up the server...". */
  slow: boolean
  /** The latest risk from the server, kept while later refreshes fail. */
  view: RiskView | null
  error: ApiError | null
  /** The last try could not reach the server (offline, timeout or server error). */
  unreachable: boolean
  /** Loads the risk again now. Resolves true when it worked. */
  refresh: () => Promise<boolean>
}

export const MyRiskContext = createContext<MyRiskValue | null>(null)

export function useMyRisk(): MyRiskValue {
  const value = useContext(MyRiskContext)
  if (!value) throw new Error('useMyRisk must be used inside MyRiskProvider')
  return value
}

/** How many actions of these kinds are waiting to be sent. Updates when the queue changes. */
export function usePendingCount(kinds: OutboxKind[]): number {
  return useSyncExternalStore(
    subscribeOutbox,
    () => pendingItems().filter((item) => kinds.includes(item.kind)).length,
    () => 0,
  )
}
