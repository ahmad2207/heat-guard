import type { ReactNode } from 'react'
import { Button } from '../../components/Button'
import { ThermometerIcon } from '../../components/icons'
import { ErrorState, LoadingState } from '../../components/LoadStates'
import type { SessionState } from './session'
import { useSession } from './session'
import { SESSION_TEXT } from './text'

/** A centred column on the ground colour, used by sign in and the session screens. */
export function SessionPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ground px-4 py-8 text-ink">
      <main className="mx-auto my-auto flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <ThermometerIcon size={34} className="text-brand" />
          <span className="text-[30px] font-extrabold tracking-[-0.01em]">
            {SESSION_TEXT.appName}
          </span>
        </div>
        {children}
      </main>
    </div>
  )
}

/** Shown while a saved session is restored, or when restoring failed. */
export function SessionPending({
  state,
}: {
  state: Extract<SessionState, { status: 'checking' | 'error' }>
}) {
  const { retry, signOut } = useSession()
  return (
    <SessionPage>
      {state.status === 'checking' ? (
        <LoadingState slow={state.slow} label={SESSION_TEXT.checking} />
      ) : (
        <div className="flex flex-col gap-3">
          <ErrorState message={state.message} onRetry={retry} />
          <Button variant="secondary" fullWidth onClick={signOut}>
            {SESSION_TEXT.signOut}
          </Button>
        </div>
      )}
    </SessionPage>
  )
}

/** For a signed-in account that is neither a worker nor a supervisor. */
export function OtherRoleScreen() {
  const { signOut } = useSession()
  return (
    <SessionPage>
      <section
        aria-labelledby="other-role"
        className="flex flex-col gap-4 rounded-2xl bg-surface p-4"
      >
        <h1 id="other-role" className="m-0 text-[20px] font-extrabold">
          {SESSION_TEXT.otherRole}
        </h1>
        <Button fullWidth onClick={signOut}>
          {SESSION_TEXT.signOut}
        </Button>
      </section>
    </SessionPage>
  )
}
