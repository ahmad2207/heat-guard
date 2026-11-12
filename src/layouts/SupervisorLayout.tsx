import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { isMockMode } from '../api/config'
import { SupervisorHeader } from '../components/SupervisorHeader'
import { useSession } from '../features/session/session'
import { SESSION_TEXT } from '../features/session/text'
import { useRouteHandle } from './routeHandle'
import { SupervisorStatusContext } from './supervisorStatus'

/** First letter of the login ID, for the account button ("S-001" shows "S"). */
const initialsFor = (loginId: string) =>
  loginId
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 1)
    .toUpperCase()

/** Dark header with Today, Plan and Measures, then a content area up to 1360px wide. */
export function SupervisorLayout() {
  const { supervisorHeader } = useRouteHandle()
  const { state, signOut } = useSession()
  const session = state.status === 'signed-in' ? state.session : null
  // Api mode: each page sets its own live status; it is cleared when the page changes.
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const { pathname } = useLocation()
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setLiveStatus(null)
  }
  const status = isMockMode ? supervisorHeader?.status : (liveStatus ?? undefined)
  // Signed in (api mode): every page shows the account button with Sign out, Measures included.
  // Mock mode keeps the design: no account button on Measures.
  const initials = session
    ? initialsFor(session.loginId) || SESSION_TEXT.account.slice(0, 1)
    : supervisorHeader?.initials

  return (
    <div className="min-h-dvh bg-ground text-ink">
      <SupervisorHeader
        status={status}
        showRole={supervisorHeader?.showRole ?? true}
        initials={initials}
        account={
          session
            ? {
                signedInAs: SESSION_TEXT.signedInAs(session.loginId),
                signOutLabel: SESSION_TEXT.signOut,
                onSignOut: signOut,
              }
            : undefined
        }
      />
      {/* 1360px of content plus 24px padding each side, as in the design HTML. */}
      <main className="mx-auto flex max-w-[1408px] flex-col gap-5 p-6">
        <SupervisorStatusContext.Provider value={setLiveStatus}>
          <Outlet />
        </SupervisorStatusContext.Provider>
      </main>
    </div>
  )
}
