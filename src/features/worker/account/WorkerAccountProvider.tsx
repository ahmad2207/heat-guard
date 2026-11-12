import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isMockMode } from '../../../api/config'
import { ApiError, FALLBACK_MESSAGES } from '../../../api/errors'
import {
  loadWorkerAccount,
  saveConsents,
  saveLanguage,
  saveReadAloud,
  type WorkerAccount,
} from '../../../api/workerProfile'
import { useWorkerPreferences } from '../workerPreferences'
import {
  WorkerAccountContext,
  type WorkerAccountState,
  type WorkerAccountValue,
} from './workerAccount'

/**
 * Api mode: loads the worker's account (GET /me and the consent history) in the background for
 * the worker screens, and saves language, read aloud and consent changes. Screens that do not
 * need it, such as Report symptoms, never wait for it.
 */
export function WorkerAccountProvider({ children }: { children: ReactNode }) {
  const { applyServer } = useWorkerPreferences()
  const [state, setState] = useState<WorkerAccountState>(() =>
    isMockMode ? { status: 'mock' } : { status: 'loading', slow: false },
  )
  const [attempt, setAttempt] = useState(0)

  /** Keeps the account and the device copy of its non-health values in step. */
  const ready = useCallback(
    (account: WorkerAccount) => {
      setState({ status: 'ready', account })
      applyServer({
        consentGiven: account.hasChosen,
        language: account.language,
        sharing: { ...account.consents, voice: account.readAloud },
      })
    },
    [applyServer],
  )

  useEffect(() => {
    if (isMockMode) return
    const controller = new AbortController()
    loadWorkerAccount({
      signal: controller.signal,
      onSlow: () =>
        setState((s) => (s.status === 'loading' ? { status: 'loading', slow: true } : s)),
    }).then(ready, (error: unknown) => {
      if (controller.signal.aborted) return
      setState({
        status: 'error',
        error:
          error instanceof ApiError ? error : new ApiError('unknown', 0, FALLBACK_MESSAGES.unknown),
      })
    })
    return () => controller.abort()
  }, [attempt, ready])

  const current = state.status === 'ready' ? state.account : null
  const value = useMemo<WorkerAccountValue>(() => {
    const change = (update: Partial<WorkerAccount>) => {
      if (current) ready({ ...current, ...update })
    }
    return {
      state,
      reload: () => {
        setState({ status: 'loading', slow: false })
        setAttempt((n) => n + 1)
      },
      refresh: async () => {
        ready(await loadWorkerAccount())
      },
      setLanguage: async (language) => {
        await saveLanguage(language)
        change({ language })
      },
      setReadAloud: async (readAloud) => {
        await saveReadAloud(readAloud)
        change({ readAloud })
      },
      setConsents: async (choices) => {
        const consents = await saveConsents(choices)
        change({ consents, hasChosen: true })
      },
    }
  }, [state, current, ready])

  return <WorkerAccountContext.Provider value={value}>{children}</WorkerAccountContext.Provider>
}
