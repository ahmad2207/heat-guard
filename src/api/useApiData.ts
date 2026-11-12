import { useCallback, useEffect, useState } from 'react'
import { ApiError, FALLBACK_MESSAGES } from './errors'

export interface LoadContext {
  signal: AbortSignal
  onSlow: () => void
}

/** Pass a stable function (useCallback or module level): a new function starts a new load. */
export type Loader<T> = (context: LoadContext) => Promise<T>

export type ApiDataState<T> =
  /** slow turns true after 3 seconds: show "Waking up the server...". */
  | { status: 'loading'; slow: boolean }
  | { status: 'error'; error: ApiError }
  | { status: 'empty' }
  | { status: 'ready'; data: T }

type Outcome<T> = Exclude<ApiDataState<T>, { status: 'loading' }>

function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('unknown', 0, FALLBACK_MESSAGES.unknown)
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Loads data for a screen with loading, slow, error, empty and ready states, and a retry.
 * isEmpty decides when loaded data counts as empty (for example an empty list).
 */
export function useApiData<T>(
  load: Loader<T>,
  isEmpty?: (data: T) => boolean,
): ApiDataState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  // Results are tagged with the load and attempt they belong to, so a stale result never shows.
  const [result, setResult] = useState<{ load: Loader<T>; attempt: number; outcome: Outcome<T> }>()
  const [slowFor, setSlowFor] = useState<{ load: Loader<T>; attempt: number }>()

  useEffect(() => {
    const controller = new AbortController()
    load({
      signal: controller.signal,
      onSlow: () => setSlowFor({ load, attempt }),
    }).then(
      (data) => {
        const outcome: Outcome<T> = isEmpty?.(data)
          ? { status: 'empty' }
          : { status: 'ready', data }
        setResult({ load, attempt, outcome })
      },
      (error: unknown) => {
        if (isAbort(error)) return
        setResult({ load, attempt, outcome: { status: 'error', error: asApiError(error) } })
      },
    )
    return () => controller.abort()
    // isEmpty is read once per load on purpose; it does not start a new load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  const current = result?.load === load && result.attempt === attempt ? result.outcome : null
  if (current) return { ...current, retry }
  const slow = slowFor?.load === load && slowFor.attempt === attempt
  return { status: 'loading', slow, retry }
}
