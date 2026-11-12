import { createContext, useContext } from 'react'

/**
 * Api mode: a page sets the live status shown in the supervisor header, for example
 * "Updated 13:04 · WBGT estimated from weather data". Mock mode uses the route's sample text.
 */
export const SupervisorStatusContext = createContext<(status: string | null) => void>(() => {})

export function useSetSupervisorStatus() {
  return useContext(SupervisorStatusContext)
}
