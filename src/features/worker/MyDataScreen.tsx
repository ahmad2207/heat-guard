import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, LockIcon, ShieldIcon } from '../../components/icons'
import { SectionLabel } from '../../components/SectionLabel'
import { Switch } from '../../components/Switch'
import { MY_DATA, PRECAUTION_LEVELS, precautionFor, WORKER } from '../../data/mock'
import { cn } from '../../lib/cn'
import { SignOutSection } from '../session/SignOutSection'
import { downloadMyData } from './downloadMyData'
import { useWorkerPreferences } from './workerPreferences'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

// The supervisor row uses a shield on warm orange (06-my-data.html).
const ACCESS_ICONS = {
  supervisor: { Icon: ShieldIcon, className: 'bg-warn-bg text-warn-strong' },
} as const

/**
 * "Download my data" and the two-step "Delete my health information". Deleting clears the
 * health profile answers only; consent choices stay.
 */
function YourDataSection() {
  const preferences = useWorkerPreferences()
  const [step, setStep] = useState<'idle' | 'confirming' | 'deleted'>('idle')
  const confirmRef = useRef<HTMLParagraphElement>(null)
  const deletedRef = useRef<HTMLParagraphElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const [returnFocus, setReturnFocus] = useState(false)

  useEffect(() => {
    if (step === 'confirming') confirmRef.current?.focus()
    if (step === 'deleted') deletedRef.current?.focus()
    if (step === 'idle' && returnFocus) deleteRef.current?.focus()
  }, [step, returnFocus])

  return (
    <section aria-label="Your data" className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => downloadMyData(preferences)}>
          {MY_DATA.download}
        </Button>
        {step === 'idle' && (
          <Button ref={deleteRef} variant="danger" onClick={() => setStep('confirming')}>
            {MY_DATA.delete}
          </Button>
        )}
      </div>

      {step === 'confirming' && (
        <Card className="flex flex-col gap-3 border-2 border-risk-4">
          <p
            ref={confirmRef}
            tabIndex={-1}
            className={cn('m-0 text-[15px] leading-[1.45] font-semibold', focusRing)}
          >
            {MY_DATA.deleteConfirm}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="danger"
              onClick={() => {
                preferences.deleteHealthAnswers()
                setStep('deleted')
              }}
            >
              {MY_DATA.deleteConfirmButton}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setReturnFocus(true)
                setStep('idle')
              }}
            >
              {MY_DATA.deleteCancel}
            </Button>
          </div>
        </Card>
      )}

      {step === 'deleted' && (
        <p
          ref={deletedRef}
          role="status"
          tabIndex={-1}
          className={cn(
            'm-0 flex items-center gap-2 rounded-xl bg-ok-bg px-3.5 py-3 text-[15px] font-bold text-ok-text',
            focusRing,
          )}
        >
          <CheckIcon size={20} strokeWidth={2.4} className="shrink-0" />
          {MY_DATA.deleted}
        </p>
      )}
    </section>
  )
}

/** Screen 6: My data and privacy. Values from design-reference/html/06-my-data.html. */
export function MyDataScreen() {
  const { sharing, setSharing } = useWorkerPreferences()
  const record = precautionFor(WORKER.id)
  const precaution = PRECAUTION_LEVELS[record.level]

  return (
    <>
      <header className="px-5 pt-4 pb-2">
        <h1 className="m-0 text-[22px] font-extrabold">{MY_DATA.title}</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <Card aria-label={MY_DATA.precautionLabel} className="flex flex-col gap-2.5">
          <SectionLabel as="h2">{MY_DATA.precautionLabel}</SectionLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-ink px-3 py-1.5 text-[15px] font-bold text-surface">
              {precaution.name}
            </span>
            {record.setOn && (
              <span className="text-[14px] text-muted">{MY_DATA.setOn(record.setOn)}</span>
            )}
          </div>
          {/* "Request a review" is hidden: no one reviews precaution levels yet. */}
          <Link
            to="/worker/health-profile"
            className={cn(
              'flex h-12 items-center justify-center rounded-xl bg-ink text-[15px] font-bold text-surface no-underline',
              focusRing,
            )}
          >
            {MY_DATA.healthProfileLink}
          </Link>
        </Card>

        <Card aria-label={MY_DATA.sharingTitle} className="flex flex-col pt-3 pb-1">
          <h2 className="mb-1 text-[16px] font-bold">{MY_DATA.sharingTitle}</h2>
          {MY_DATA.sharing.map((item, index) => (
            <Switch
              key={item.id}
              size="sm"
              label={item.label}
              description={item.description}
              checked={sharing[item.id]}
              onChange={(on) => setSharing(item.id, on)}
              divider={index < MY_DATA.sharing.length - 1}
            />
          ))}
        </Card>

        <Card aria-label={MY_DATA.accessTitle} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[16px] font-bold">{MY_DATA.accessTitle}</h2>
            <span className="text-[13px] text-muted">{MY_DATA.accessPeriod}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {MY_DATA.accessLog.map((entry) => {
              const { Icon, className } =
                ACCESS_ICONS[entry.id as keyof typeof ACCESS_ICONS] ?? ACCESS_ICONS.supervisor
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full',
                      className,
                    )}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold">{entry.who}</span>
                    <span className="text-[13px] leading-[1.35] text-muted">{entry.detail}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>

        <section
          aria-label="Our promise"
          className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-surface"
        >
          <LockIcon size={22} strokeWidth={2.2} className="mt-px shrink-0 text-ink-accent" />
          <p className="m-0 text-[15px] leading-[1.45] font-semibold">{MY_DATA.promise}</p>
        </section>

        <YourDataSection />
        <SignOutSection />
      </div>
    </>
  )
}
