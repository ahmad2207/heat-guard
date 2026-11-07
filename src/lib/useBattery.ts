import { useEffect, useState } from 'react'

export interface BatteryState {
  /** 0 to 100 */
  percent: number
  charging: boolean
}

// navigator.getBattery is not in TypeScript's DOM types: it is only in Chromium-based browsers.
interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
}
type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryManager> }

/** The real battery where the browser can report it, otherwise null. */
export function useBattery(): BatteryState | null {
  const [battery, setBattery] = useState<BatteryState | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery
    if (typeof nav.getBattery !== 'function') return

    let manager: BatteryManager | undefined
    let cancelled = false
    const update = () => {
      if (manager && !cancelled) {
        setBattery({ percent: Math.round(manager.level * 100), charging: manager.charging })
      }
    }

    nav
      .getBattery()
      .then((result) => {
        manager = result
        update()
        manager.addEventListener('levelchange', update)
        manager.addEventListener('chargingchange', update)
      })
      .catch(() => {
        // Not allowed here (for example inside some iframes). Keep the sample value.
      })

    return () => {
      cancelled = true
      manager?.removeEventListener('levelchange', update)
      manager?.removeEventListener('chargingchange', update)
    }
  }, [])

  return battery
}
