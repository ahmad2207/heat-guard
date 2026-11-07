import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { RadioTile } from '../../components/RadioTile'
import { StatusPill } from '../../components/StatusPill'
import {
  OH_PROFILES,
  OH_TEXT,
  PRECAUTION_LEVELS,
  RECORDED_CATEGORIES,
  WORKER,
} from '../../data/mock'
import type { HealthProfileAnswers, PrecautionLevelId } from '../../data/types'
import { cn } from '../../lib/cn'
import { useWorkerPreferences } from '../worker/workerPreferences'
import { usePrecautionLevels } from './precautionLevels'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'
const label = 'text-[13px] font-bold tracking-[0.06em] text-muted uppercase'
const LEVEL_ORDER: PrecautionLevelId[] = ['standard', 'enhanced', 'high']

/** The worker's own answers as categories for "What you record". Never shows free text. */
function answersAsCategories(answers: HealthProfileAnswers): string[] {
  const c = RECORDED_CATEGORIES
  const chips = [
    ...answers.conditions.map((id) => c.conditions[id]),
    ...answers.medicines.map((id) => c.medicines[id]),
    answers.heatIllness ? c.heatIllness[answers.heatIllness] : undefined,
    answers.acclimatisation ? c.acclimatisation[answers.acclimatisation] : undefined,
    answers.ageRange && answers.ageRange !== 'Prefer not to say'
      ? c.age(answers.ageRange)
      : undefined,
  ]
  return chips.filter((chip): chip is string => Boolean(chip))
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

interface ProfilePanelProps {
  workerId: string
  /** Move focus to the heading when the panel opens, after a row is chosen. */
  focusOnOpen: boolean
}

/** Profile panel. Logic from design-reference/source/OccHealth.dc.html. */
export function ProfilePanel({ workerId, focusOnOpen }: ProfilePanelProps) {
  const profile = OH_PROFILES[workerId]
  const { recordFor, saveLevel } = usePrecautionLevels()
  const worker = useWorkerPreferences()
  const record = recordFor(workerId)
  const [draft, setDraft] = useState<PrecautionLevelId>(record.level)
  const [saved, setSaved] = useState(false)

  // Follow the stored level when it changes from outside, for example "Reset demo data".
  const [previousRecord, setPreviousRecord] = useState(record)
  if (record !== previousRecord) {
    setPreviousRecord(record)
    if (record.level !== draft) {
      setDraft(record.level)
      setSaved(false)
    }
  }
  const headingRef = useRef<HTMLHeadingElement>(null)
  const savedRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (focusOnOpen) headingRef.current?.focus()
  }, [focusOnOpen])
  useEffect(() => {
    if (saved) savedRef.current?.focus()
  }, [saved])

  const definition = PRECAUTION_LEVELS[draft]

  // W-0412 is the worker using the worker app in this browser, so their own choices show here.
  const isDemoWorker = workerId === WORKER.id
  const healthNotShared = isDemoWorker && worker.consentGiven && !worker.sharing.health
  const sent = isDemoWorker && !healthNotShared ? worker.sentProfile : undefined
  const recorded = sent ? answersAsCategories(sent.answers) : profile.recorded
  const consent =
    isDemoWorker && worker.consentGiven
      ? `Consent: health information ${worker.sharing.health ? 'yes' : 'no'} · wearable band ${worker.sharing.band ? 'yes' : 'no'} · can be withdrawn by the worker`
      : profile.consent

  return (
    <Card variant="page" aria-label={`Profile ${workerId}`} className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={cn('rounded text-[20px] font-extrabold', focusRing)}
        >
          Profile {workerId} · {profile.crew} · {profile.task}
        </h2>
        <p className="m-0 text-[14px] text-muted">{consent}</p>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-4">
          <section aria-label={OH_TEXT.whatYouRecord} className="flex flex-col gap-2">
            <h3 className={label}>{OH_TEXT.whatYouRecord}</h3>
            {healthNotShared ? (
              <p className="m-0 rounded-xl bg-ground px-3.5 py-3 text-[14px]">
                {RECORDED_CATEGORIES.notShared}
              </p>
            ) : (
              <>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {recorded.map((item) => (
                    <li key={item}>
                      <Chip>{item}</Chip>
                    </li>
                  ))}
                </ul>
                {sent && (
                  <p className="m-0 text-[13px] font-bold text-info-text">
                    {RECORDED_CATEGORIES.updatedByWorker} · {shortDate(sent.sentAt)}
                  </p>
                )}
              </>
            )}
            <p className="m-0 text-[13px] text-muted">{profile.recordedNote}</p>
          </section>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className={cn(label, 'mb-2 p-0')}>{OH_TEXT.precautionLevel}</legend>
            {LEVEL_ORDER.map((id) => (
              <RadioTile
                key={id}
                variant="oh"
                name={`precaution-${workerId}`}
                value={id}
                label={PRECAUTION_LEVELS[id].name}
                hint={PRECAUTION_LEVELS[id].hint}
                checked={draft === id}
                onChange={(value) => {
                  setDraft(value as PrecautionLevelId)
                  setSaved(false)
                }}
              />
            ))}
          </fieldset>

          <section aria-label={OH_TEXT.workRestrictions} className="flex flex-col gap-1.5">
            <h3 className={label}>{OH_TEXT.workRestrictions}</h3>
            <p className="m-0 text-[15px] leading-[1.45]">{definition.restriction}</p>
          </section>
        </div>

        <div className="flex min-w-0 flex-[2_1_360px] flex-col gap-3">
          <h3 className={label}>{OH_TEXT.preview}</h3>
          <section
            aria-label={OH_TEXT.supervisorDashboard}
            className="flex flex-col gap-2 rounded-[14px] border border-line p-4"
          >
            <p className="m-0 text-[12px] font-extrabold text-muted uppercase">
              {OH_TEXT.supervisorDashboard}
            </p>
            <StatusPill status="precaution" className="self-start">
              {definition.name}
            </StatusPill>
            <p className="m-0 text-[15px] leading-[1.4] font-bold">{definition.supervisorText}</p>
            <p className="m-0 text-[13px] text-muted">{OH_TEXT.noHealthDetails}</p>
          </section>
          <section
            aria-label={OH_TEXT.workerApp}
            className="flex flex-col gap-2 rounded-[14px] border border-line p-4"
          >
            <p className="m-0 text-[12px] font-extrabold text-muted uppercase">
              {OH_TEXT.workerApp}
            </p>
            <p className="m-0 text-[15px] leading-[1.4] font-bold">{definition.workerText}</p>
          </section>
          {saved ? (
            <p
              ref={savedRef}
              role="status"
              tabIndex={-1}
              className={cn(
                'm-0 rounded-xl bg-ok-bg px-3.5 py-3 text-[15px] font-bold text-ok-text',
                focusRing,
              )}
            >
              {OH_TEXT.savedText}
            </p>
          ) : (
            <Button
              fullWidth
              onClick={() => {
                saveLevel(workerId, draft)
                setSaved(true)
              }}
            >
              {OH_TEXT.save}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
