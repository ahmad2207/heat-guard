import { useCallback, useEffect, useRef, useState } from 'react'
import type { TodayView } from '../../api/converters/siteToday'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import { loadSiteToday, type TodayFilters } from '../../api/supervisor'

/** Today is refreshed this often while it is open. */
export const TODAY_REFRESH_MS = 5 * 60_000

/**
 * GET /sites/{id}/today for the chosen filters. The first load shows the loading (and after 3
 * seconds "Waking up the server...") or error state. Later loads keep the page on screen:
 * every 5 minutes, when the window gets focus again, after a filter change and after a button.
 */
export function useLiveToday(siteId: string, filters: TodayFilters) {
  const [data, setData] = useState<TodayView | null>(null)
  /** The filters the shown data was loaded with. */
  const [dataFilters, setDataFilters] = useState<TodayFilters | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [slow, setSlow] = useState(false)
  const [updating, setUpdating] = useState(false)
  // Only the latest request may change the page, so a slow old answer never replaces a new one.
  const latest = useRef(0)
  const { crewId, activity, shift } = filters

  const reload = useCallback(async () => {
    const request = ++latest.current
    setUpdating(true)
    try {
      const view = await loadSiteToday(
        siteId,
        { crewId, activity, shift },
        { onSlow: () => request === latest.current && setSlow(true) },
      )
      if (request !== latest.current) return
      setData(view)
      setDataFilters({ crewId, activity, shift })
      setError(null)
    } catch (caught) {
      if (request !== latest.current) return
      setError(
        caught instanceof ApiError ? caught : new ApiError('unknown', 0, FALLBACK_MESSAGES.unknown),
      )
    } finally {
      if (request === latest.current) {
        setUpdating(false)
        setSlow(false)
      }
    }
  }, [siteId, crewId, activity, shift])

  useEffect(() => {
    // First load on the next tick, so no state is set while the effect itself runs.
    const first = window.setTimeout(() => void reload(), 0)
    const timer = window.setInterval(() => void reload(), TODAY_REFRESH_MS)
    const onFocus = () => void reload()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { data, dataFilters, error, slow, updating, reload }
}
