import { useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Switch } from '../../components/Switch'
import { LANGUAGES, ONBOARDING } from '../../data/mock'
import type { Language } from '../../data/types'
import { cn } from '../../lib/cn'
import { useWorkerPreferences } from './workerPreferences'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/** Screen 1: consent and choices. Values from design-reference/html/01-consent.html. */
export function ConsentScreen() {
  const navigate = useNavigate()
  const languageId = useId()
  const { language, setLanguage, sharing, setSharing, giveConsent } = useWorkerPreferences()

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
          onChange={(event) => setLanguage(event.target.value as Language)}
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
              checked={sharing[item.id]}
              onChange={(on) => setSharing(item.id, on)}
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
        <Button
          size="lg"
          fullWidth
          onClick={() => {
            giveConsent()
            navigate('/worker/health-profile')
          }}
        >
          {ONBOARDING.agree}
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
