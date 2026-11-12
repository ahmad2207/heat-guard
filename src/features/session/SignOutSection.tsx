import { Button } from '../../components/Button'
import { useSession } from './session'
import { SESSION_TEXT } from './text'

/** "Signed in as W-0301" and Sign out, for My data. Hidden in mock mode (no login). */
export function SignOutSection() {
  const { state, signOut } = useSession()
  if (state.status !== 'signed-in') return null
  const { session } = state
  return (
    <section aria-label={SESSION_TEXT.account} className="flex flex-col gap-2 pt-2">
      <p className="m-0 text-center text-[14px] text-muted">
        {SESSION_TEXT.signedInAs(session.worker?.code ?? session.loginId)}
      </p>
      <Button variant="secondary" fullWidth onClick={signOut}>
        {SESSION_TEXT.signOut}
      </Button>
    </section>
  )
}
