import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isMockMode } from '../../api/config'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import type { LoadContext } from '../../api/useApiData'
import { useApiData } from '../../api/useApiData'
import {
  loadHealthProfile,
  saveHealthProfile,
  type SavedHealthProfile,
  type WorkerAccount,
} from '../../api/workerProfile'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckTile } from '../../components/CheckTile'
import { ChevronLeftIcon, LockIcon, WarningIcon } from '../../components/icons'
import { ListenButton } from '../../components/ListenButton'
import { ErrorState, LoadingState } from '../../components/LoadStates'
import { RadioTile } from '../../components/RadioTile'
import { HEALTH_PROFILE, MY_DATA, WORKER } from '../../data/mock'
import type { ChoiceOption, HealthProfileAnswers } from '../../data/types'
import { cn } from '../../lib/cn'
import { useSpeech } from '../../lib/useSpeech'
import { useWorkerAccount } from './account/workerAccount'
import { ScreenStatus, WithWorkerAccount } from './account/WithWorkerAccount'
import { mockPrecautionView, precautionViewFromApi, type PrecautionView } from './precautionView'
import { useWorkerPreferences } from './workerPreferences'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/**
 * Multi-select with an exclusive "None of these", as in HealthProfile.dc.html: ticking "none"
 * clears the rest, and ticking anything else clears "none".
 */
function toggleMulti(current: string[], id: string, on: boolean): string[] {
  if (!on) return current.filter((item) => item !== id)
  if (id === 'none') return ['none']
  return [...current.filter((item) => item !== 'none' && item !== id), id]
}

/** One numbered question card. Checkbox and radio groups use a fieldset with a legend. */
function Question({
  title,
  intro,
  footnote,
  tag,
  notice,
  children,
  group = true,
}: {
  title: string
  intro?: string
  footnote?: string
  /** A visible tag next to the title, for example "Shared with your work record" (decision D4). */
  tag?: string
  /** A short line under the intro explaining how the answer is used. */
  notice?: string
  children: ReactNode
  group?: boolean
}) {
  const introId = useId()
  const heading = (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[17px] font-extrabold">{title}</span>
      {tag && (
        <span className="rounded-full bg-info-bg px-2.5 py-1 text-[12px] font-extrabold text-info-text">
          {tag}
        </span>
      )}
    </span>
  )
  const introText = (intro || notice) && (
    <div id={introId} className="flex flex-col gap-1">
      {intro && <p className="m-0 text-[14px] leading-[1.4] text-muted">{intro}</p>}
      {notice && <p className="m-0 text-[14px] leading-[1.4] font-semibold">{notice}</p>}
    </div>
  )
  const foot = footnote && <p className="m-0 text-[13px] text-muted">{footnote}</p>

  if (!group) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="m-0">{heading}</h2>
        {introText}
        {children}
        {foot}
      </Card>
    )
  }
  return (
    <Card
      as="fieldset"
      aria-describedby={intro ? introId : undefined}
      className="m-0 flex min-w-0 flex-col gap-2.5 border-0"
    >
      <legend className="float-left w-full p-0">
        <h2 className="m-0">{heading}</h2>
      </legend>
      <div className="clear-both flex flex-col gap-2.5">
        {introText}
        {children}
        {foot}
      </div>
    </Card>
  )
}

function MultiChoice({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: ChoiceOption[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  return options.map((option) => (
    <CheckTile
      key={option.id}
      variant="profile"
      name={name}
      value={option.id}
      label={option.label}
      hint={option.hint}
      checked={value.includes(option.id)}
      onChange={(on) => onChange(toggleMulti(value, option.id, on))}
    />
  ))
}

function SingleChoice({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: ChoiceOption[]
  value: string | null
  onChange: (next: string) => void
}) {
  return options.map((option) => (
    <RadioTile
      key={option.id}
      name={name}
      value={option.id}
      label={option.label}
      checked={value === option.id}
      onChange={onChange}
    />
  ))
}

interface BackLink {
  to: string
  label: string
}

const BACK_TO_CHOICES: BackLink = { to: '/worker/welcome', label: 'Back to your choices' }
const BACK_TO_MY_DATA: BackLink = { to: '/worker/my-data', label: 'Back to my data' }

/** True when the worker arrived from "Agree and continue" on the consent screen. */
function useFromWelcome(): boolean {
  const location = useLocation()
  return (location.state as { fromWelcome?: boolean } | null)?.fromWelcome === true
}

interface HealthProfileViewProps {
  profile: HealthProfileAnswers
  setProfile: (change: (current: HealthProfileAnswers) => HealthProfileAnswers) => void
  /** True after a successful save, until the answers change again. */
  sent: boolean
  onSave: () => void
  onSkip: () => void
  saving?: boolean
  /** Shown above the save button when saving failed. */
  saveError?: ReactNode
  sharingHealth: boolean
  /** null: no precaution card (the worker has no health profile). */
  precaution: PrecautionView | null
  workerCode: string
  back: BackLink
}

/** Screen 2: health profile. Values from design-reference/html/02-health-profile.html. */
function HealthProfileView({
  profile,
  setProfile,
  sent,
  onSave,
  onSkip,
  saving = false,
  saveError = null,
  sharingHealth,
  precaution,
  workerCode,
  back,
}: HealthProfileViewProps) {
  const content = HEALTH_PROFILE
  const ageId = useId()
  const { speak } = useSpeech()

  const set =
    <K extends keyof HealthProfileAnswers>(key: K) =>
    (value: HealthProfileAnswers[K]) =>
      setProfile((current) => ({ ...current, [key]: value }))

  // Buttons that disappear when pressed hand focus to what replaces them.
  const sentRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const [justSent, setJustSent] = useState(false)
  useEffect(() => {
    if (justSent && sent) sentRef.current?.focus()
  }, [justSent, sent])
  useEffect(() => {
    if (saveError) errorRef.current?.focus()
  }, [saveError])

  const listen = speak ? () => speak(`${content.title}. ${content.intro}`) : undefined

  return (
    <>
      <header className="flex items-center gap-2 pt-3 pr-3 pb-1 pl-2">
        <Link
          to={back.to}
          aria-label={back.label}
          className={cn(
            'flex size-11 items-center justify-center rounded-full text-ink',
            focusRing,
          )}
        >
          <ChevronLeftIcon size={24} strokeWidth={2.2} />
        </Link>
        <h1 className="m-0 flex-1 text-[21px] font-extrabold">{content.title}</h1>
        {listen && <ListenButton aria-label="Listen to this page" onClick={listen} />}
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4">
        {!sharingHealth && (
          <p className="m-0 rounded-2xl bg-info-bg px-4 py-3.5 text-[15px] leading-[1.45] text-info-text">
            {content.sharingOffNote.before}
            <Link to="/worker/my-data" className="font-bold text-info-text underline">
              {content.sharingOffNote.link}
            </Link>
            {content.sharingOffNote.after}
          </p>
        )}

        <section
          aria-label="About this profile"
          className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-surface"
        >
          <LockIcon size={22} strokeWidth={2.2} className="mt-px shrink-0 text-ink-accent" />
          <p className="m-0 text-[15px] leading-[1.45]">{content.intro}</p>
        </section>

        <Question title={content.about.title} group={false}>
          <div className="flex items-center justify-between rounded-xl bg-ground px-3.5 py-3">
            <span className="text-[14px] text-muted">{content.about.workerIdLabel}</span>
            <span className="font-mono text-[16px] font-bold">{workerCode}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ageId} className="text-[15px] font-bold">
              {content.about.ageLabel}
            </label>
            <select
              id={ageId}
              value={profile.ageRange}
              onChange={(event) => set('ageRange')(event.target.value)}
              className={cn(
                'h-12 rounded-xl border border-field bg-surface px-3 text-[16px] text-ink',
                focusRing,
              )}
            >
              <option value="">{content.about.ageNotAnswered}</option>
              {content.about.ageOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <p className="m-0 text-[13px] text-muted">{content.about.why}</p>
          </div>
        </Question>

        <Question title={content.conditions.title} intro={content.conditions.intro}>
          <MultiChoice
            name="conditions"
            options={content.conditions.options}
            value={profile.conditions}
            onChange={set('conditions')}
          />
        </Question>

        <Question title={content.heatIllness.title} intro={content.heatIllness.intro}>
          <SingleChoice
            name="heat-illness"
            options={content.heatIllness.options}
            value={profile.heatIllness}
            onChange={set('heatIllness')}
          />
        </Question>

        <Question
          title={content.medicines.title}
          intro={content.medicines.intro}
          footnote={content.medicines.footnote}
        >
          <MultiChoice
            name="medicines"
            options={content.medicines.options}
            value={profile.medicines}
            onChange={set('medicines')}
          />
        </Question>

        <Question
          title={content.acclimatisation.title}
          intro={content.acclimatisation.intro}
          footnote={content.acclimatisation.footnote}
          tag={content.acclimatisation.sharedTag}
          notice={content.acclimatisation.sharedNote}
        >
          <SingleChoice
            name="acclimatisation"
            options={content.acclimatisation.options}
            value={profile.acclimatisation}
            onChange={set('acclimatisation')}
          />
        </Question>

        {/* No health profile means no precaution card (decision: null is not "Standard"). */}
        {precaution && (
          <Question
            title={content.precautions.title}
            intro={content.precautions.intro}
            group={false}
          >
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-ink px-3 py-1.5 text-[14px] font-bold text-surface">
                {precaution.name}
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-ground px-3.5 py-3">
              {precaution.restrictions.map((item) => (
                <p key={item} className="m-0 text-[15px] leading-[1.4]">
                  {item}
                </p>
              ))}
              {precaution.setOn && (
                <p className="m-0 text-[13px] text-muted">
                  {MY_DATA.setOn(precaution.setOn)}
                  {precaution.nextReview && ` · next review ${precaution.nextReview}`}
                </p>
              )}
            </div>
            {/* "Request a review" is hidden: no one reviews precaution levels yet. */}
          </Question>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-surface px-4 pt-3 pb-5">
        {sent ? (
          <>
            <div
              ref={sentRef}
              role="status"
              tabIndex={-1}
              className={cn(
                'rounded-[14px] bg-ok-bg px-4 py-3.5 text-[15px] leading-[1.4] font-bold text-ok-text',
                focusRing,
              )}
            >
              {content.sentText}
            </div>
            <Link
              to="/worker"
              className={cn(
                'flex h-[50px] items-center justify-center rounded-[14px] border border-field text-[16px] font-bold text-ink no-underline',
                focusRing,
              )}
            >
              {content.goToStatus}
            </Link>
          </>
        ) : (
          <>
            {saveError && (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border-2 border-risk-4 bg-danger-bg px-3.5 py-3 text-[15px] leading-[1.4] font-bold text-danger-text',
                  focusRing,
                )}
              >
                <WarningIcon size={20} strokeWidth={2.2} className="mt-px shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            <Button
              size="lg"
              fullWidth
              disabled={saving}
              onClick={() => {
                onSave()
                setJustSent(true)
              }}
            >
              {saving ? content.saving : content.send}
            </Button>
            <Link
              to="/worker"
              onClick={onSkip}
              className={cn(
                'flex h-11 items-center justify-center rounded-xl text-[15px] font-bold text-ink underline',
                focusRing,
              )}
            >
              {content.skip}
            </Link>
          </>
        )}
        <p className="m-0 text-center text-[13px] leading-[1.4] text-muted">{content.footnote}</p>
      </div>
    </>
  )
}

/** Sample data: answers are kept on the device and the precaution card is W-0412's. */
function MockHealthProfileScreen() {
  const fromWelcome = useFromWelcome()
  const {
    sharing,
    profile,
    setProfile,
    profileSent,
    sendProfile,
    skipProfile,
    onboardingComplete,
  } = useWorkerPreferences()
  // During first run the back arrow returns to the consent screen; afterwards to My data.
  const back = fromWelcome || !onboardingComplete ? BACK_TO_CHOICES : BACK_TO_MY_DATA
  return (
    <HealthProfileView
      profile={profile}
      setProfile={setProfile}
      sent={profileSent}
      onSave={sendProfile}
      onSkip={skipProfile}
      sharingHealth={sharing.health}
      precaution={mockPrecautionView()}
      workerCode={WORKER.id}
      back={back}
    />
  )
}

/** The message for a save the server refused because health sharing is off (409). */
function ConsentNeeded() {
  const text = HEALTH_PROFILE.consentNeeded
  return (
    <>
      {text.before}
      <Link to="/worker/my-data" className="text-danger-text underline">
        {text.link}
      </Link>
      {text.after}
    </>
  )
}

/** Api mode, once the saved answers are loaded: edits stay on screen until Save. */
function ApiHealthProfileForm({
  account,
  initial,
}: {
  account: WorkerAccount
  initial: SavedHealthProfile
}) {
  const fromWelcome = useFromWelcome()
  const { refresh } = useWorkerAccount()
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial.answers)
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<ReactNode>(null)

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const result = await saveHealthProfile(account.workerId, draft, saved.ageWasSaved)
      setSaved(result)
      setSent(true)
      // A save can change the precaution level. Errors here are not the save's errors.
      refresh().catch(() => {})
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict') setSaveError(<ConsentNeeded />)
      else setSaveError(error instanceof ApiError ? error.message : FALLBACK_MESSAGES.unknown)
    } finally {
      setSaving(false)
    }
  }

  return (
    <HealthProfileView
      profile={draft}
      setProfile={(change) => {
        setDraft(change)
        setSent(false)
      }}
      sent={sent}
      onSave={save}
      onSkip={() => {}}
      saving={saving}
      saveError={saveError}
      sharingHealth={account.consents.health}
      precaution={precautionViewFromApi(account.precaution)}
      workerCode={account.workerCode}
      back={fromWelcome ? BACK_TO_CHOICES : BACK_TO_MY_DATA}
    />
  )
}

/** Api mode: loads the saved answers (GET /workers/{id}/health-profile) for this worker. */
function ApiHealthProfile({ account }: { account: WorkerAccount }) {
  const load = useCallback(
    (context: LoadContext) => loadHealthProfile(account.workerId, context),
    [account.workerId],
  )
  const data = useApiData(load)
  if (data.status === 'ready') return <ApiHealthProfileForm account={account} initial={data.data} />
  if (data.status === 'error') {
    return (
      <ScreenStatus>
        <ErrorState message={data.error.message} onRetry={data.retry} />
      </ScreenStatus>
    )
  }
  return (
    <ScreenStatus>
      <LoadingState slow={data.status === 'loading' && data.slow} />
    </ScreenStatus>
  )
}

export function HealthProfileScreen() {
  if (isMockMode) return <MockHealthProfileScreen />
  return (
    <WithWorkerAccount>{(account) => <ApiHealthProfile account={account} />}</WithWorkerAccount>
  )
}
