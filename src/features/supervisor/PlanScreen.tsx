import { useCallback, useEffect, useRef, useState } from 'react'
import { isMockMode } from '../../api/config'
import {
  cellKey,
  planChanges,
  previewVersion,
  type PlanHour,
  type PlanVersion,
  type PlanView,
} from '../../api/converters/plan'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import { loadPlan, savePlan, sendPlan } from '../../api/supervisor'
import { useApiData, type LoadContext } from '../../api/useApiData'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, WarningIcon } from '../../components/icons'
import { EmptyState, ErrorState, LoadingState } from '../../components/LoadStates'
import {
  PLAN_CHANGES,
  PLAN_CREWS,
  PLAN_HEAT,
  PLAN_LIVE_TEXT,
  PLAN_SEND,
  PLAN_TEXT,
  PLAN_TIMES,
  PLANS,
  SUPERVISOR_LIVE_TEXT,
  TASK_LABELS,
  WORKERS_NEEDING_REDUCED_EXPOSURE,
} from '../../data/mock'
import type { TaskType } from '../../data/types'
import { cn } from '../../lib/cn'
import { riskClasses, riskName } from '../../lib/risk'
import { useCurrentSession } from '../session/session'

const crewHours = (count: number) => `${count} crew-${count === 1 ? 'hour' : 'hours'}`
type Shown = 'current' | 'suggested'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/** Tapping a cell in edit mode cycles through these. */
const NEXT_TASK: Record<TaskType, TaskType> = { H: 'M', M: 'L', L: 'B', B: 'H' }

// Cell colours from Planner.dc.html.
const TASK_STYLE: Record<TaskType, string> = {
  H: 'bg-ink text-surface',
  M: 'bg-task-moderate text-surface',
  L: 'bg-line text-ink',
  B: 'bg-surface text-ink',
}

/** Site heat cell: "3", "4?" when only possible, "–" when there is no reading. */
const heatLabel = (hour: PlanHour) =>
  hour.level === null ? '–' : `${hour.level}${hour.possible ? '?' : ''}`
const heatDescription = (hour: PlanHour) =>
  hour.level === null
    ? 'no reading'
    : hour.possible
      ? `level ${hour.level}, ${riskName(hour.level)} possible`
      : `level ${hour.level}, ${riskName(hour.level)}`

function SummaryCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface px-5 py-[18px]">
      <h2 className="text-[13px] font-bold text-muted">{title}</h2>
      <p className="m-0 font-mono text-[30px] font-bold">{value}</p>
      <p className="m-0 text-[13px] text-muted">{note}</p>
    </div>
  )
}

function Timeline({
  data,
  version,
  title,
  editing,
  onCycle,
}: {
  data: PlanView
  version: PlanVersion
  title: string
  editing: boolean
  onCycle: (crewId: string, hour: number) => void
}) {
  const columns = { gridTemplateColumns: `220px repeat(${data.hours.length}, minmax(0, 1fr))` }
  const grid = 'grid gap-1.5'
  return (
    <Card variant="page" aria-label="Timeline" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">{title}</h2>
        <p className="m-0 text-[14px] text-muted">{PLAN_TEXT.timelineNote}</p>
      </div>
      {editing && (
        <p className="m-0 rounded-xl bg-info-bg px-3.5 py-2.5 text-[14px] font-bold text-info-text">
          {PLAN_TEXT.editHint}
        </p>
      )}

      {/* Scrolls sideways inside its own box on phones; focusable so keyboards can scroll it. */}
      <div
        role="region"
        aria-label={`${title}, timeline`}
        tabIndex={0}
        className={cn('relative overflow-x-auto rounded-lg p-1', focusRing)}
      >
        <div
          role="table"
          aria-label={title}
          className="flex flex-col gap-2"
          style={{ minWidth: 220 + data.hours.length * 78 }}
        >
          <div role="row" className={cn(grid, 'items-end')} style={columns}>
            <span role="rowheader" className="text-[13px] font-bold text-muted">
              {PLAN_TEXT.siteHeat}
            </span>
            {data.hours.map((hour, index) => {
              const colour = hour.level
                ? cn(riskClasses(hour.level).bg, riskClasses(hour.level).text)
                : 'bg-ground text-muted'
              return (
                <div
                  key={`${hour.label}-${index}`}
                  role="columnheader"
                  className="relative flex flex-col items-center gap-1"
                >
                  <span className="sr-only">
                    {hour.label}, site heat {heatDescription(hour)}
                  </span>
                  <span aria-hidden="true" className="font-mono text-[12px] text-muted">
                    {hour.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-[30px] w-full items-center justify-center rounded-lg text-[14px] font-extrabold',
                      colour,
                    )}
                  >
                    {heatLabel(hour)}
                  </span>
                </div>
              )
            })}
          </div>

          {data.crews.map((crew) => (
            <div
              key={crew.id}
              role="row"
              className={cn(grid, 'items-stretch border-t border-line-soft pt-2')}
              style={columns}
            >
              <div role="rowheader" className="flex flex-col justify-center gap-0.5">
                <span className="text-[15px] font-extrabold">{crew.name}</span>
                <span className="text-[13px] text-muted">{crew.meta}</span>
              </div>
              {(version.tasks[crew.id] ?? []).map((task, hour) => {
                const tooHot = version.tooHot.has(cellKey(crew.id, hour))
                const cellClass = cn(
                  'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-center text-[13px] font-bold',
                  TASK_STYLE[task],
                  tooHot
                    ? 'border-[3px] border-risk-4'
                    : task === 'B'
                      ? 'border-2 border-dashed border-subtle'
                      : 'border-[3px] border-transparent',
                )
                const content = (
                  <>
                    <span>{TASK_LABELS[task]}</span>
                    {tooHot && (
                      <span className="text-[11px] font-extrabold">{PLAN_TEXT.tooHot}</span>
                    )}
                  </>
                )
                const time = data.hours[hour]?.label ?? ''
                return (
                  <div key={hour} role="cell" className="relative flex">
                    {editing ? (
                      <button
                        type="button"
                        aria-label={`${crew.name}, ${time}, ${TASK_LABELS[task]}${tooHot ? ', too hot' : ''}. Tap to change.`}
                        onClick={() => onCycle(crew.id, hour)}
                        className={cn(cellClass, 'cursor-pointer', focusRing)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={cellClass}>
                        <span className="sr-only">{time}: </span>
                        {content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[13px] text-muted">
        {(['H', 'M', 'L'] as const).map((task) => (
          <li key={task} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn('size-4 rounded', TASK_STYLE[task])} />
            {PLAN_TEXT.legend[task]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-4 rounded border-2 border-dashed border-subtle"
          />
          {PLAN_TEXT.legend.B}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-4 rounded border-[3px] border-risk-4" />
          {PLAN_TEXT.legend.tooHot}
        </li>
      </ul>
    </Card>
  )
}

interface PlanBoardProps {
  data: PlanView
  subtitle: string
  changes: Array<{ who: string; text: string }>
  /** Sends the suggestion as it is. */
  onSendSuggested: () => Promise<void>
  /** Saves the edited suggestion, then sends it. */
  onSendEdited: (tasks: Record<string, TaskType[]>) => Promise<void>
  /** Api mode: the last time the plan was sent, shown before anything is sent here. */
  lastSentAt?: string
  /** After sending, which plan to show: the one that was sent. */
  showAfterEditedSend: Shown
}

/** Screen 9: shift plan. Values and logic from design-reference/source/Planner.dc.html. */
function PlanBoard({
  data,
  subtitle,
  changes,
  onSendSuggested,
  onSendEdited,
  lastSentAt,
  showAfterEditedSend,
}: PlanBoardProps) {
  const [view, setView] = useState<Shown>('current')
  const [draft, setDraft] = useState<Record<string, TaskType[]> | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentRef = useRef<HTMLParagraphElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const editing = draft !== null

  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Editing previews the backend's rule on the phone; the saved numbers come from the backend.
  const suggested = draft ? previewVersion(draft, data) : data.suggested
  const current = data.current
  const shown = view === 'current' ? current : suggested
  const fewerHours = current.workingCrewHours - suggested.workingCrewHours
  const title =
    view === 'current' ? PLAN_TEXT.current : editing ? PLAN_TEXT.editing : PLAN_TEXT.suggested
  const strenuous =
    view === 'current'
      ? crewHours(current.tooHotCrewHours)
      : `${crewHours(shown.tooHotCrewHours)} (was ${current.tooHotCrewHours})`

  async function run(action: () => Promise<void>, after: Shown) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setDraft(null)
      setView(after)
      setSent(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : FALLBACK_MESSAGES.unknown)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{PLAN_TEXT.title}</h1>
          <p className="m-0 text-[15px] text-muted">{subtitle}</p>
        </div>
        <div
          role="group"
          aria-label={PLAN_TEXT.toggleLabel}
          className="flex rounded-xl border border-line bg-surface p-1"
        >
          {(['current', 'suggested'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                'h-11 rounded-[9px] px-[18px] text-[15px] font-bold',
                view === option ? 'bg-ink text-surface' : 'bg-transparent text-ink',
                focusRing,
              )}
            >
              {PLAN_TEXT[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <SummaryCard
            title={PLAN_TEXT.strenuousTitle}
            value={strenuous}
            note={PLAN_TEXT.strenuousNote}
          />
          <SummaryCard
            title={PLAN_TEXT.workingTitle}
            value={crewHours(shown.workingCrewHours)}
            note={
              suggested.workingCrewHours === current.workingCrewHours
                ? PLAN_TEXT.workingNoteSame
                : PLAN_TEXT.workingNoteDifferent
            }
          />
          <SummaryCard
            title={PLAN_TEXT.reducedTitle}
            value={String(data.workersNeedingReducedExposure)}
            note={PLAN_TEXT.reducedNote}
          />
        </div>
        {/* Announces the live totals while editing. */}
        <p role="status" className="sr-only">
          {editing
            ? `${PLAN_TEXT.strenuousTitle}: ${strenuous}. Working hours: ${shown.workingCrewHours}.`
            : ''}
        </p>
        {editing && view === 'suggested' && (
          <p className="m-0 text-[13px] text-muted">{PLAN_LIVE_TEXT.previewNote}</p>
        )}
        {view === 'suggested' && fewerHours > 0 && (
          <p className="m-0 rounded-xl bg-warn-bg px-3.5 py-2.5 text-[14px] font-bold text-warn-text">
            {PLAN_TEXT.fewerHours(fewerHours)}
          </p>
        )}
      </div>

      {data.crews.length === 0 || data.hours.length === 0 ? (
        <EmptyState variant="page" message={PLAN_LIVE_TEXT.noCrews} />
      ) : (
        <Timeline
          data={data}
          version={shown}
          title={title}
          editing={editing && view === 'suggested'}
          onCycle={(crewId, hour) =>
            setDraft((tasks) => {
              if (!tasks) return tasks
              const row = [...(tasks[crewId] ?? [])]
              row[hour] = NEXT_TASK[row[hour]]
              return { ...tasks, [crewId]: row }
            })
          }
        />
      )}

      <div className="flex flex-wrap gap-5">
        <Card
          variant="page"
          aria-label={PLAN_TEXT.changesTitle}
          className="flex min-w-0 flex-[3_1_604px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{PLAN_TEXT.changesTitle}</h2>
          {changes.length === 0 ? (
            <p className="m-0 text-[15px] text-muted">{PLAN_LIVE_TEXT.noChanges}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {changes.map((change, index) => (
                <li
                  key={`${change.who}-${index}`}
                  className={cn(
                    'flex gap-3.5 py-3',
                    index < changes.length - 1 && 'border-b border-line-soft',
                  )}
                >
                  <span className="w-[72px] shrink-0 text-[15px] font-extrabold">{change.who}</span>
                  <span className="text-[15px] leading-[1.45]">{change.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          variant="page"
          aria-label="Send the plan"
          className="flex min-w-0 flex-[2_1_424px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{PLAN_TEXT.sendTitle}</h2>
          <p className="m-0 text-[15px] leading-[1.45]">{PLAN_SEND.text}</p>
          {!sent && lastSentAt && (
            <p className="m-0 text-[14px] text-muted">{PLAN_LIVE_TEXT.lastSent(lastSentAt)}</p>
          )}
          {error && (
            <p
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className={cn(
                'm-0 flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-3 text-[15px] font-bold text-danger-text',
                focusRing,
              )}
            >
              <WarningIcon size={20} strokeWidth={2.2} className="mt-px shrink-0" />
              {error}
            </p>
          )}
          {sent ? (
            <p
              ref={sentRef}
              role="status"
              tabIndex={-1}
              className={cn(
                'm-0 flex items-start gap-2 rounded-xl bg-ok-bg px-4 py-3.5 text-[15px] leading-[1.45] font-bold text-ok-text',
                focusRing,
              )}
            >
              <CheckIcon size={20} strokeWidth={2.4} className="mt-0.5 shrink-0" />
              {PLAN_SEND.sentText}
            </p>
          ) : editing ? (
            <div className="flex flex-wrap gap-2">
              <Button
                className="px-5!"
                disabled={busy}
                onClick={() => draft && void run(() => onSendEdited(draft), showAfterEditedSend)}
              >
                {busy ? PLAN_LIVE_TEXT.sending : PLAN_TEXT.useThis}
              </Button>
              <Button
                variant="secondary"
                className="px-5!"
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                {PLAN_TEXT.cancelChanges}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                className="px-5!"
                disabled={busy || data.crews.length === 0}
                onClick={() => void run(onSendSuggested, 'suggested')}
              >
                {busy ? PLAN_LIVE_TEXT.sending : PLAN_TEXT.useSuggested}
              </Button>
              <Button
                variant="secondary"
                className="px-5!"
                disabled={busy || data.crews.length === 0}
                onClick={() => {
                  setView('suggested')
                  setDraft(
                    Object.fromEntries(
                      Object.entries(data.suggested.tasks).map(([id, row]) => [id, [...row]]),
                    ),
                  )
                }}
              >
                {PLAN_TEXT.adjustFirst}
              </Button>
            </div>
          )}
          <p className="m-0 text-[13px] leading-[1.45] text-muted">{PLAN_SEND.note}</p>
        </Card>
      </div>
    </>
  )
}

export function PlanScreen() {
  return isMockMode ? <MockPlan /> : <ApiPlan />
}

/** SAMPLE: the design's plan, in the same shape as the backend's. */
function mockPlanView(): PlanView {
  const hours: PlanHour[] = PLAN_TIMES.map((time, i) => ({
    label: `${time}:00`,
    level: PLAN_HEAT[i],
    // Level 4 hours in the sample plan are possible Critical, shown as "4?".
    possible: PLAN_HEAT[i] === 4,
  }))
  const crews = PLAN_CREWS.map((crew) => ({ id: crew.id, name: crew.name, meta: crew.meta }))
  const rule = { heavyFrom: 3, moderateFrom: 4 }
  const tasks = (plan: Record<string, string>) =>
    Object.fromEntries(PLAN_CREWS.map((crew) => [crew.id, plan[crew.id].split('') as TaskType[]]))
  return {
    status: '',
    sentAt: '',
    hours,
    crews,
    current: previewVersion(tasks(PLANS.current), { hours, rule }),
    suggested: previewVersion(tasks(PLANS.suggested), { hours, rule }),
    workersNeedingReducedExposure: WORKERS_NEEDING_REDUCED_EXPOSURE,
    rule,
    span: '07:00 to 17:00',
  }
}

/** Sample data: sending only changes the screen. */
function MockPlan() {
  const [data] = useState(mockPlanView)
  return (
    <PlanBoard
      data={data}
      subtitle={PLAN_TEXT.subtitle}
      changes={PLAN_CHANGES}
      onSendSuggested={async () => {}}
      onSendEdited={async () => {}}
      showAfterEditedSend="suggested"
    />
  )
}

/** Api mode: the supervisor's site from the session. */
function ApiPlan() {
  const site = useCurrentSession()?.site
  if (!site) {
    return (
      <Card variant="page" role="alert">
        <p className="m-0 text-[15px]">{SUPERVISOR_LIVE_TEXT.noSite}</p>
      </Card>
    )
  }
  return <ApiPlanForSite siteId={site.id} siteName={site.name} />
}

function ApiPlanForSite({ siteId, siteName }: { siteId: string; siteName: string }) {
  const load = useCallback((context: LoadContext) => loadPlan(siteId, context), [siteId])
  const plan = useApiData(load)
  if (plan.status === 'ready') {
    return <ApiPlanBoard siteId={siteId} siteName={siteName} initial={plan.data} />
  }
  if (plan.status === 'error') {
    return <ErrorState variant="page" message={plan.error.message} onRetry={plan.retry} />
  }
  return <LoadingState variant="page" slow={plan.status === 'loading' && plan.slow} />
}

/**
 * Api mode: GET /sites/{id}/plan. "Use suggested plan" sends the suggestion; an edited plan is
 * saved with PUT first, then sent as the current plan. The page then shows the backend's numbers
 * and too-hot cells.
 */
function ApiPlanBoard({
  siteId,
  siteName,
  initial,
}: {
  siteId: string
  siteName: string
  initial: PlanView
}) {
  const [data, setData] = useState(initial)
  return (
    <PlanBoard
      data={data}
      subtitle={[siteName, data.span, PLAN_LIVE_TEXT.subtitleEnd].filter(Boolean).join(' · ')}
      changes={planChanges(data)}
      lastSentAt={data.status === 'sent' ? data.sentAt : undefined}
      onSendSuggested={async () => setData(await sendPlan(siteId, 'suggested'))}
      onSendEdited={async (tasks) => {
        setData(await savePlan(siteId, tasks))
        setData(await sendPlan(siteId, 'current'))
      }}
      showAfterEditedSend="current"
    />
  )
}
