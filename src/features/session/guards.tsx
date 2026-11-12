import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { homeFor, type SessionRole } from '../../api/auth'
import { useSession } from './session'
import { OtherRoleScreen, SessionPending } from './SessionScreens'

/**
 * Lets only the given role in (api mode). Signed out goes to /login; the wrong role goes to that
 * person's own home. In mock mode everything is open, as with the role switcher.
 */
export function RequireRole({ role, children }: { role: SessionRole; children: ReactNode }) {
  const { state } = useSession()
  if (state.status === 'mock') return children
  if (state.status === 'checking' || state.status === 'error')
    return <SessionPending state={state} />
  if (state.status === 'signed-out') return <Navigate to="/login" replace />
  if (state.session.role !== role) return <Navigate to={homeFor(state.session.role)} replace />
  return children
}

/**
 * The / route in api mode: /login when signed out, otherwise the person's home. In mock mode it
 * shows the role switcher (passed as children).
 */
export function HomeRoute({ roleSwitcher }: { roleSwitcher: ReactNode }) {
  const { state } = useSession()
  if (state.status === 'mock') return roleSwitcher
  if (state.status === 'checking' || state.status === 'error')
    return <SessionPending state={state} />
  if (state.status === 'signed-out') return <Navigate to="/login" replace />
  if (state.session.role === 'other') return <OtherRoleScreen />
  return <Navigate to={homeFor(state.session.role)} replace />
}
