import { createContext, useContext } from 'react'
import type { Session, SignInOptions } from '../../api/auth'

export type SessionState =
  /** Sample data: no login, the role switcher on / picks a role. */
  | { status: 'mock' }
  /** Restoring a saved session on start. slow turns true after 3 seconds. */
  | { status: 'checking'; slow: boolean }
  | { status: 'signed-out' }
  /**
   * offline: the server could not be reached on start, so this is the session saved on the
   * device. The worker keeps field mode; it is checked again when the connection returns.
   */
  | { status: 'signed-in'; session: Session; offline: boolean }
  /** Restoring failed for another reason. Try again, or sign out. */
  | { status: 'error'; message: string }

export interface SessionValue {
  state: SessionState
  signIn: (loginId: string, pin: string, options?: SignInOptions) => Promise<Session>
  /** Clears the tokens and personal data on this device, then goes to /login. */
  signOut: () => void
  /** Tries to restore the session again after an error. */
  retry: () => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}

/** The signed-in session, or null in mock mode or when signed out. */
export function useCurrentSession(): Session | null {
  const { state } = useSession()
  return state.status === 'signed-in' ? state.session : null
}
