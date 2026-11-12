import { useEffect, useRef } from 'react'
import { isMockMode } from '../../../api/config'
import { sendHeartbeat } from '../../../api/liveWorker'
import { useBattery, type BatteryState } from '../../../lib/useBattery'

/** How often the app tells the backend it is open. */
export const HEARTBEAT_MS = 5 * 60_000

/**
 * Api mode: POST /me/heartbeat every 5 minutes while a signed-in worker has the app visible and
 * online, with the battery level when the browser reports it. Paused when hidden or offline;
 * one is sent as soon as the app is visible and online again. No UI and no console output.
 */
export function Heartbeat() {
  const battery = useBattery()
  // The latest battery reading, read when a heartbeat is sent, so a change does not restart the timer.
  const batteryRef = useRef<BatteryState | null>(battery)
  useEffect(() => {
    batteryRef.current = battery
  }, [battery])

  useEffect(() => {
    if (isMockMode) return
    let timer: number | undefined
    const active = () => document.visibilityState === 'visible' && navigator.onLine

    const stop = () => {
      window.clearInterval(timer)
      timer = undefined
    }
    const start = () => {
      stop()
      if (!active()) return
      void sendHeartbeat(batteryRef.current)
      timer = window.setInterval(() => {
        if (active()) void sendHeartbeat(batteryRef.current)
      }, HEARTBEAT_MS)
    }

    start()
    document.addEventListener('visibilitychange', start)
    window.addEventListener('online', start)
    window.addEventListener('offline', stop)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', start)
      window.removeEventListener('online', start)
      window.removeEventListener('offline', stop)
    }
  }, [])

  return null
}
