import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckTile } from '../../components/CheckTile'
import { CheckIcon, ChevronLeftIcon, LockIcon } from '../../components/icons'
import { ListenButton } from '../../components/ListenButton'
import { RadioTile } from '../../components/RadioTile'
import { HEALTH_PROFILE, PRECAUTION_LEVELS, REVIEW_REQUESTED, WORKER } from '../../data/mock'
import type { ChoiceOption, HealthProfileAnswers } from '../../data/types'
import { cn } from '../../lib/cn'
import { useSpeech } from '../../lib/useSpeech'
import { usePrecautionLevels } from '../occupational-health/precautionLevels'
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
  children,
  group = true,
}: {
  title: string
  intro?: string
  footnote?: string
  children: ReactNode
  group?: boolean
}) {
  const introId = useId()
  const heading = <span className="text-[17px] font-extrabold">{title}</span>
  const introText = intro && (
    <p id={introId} className="m-0 text-[14px] leading-[1.4] text-muted">
      {intro}
    </p>
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

/** Screen 2: health profile. Values from design-reference/html/02-health-profile.html. */
export function HealthProfileScreen() {
  const content = HEALTH_PROFILE
  const ageId = useId()
  const { speak } = useSpeech()
  const {
    sharing,
    profile,
    setProfile,
    profileSent,
    sendProfile,
    skipProfile,
    onboardingComplete,
    reviewRequested,
    requestReview,
  } = useWorkerPreferences()
  // During first run the back arrow returns to the consent screen; afterwards to My data.
  const back = onboardingComplete
    ? { to: '/worker/my-data', label: 'Back to my data' }
    : { to: '/worker/welcome', label: 'Back to your choices' }
  const record = usePrecautionLevels().recordFor(WORKER.id)
  const precaution = PRECAUTION_LEVELS[record.level]
  // High-priority uses the design's two lines; other levels show their restriction text.
  const restrictions =
    record.level === 'high' ? WORKER.precaution.restrictions : [precaution.restriction]

  const set =
    <K extends keyof HealthProfileAnswers>(key: K) =>
    (value: HealthProfileAnswers[K]) =>
      setProfile((current) => ({ ...current, [key]: value }))

  // Buttons that disappear when pressed hand focus to what replaces them.
  const sentRef = useRef<HTMLDivElement>(null)
  const reviewRef = useRef<HTMLParagraphElement>(null)
  const [justSent, setJustSent] = useState(false)
  const [justRequested, setJustRequested] = useState(false)
  useEffect(() => {
    if (justSent && profileSent) sentRef.current?.focus()
  }, [justSent, profileSent])
  useEffect(() => {
    if (justRequested && reviewRequested) reviewRef.current?.focus()
  }, [justRequested, reviewRequested])

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
        {!sharing.health && (
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
            <span className="font-mono text-[16px] font-bold">{WORKER.id}</span>
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
        >
          <SingleChoice
            name="acclimatisation"
            options={content.acclimatisation.options}
            value={profile.acclimatisation}
            onChange={set('acclimatisation')}
          />
        </Question>

        <Question title={content.precautions.title} intro={content.precautions.intro} group={false}>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-ink px-3 py-1.5 text-[14px] font-bold text-surface">
              {precaution.name}
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-ground px-3.5 py-3">
            {restrictions.map((item) => (
              <p key={item} className="m-0 text-[15px] leading-[1.4]">
                {item}
              </p>
            ))}
            <p className="m-0 text-[13px] text-muted">
              Set {record.setOn}
              {record.nextReview && ` · next review ${record.nextReview}`}
            </p>
          </div>
          {reviewRequested ? (
            <p
              ref={reviewRef}
              role="status"
              tabIndex={-1}
              className={cn(
                'm-0 flex items-center gap-2 rounded-xl bg-ok-bg px-3.5 py-3 text-[15px] font-bold text-ok-text',
                focusRing,
              )}
            >
              <CheckIcon size={20} strokeWidth={2.4} className="shrink-0" />
              {REVIEW_REQUESTED}
            </p>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                requestReview()
                setJustRequested(true)
              }}
            >
              Request a review
            </Button>
          )}
        </Question>
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-surface px-4 pt-3 pb-5">
        {profileSent ? (
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
            <Button
              size="lg"
              fullWidth
              onClick={() => {
                sendProfile()
                setJustSent(true)
              }}
            >
              {content.send}
            </Button>
            <Link
              to="/worker"
              onClick={skipProfile}
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
