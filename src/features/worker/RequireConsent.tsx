import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useWorkerPreferences } from './workerPreferences'

/**
 * Sends a worker with no saved consent to the consent screen first. Used on Home only, so a
 * worker can always reach Report symptoms directly in an emergency.
 */
export function RequireConsent({ children }: { children: ReactNode }) {
  const { consentGiven } = useWorkerPreferences()
  if (!consentGiven) return <Navigate to="/worker/welcome" replace />
  return children
}
