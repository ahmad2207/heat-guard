import { useMatches } from 'react-router-dom'

/** Per-route settings read by the layouts. Set with `handle` in src/router.tsx. */
export interface RouteHandle {
  /** Worker routes that show the bottom navigation. */
  bottomNav?: boolean
  /** Supervisor header settings for this route. */
  supervisorHeader?: {
    status?: string
    showRole?: boolean
    initials?: string
  }
}

/** The settings of the deepest matching route that sets them. */
export function useRouteHandle(): RouteHandle {
  const matches = useMatches()
  const merged: RouteHandle = {}
  for (const match of matches) {
    Object.assign(merged, (match.handle as RouteHandle | undefined) ?? {})
  }
  return merged
}
