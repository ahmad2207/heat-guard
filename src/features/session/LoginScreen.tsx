import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { homeFor, SIGN_IN_FAILED } from '../../api/auth'
import { ApiError } from '../../api/errors'
import { Button } from '../../components/Button'
import { WarningIcon } from '../../components/icons'
import { WAKING_NOTE, WAKING_TEXT } from '../../components/LoadStates'
import { cn } from '../../lib/cn'
import { useSession } from './session'
import { SessionPage, SessionPending } from './SessionScreens'
import { SESSION_TEXT } from './text'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'
const inputClass = cn(
  'min-h-12 w-full rounded-xl border border-field bg-surface px-3.5 text-[17px] placeholder:text-muted',
  focusRing,
)

/** /login (api mode). Worker or staff ID and PIN. Every failure shows exactly "Invalid ID or PIN". */
export function LoginScreen() {
  const { state, signIn } = useSession()
  const navigate = useNavigate()
  const ids = useId()
  const [loginId, setLoginId] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [slow, setSlow] = useState(false)
  /** The error shown after a failed sign-in, or null. */
  const [error, setError] = useState<string | null>(null)
  const failed = error !== null
  // Only a refused ID or PIN marks the fields invalid; a connection problem does not.
  const refused = error === SIGN_IN_FAILED
  // Counts failures so the error is focused again after each one.
  const [failures, setFailures] = useState(0)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (failures > 0) errorRef.current?.focus()
  }, [failures])

  if (state.status === 'mock') return <Navigate to="/" replace />
  if (state.status === 'checking' || state.status === 'error')
    return <SessionPending state={state} />
  if (state.status === 'signed-in' && !busy)
    return <Navigate to={homeFor(state.session.role)} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setSlow(false)
    setError(null)
    try {
      const session = await signIn(loginId, pin, { onSlow: () => setSlow(true) })
      navigate(homeFor(session.role), { replace: true })
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : SIGN_IN_FAILED
      if (message === SIGN_IN_FAILED) setPin('')
      setError(message)
      setFailures((n) => n + 1)
    } finally {
      setBusy(false)
      setSlow(false)
    }
  }

  const errorId = `${ids}-error`
  const describedBy = (hint: string) => cn(hint, failed && errorId) || undefined

  return (
    <SessionPage>
      <form
        onSubmit={submit}
        noValidate
        aria-labelledby={`${ids}-heading`}
        className="flex flex-col gap-4 rounded-2xl bg-surface p-4"
      >
        <div className="flex flex-col gap-1">
          <h1 id={`${ids}-heading`} className="m-0 text-[24px] font-extrabold">
            {SESSION_TEXT.heading}
          </h1>
          <p className="m-0 text-[15px] leading-[1.45] text-muted">{SESSION_TEXT.intro}</p>
        </div>

        {failed && (
          <p
            ref={errorRef}
            id={errorId}
            role="alert"
            tabIndex={-1}
            className={cn(
              'm-0 flex items-center gap-2.5 rounded-xl border-2 border-risk-4 bg-danger-bg px-3.5 py-3 text-[15px] font-bold text-danger-text',
              focusRing,
            )}
          >
            <WarningIcon size={20} strokeWidth={2.2} className="shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-id`} className="text-[15px] font-bold">
            {SESSION_TEXT.idLabel}
          </label>
          <span id={`${ids}-id-hint`} className="text-[13px] text-muted">
            {SESSION_TEXT.idHint}
          </span>
          <input
            id={`${ids}-id`}
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            required
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            aria-invalid={refused || undefined}
            aria-describedby={describedBy(`${ids}-id-hint`)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-pin`} className="text-[15px] font-bold">
            {SESSION_TEXT.pinLabel}
          </label>
          <span id={`${ids}-pin-hint`} className="text-[13px] text-muted">
            {SESSION_TEXT.pinHint}
          </span>
          <div className="flex gap-2">
            <input
              id={`${ids}-pin`}
              name="password"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              maxLength={6}
              required
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
              aria-invalid={refused || undefined}
              aria-describedby={describedBy(`${ids}-pin-hint`)}
              className={cn(inputClass, 'min-w-0 flex-1 font-mono tracking-[0.2em]')}
            />
            <Button
              variant="secondary"
              aria-pressed={showPin}
              onClick={() => setShowPin((value) => !value)}
              className="shrink-0"
            >
              {showPin ? SESSION_TEXT.hidePin : SESSION_TEXT.showPin}
            </Button>
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={busy} aria-disabled={busy}>
          {busy ? SESSION_TEXT.signingIn : SESSION_TEXT.signIn}
        </Button>

        {busy && slow && (
          <p role="status" className="m-0 flex flex-col gap-0.5 text-center">
            <span className="text-[15px] font-bold">{WAKING_TEXT}</span>
            <span className="text-[14px] text-muted">{WAKING_NOTE}</span>
          </p>
        )}
      </form>
    </SessionPage>
  )
}
