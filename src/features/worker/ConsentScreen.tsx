import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isMockMode } from '../../api/config'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import type { WorkerAccount } from '../../api/workerProfile'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { WarningIcon } from '../../components/icons'
import { Switch } from '../../components/Switch'
import { LANGUAGES, ONBOARDING } from '../../data/mock'
import type { Language, SharingChoices } from '../../data/types'
import { cn } from '../../lib/cn'
import { useWorkerAccount } from './account/workerAccount'
import { WithWorkerAccount } from './account/WithWorkerAccount'
import { useWorkerPreferences } from './workerPreferences'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

type ConsentSwitches = Pick<SharingChoices, 'health' | 'band' | 'reports'>

/** Where "Agree and continue" leads. The state tells the health profile to go back here. */
const AFTER_CONSENT = { to: '/worker/health-profile', state: { fromWelcome: true } }

interface ConsentViewProps {
  language: Language
  onLanguage: (language: Language) => void
  switches: ConsentSwitches
  onSwitch: (id: keyof ConsentSwitches, on: boolean) => void
  onAgree: () => void
  busy?: boolean
  error?: string | null
}

/** Screen 1: consent and choices. Values from design-reference/html/01-consent.html. */
function ConsentView({
  language,
  onLanguage,
  switches,
  onSwitch,
  onAgree,
  busy = false,
  error = null,
}: ConsentViewProps) {
  const languageId = useId()
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div role="img" aria-label={ONBOARDING.steps.label} className="flex gap-1.5">
          {Array.from({ length: ONBOARDING.steps.total }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 w-7 rounded-[3px]',
                index < ONBOARDING.steps.current ? 'bg-ink' : 'bg-field',
              )}
            />
          ))}
        </div>
        <label htmlFor={languageId} className="sr-only">
          Language
        </label>
        {/* Saved, but visual only for now. Translations come after Phase 9. */}
        <select
          id={languageId}
          value={language}
          onChange={(event) => onLanguage(event.target.value as Language)}
          className={cn(
            'h-11 rounded-full border border-field bg-surface px-3 text-[15px] font-bold text-ink',
            focusRing,
          )}
        >
          {LANGUAGES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4">
        <div className="flex flex-col gap-1.5 px-1">
          <h1 className="m-0 text-[26px] leading-[1.15] font-extrabold">{ONBOARDING.heading}</h1>
          <p className="m-0 text-[16px] leading-[1.45] text-muted">{ONBOARDING.intro}</p>
        </div>

        <Card aria-label="Needed for warnings" className="flex items-center gap-3 py-3.5">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[16px] font-bold">{ONBOARDING.workDetails.title}</span>
            <span className="text-[14px] leading-[1.4] text-muted">
              {ONBOARDING.workDetails.detail}
            </span>
          </span>
          <span className="rounded-full bg-ground px-2.5 py-1.5 text-[13px] font-bold text-muted">
            {ONBOARDING.workDetails.badge}
          </span>
        </Card>

        <Card aria-label="Optional" className="py-1">
          {ONBOARDING.switches.map((item, index) => (
            <Switch
              key={item.id}
              label={item.label}
              description={item.description}
              checked={switches[item.id as keyof ConsentSwitches]}
              onChange={(on) => onSwitch(item.id as keyof ConsentSwitches, on)}
              divider={index < ONBOARDING.switches.length - 1}
            />
          ))}
        </Card>

        <section
          aria-label={ONBOARDING.promiseTitle}
          className="flex flex-col gap-2 rounded-2xl bg-ink px-4 py-3.5 text-surface"
        >
          <h2 className="m-0 text-[15px] font-extrabold text-ink-accent">
            {ONBOARDING.promiseTitle}
          </h2>
          <p className="m-0 text-[14px] leading-[1.5]">{ONBOARDING.promise}</p>
        </section>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {error && (
          <p
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className={cn(
              'm-0 flex items-start gap-2.5 rounded-xl border-2 border-risk-4 bg-danger-bg px-3.5 py-3 text-[15px] leading-[1.4] font-bold text-danger-text',
              focusRing,
            )}
          >
            <WarningIcon size={20} strokeWidth={2.2} className="mt-px shrink-0" />
            {error}
          </p>
        )}
        <Button size="lg" fullWidth onClick={onAgree} disabled={busy}>
          {busy ? ONBOARDING.saving : ONBOARDING.agree}
        </Button>
        <Link
          to="/worker/privacy"
          className={cn(
            'flex h-11 items-center justify-center rounded-xl text-[15px] font-bold text-ink underline',
            focusRing,
          )}
        >
          {ONBOARDING.privacyLink}
        </Link>
      </div>
    </>
  )
}

/** Sample data: choices are kept on the device. */
function MockConsentScreen() {
  const navigate = useNavigate()
  const { language, setLanguage, sharing, setSharing, giveConsent } = useWorkerPreferences()
  return (
    <ConsentView
      language={language}
      onLanguage={setLanguage}
      switches={sharing}
      onSwitch={setSharing}
      onAgree={() => {
        giveConsent()
        navigate(AFTER_CONSENT.to, { state: AFTER_CONSENT.state })
      }}
    />
  )
}

/**
 * Api mode: the choices start from the server and are saved on "Agree and continue": the
 * language with PATCH /me/preferences, the three switches with PUT /me/consents.
 */
function ApiConsentForm({ account }: { account: WorkerAccount }) {
  const navigate = useNavigate()
  const { setLanguage, setConsents } = useWorkerAccount()
  const [language, setDraftLanguage] = useState(account.language)
  const [switches, setSwitches] = useState<ConsentSwitches>(account.consents)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function agree() {
    setBusy(true)
    setError(null)
    try {
      if (language !== account.language) await setLanguage(language)
      await setConsents(switches)
      navigate(AFTER_CONSENT.to, { state: AFTER_CONSENT.state })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : FALLBACK_MESSAGES.unknown)
      setBusy(false)
    }
  }

  return (
    <ConsentView
      language={language}
      onLanguage={setDraftLanguage}
      switches={switches}
      onSwitch={(id, on) => setSwitches((current) => ({ ...current, [id]: on }))}
      onAgree={agree}
      busy={busy}
      error={error}
    />
  )
}

export function ConsentScreen() {
  if (isMockMode) return <MockConsentScreen />
  return <WithWorkerAccount>{(account) => <ApiConsentForm account={account} />}</WithWorkerAccount>
}
