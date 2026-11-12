import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isUnreachable } from '../../api/errors'
import { ErrorState, LoadingState } from '../../components/LoadStates'
import { useWorkerAccount } from './account/workerAccount'
import { ScreenStatus } from './account/WithWorkerAccount'
import { useWorkerPreferences } from './workerPreferences'

/**
 * Sends a worker who has never made a consent choice to the consent screen first. Used on Home
 * only, so a worker can always reach Report symptoms directly in an emergency.
 *
 * Api mode: "never chosen" comes from the consent history (GET /workers/{id}/consents). If the
 * server cannot be reached, Home still opens so field mode keeps working offline.
 */
export function RequireConsent({ children }: { children: ReactNode }) {
  const { consentGiven } = useWorkerPreferences()
  const { state, reload } = useWorkerAccount()

  if (state.status === 'mock') {
    return consentGiven ? children : <Navigate to="/worker/welcome" replace />
  }
  if (state.status === 'ready') {
    return state.account.hasChosen ? children : <Navigate to="/worker/welcome" replace />
  }
  // While loading, a worker known on this device to have chosen goes straight in.
  if (state.status === 'loading') {
    if (consentGiven) return children
    return (
      <ScreenStatus>
        <LoadingState slow={state.slow} />
      </ScreenStatus>
    )
  }
  // Offline or the server is down: never block field mode.
  if (isUnreachable(state.error)) return children
  return (
    <ScreenStatus>
      <ErrorState message={state.error.message} onRetry={reload} />
    </ScreenStatus>
  )
}
