import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { restoreSession, signIn as apiSignIn, signOutTokens, type Session } from '../../api/auth'
import { setSessionExpiredHandler } from '../../api/client'
import { clearSavedRisk } from '../../api/liveWorker'
import { clearOutbox } from '../../api/outbox'
import { isMockMode } from '../../api/config'
import { FALLBACK_MESSAGES } from '../../api/errors'
import { setSiteTimeZone } from '../../lib/format'
import { useWorkerPreferences } from '../worker/workerPreferences'
import { SessionContext, type SessionState, type SessionValue } from './session'
import { clearCachedSession, loadCachedSession, saveCachedSession } from './sessionCache'

/**
 * Holds who is signed in (api mode only). On start it restores a saved session; offline it falls
 * back to the session saved on the device so a worker keeps field mode.
 */
export function SessionProvider({
  children,
  onSignedOut,
}: {
  children: ReactNode
  /** Called after sign out or when the session cannot be renewed. Goes to /login. */
  onSignedOut: () => void
}) {
  const { resetOnboarding } = useWorkerPreferences()
  const [state, setState] = useState<SessionState>(() =>
    isMockMode ? { status: 'mock' } : { status: 'checking', slow: false },
  )
  const [attempt, setAttempt] = useState(0)

  const signedIn = useCallback((session: Session, offline: boolean) => {
    saveCachedSession(session)
    setSiteTimeZone(session.site?.timezone)
    setState({ status: 'signed-in', session, offline })
  }, [])

  /** Clears tokens and personal data on this device. */
  const clearLocal = useCallback(() => {
    signOutTokens()
    clearCachedSession()
    // The saved forecast and any actions still waiting to be sent belong to this person.
    clearSavedRisk()
    clearOutbox()
    resetOnboarding()
    setState({ status: 'signed-out' })
  }, [resetOnboarding])

  const signOut = useCallback(() => {
    clearLocal()
    onSignedOut()
  }, [clearLocal, onSignedOut])

  // The API client calls this when a refresh is refused mid-session.
  useEffect(() => {
    if (isMockMode) return
    setSessionExpiredHandler(signOut)
  }, [signOut])

  // Restore on start, and again after "Try again".
  useEffect(() => {
    if (isMockMode) return
    let cancelled = false
    restoreSession({ onSlow: () => !cancelled && setState({ status: 'checking', slow: true }) })
      .then((result) => {
        if (cancelled) return
        if (result.status === 'signed-in') return signedIn(result.session, false)
        if (result.status === 'signed-out') return clearLocal()
        const cached = loadCachedSession()
        if (cached) return signedIn(cached, true)
        setState({ status: 'error', message: result.error.message })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: FALLBACK_MESSAGES.unknown })
      })
    return () => {
      cancelled = true
    }
  }, [attempt, signedIn, clearLocal])

  // A session restored offline is checked again as soon as the connection returns.
  const offline = state.status === 'signed-in' && state.offline
  useEffect(() => {
    if (!offline) return
    const recheck = () => {
      restoreSession().then(
        (result) => {
          if (result.status === 'signed-in') signedIn(result.session, false)
          if (result.status === 'signed-out') signOut()
        },
        () => {},
      )
    }
    window.addEventListener('online', recheck)
    return () => window.removeEventListener('online', recheck)
  }, [offline, signedIn, signOut])

  const value = useMemo<SessionValue>(
    () => ({
      state,
      signIn: async (loginId, pin, options) => {
        const session = await apiSignIn(loginId, pin, options)
        signedIn(session, false)
        return session
      },
      signOut,
      retry: () => {
        setState({ status: 'checking', slow: false })
        setAttempt((n) => n + 1)
      },
    }),
    [state, signedIn, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
