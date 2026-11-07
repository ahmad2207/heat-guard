import { useState } from 'react'
import { useDevSettings } from '../../dev/devSettings'
import { useOnlineStatus } from '../../lib/useOnlineStatus'

export type ReconnectStatus = 'idle' | 'checking' | 'failed'

/**
 * Asks the network for a file that is never served from the offline cache. The query string keeps
 * it out of the service worker's precache, and no-store keeps it out of the HTTP cache.
 */
async function canReachServer(): Promise<boolean> {
  try {
    const response = await fetch(`/favicon.ico?reconnect=${Date.now()}`, { cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Field mode (screen 7) is on when the browser reports offline, or when the dev panel forces it.
 * "Try to reconnect" checks the server directly, so it also works when the browser's online flag
 * is slow to update.
 */
export function useFieldMode() {
  const isOnline = useOnlineStatus()
  const { forceFieldMode, setForceFieldMode } = useDevSettings()
  const [reachedServer, setReachedServer] = useState(false)
  const [status, setStatus] = useState<ReconnectStatus>('idle')

  // When the browser goes offline again, forget the last successful check.
  const [previousOnline, setPreviousOnline] = useState(isOnline)
  if (isOnline !== previousOnline) {
    setPreviousOnline(isOnline)
    if (!isOnline) {
      setReachedServer(false)
      setStatus('idle')
    }
  }

  const active = forceFieldMode || (!isOnline && !reachedServer)

  async function reconnect() {
    setStatus('checking')
    const ok = await canReachServer()
    if (ok) {
      setReachedServer(true)
      setForceFieldMode(false)
      setStatus('idle')
    } else {
      setStatus('failed')
    }
  }

  return { active, reconnect, status }
}
