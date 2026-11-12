import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { isMockMode } from '../../../api/config'
import { riskViewFromApi, type RiskView } from '../../../api/converters/myRisk'
import { ApiError, FALLBACK_MESSAGES, isUnreachable } from '../../../api/errors'
import { loadMyRisk } from '../../../api/liveWorker'
import { flushOutbox, pendingItems, subscribeOutbox } from '../../../api/outbox'
import { MyRiskContext, type MyRiskValue } from './myRisk'

/** The risk is refreshed this often while the app is open. */
export const RISK_REFRESH_MS = 5 * 60_000
/** Queued actions are retried this often while any are waiting. */
const OUTBOX_RETRY_MS = 30_000

const toApiError = (error: unknown) =>
  error instanceof ApiError ? error : new ApiError('unknown', 0, FALLBACK_MESSAGES.unknown)

/**
 * Api mode: loads GET /me/risk for Home and What to do, refreshes it every 5 minutes and when the
 * app comes back to the foreground, and sends queued offline actions when the connection returns.
 */
export function MyRiskProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<RiskView | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  const inFlight = useRef<Promise<boolean> | null>(null)

  const refresh = useCallback((): Promise<boolean> => {
    if (isMockMode) return Promise.resolve(true)
    inFlight.current ??= loadMyRisk({ onSlow: () => setSlow(true) })
      .then((response) => {
        setView(riskViewFromApi(response))
        setError(null)
        // The server is reachable: send anything waiting.
        if (pendingItems().length > 0) flushOutbox().catch(() => {})
        return true
      })
      .catch((caught: unknown) => {
        setError(toApiError(caught))
        return false
      })
      .finally(() => {
        setLoaded(true)
        setSlow(false)
        inFlight.current = null
      })
    return inFlight.current
  }, [])

  // First load, every 5 minutes, and when the app returns to the foreground or comes online.
  useEffect(() => {
    if (isMockMode) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), RISK_REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onOnline = () => void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [refresh])

  // Retry queued actions while any are waiting.
  useEffect(() => {
    if (isMockMode) return
    let timer: number | undefined
    const schedule = () => {
      window.clearInterval(timer)
      timer = undefined
      if (pendingItems().length === 0) return
      timer = window.setInterval(() => {
        if (navigator.onLine) flushOutbox().catch(() => {})
      }, OUTBOX_RETRY_MS)
    }
    schedule()
    const unsubscribe = subscribeOutbox(schedule)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [])

  const value = useMemo<MyRiskValue>(() => {
    if (isMockMode) {
      return { status: 'mock', slow: false, view: null, error: null, unreachable: false, refresh }
    }
    return {
      status: view ? 'ready' : loaded ? 'error' : 'loading',
      slow,
      view,
      error,
      unreachable: isUnreachable(error),
      refresh,
    }
  }, [view, error, loaded, slow, refresh])

  return <MyRiskContext.Provider value={value}>{children}</MyRiskContext.Provider>
}
