import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon } from '../../components/icons'
import {
  countPlan,
  isTooHot,
  PLAN_CHANGES,
  PLAN_CREWS,
  PLAN_HEAT,
  PLAN_SEND,
  PLAN_TEXT,
  PLAN_TIMES,
  PLANS,
  TASK_LABELS,
  WORKERS_NEEDING_REDUCED_EXPOSURE,
} from '../../data/mock'
import type { CrewId, TaskType } from '../../data/types'
import { cn } from '../../lib/cn'
import { riskClasses, riskName, type RiskLevel } from '../../lib/risk'

type Plan = Record<CrewId, string>

const crewHours = (count: number) => `${count} crew-${count === 1 ? 'hour' : 'hours'}`
type View = 'current' | 'suggested'

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

/** Site heat: level 4 hours in the plan are possible Critical, shown as "4?". */
const heatLabel = (level: RiskLevel) => (level === 4 ? '4?' : String(level))
const heatDescription = (level: RiskLevel) =>
  level === 4 ? 'level 4, Critical possible' : `level ${level}, ${riskName(level)}`

function setTask(plan: Plan, crew: CrewId, hour: number, task: TaskType): Plan {
  const tasks = plan[crew].split('')
  tasks[hour] = task
  return { ...plan, [crew]: tasks.join('') }
}

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
  plan,
  title,
  editing,
  onCycle,
}: {
  plan: Plan
  title: string
  editing: boolean
  onCycle: (crew: CrewId, hour: number) => void
}) {
  const grid = 'grid grid-cols-[220px_repeat(10,minmax(0,1fr))] gap-1.5'
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
        <div role="table" aria-label={title} className="flex min-w-[1000px] flex-col gap-2">
          <div role="row" className={cn(grid, 'items-end')}>
            <span role="rowheader" className="text-[13px] font-bold text-muted">
              {PLAN_TEXT.siteHeat}
            </span>
            {PLAN_TIMES.map((time, hour) => {
              const level = PLAN_HEAT[hour]
              const { bg, text } = riskClasses(level)
              return (
                <div
                  key={time}
                  role="columnheader"
                  className="relative flex flex-col items-center gap-1"
                >
                  <span className="sr-only">
                    {time}:00, site heat {heatDescription(level)}
                  </span>
                  <span aria-hidden="true" className="font-mono text-[12px] text-muted">
                    {time}:00
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-[30px] w-full items-center justify-center rounded-lg text-[14px] font-extrabold',
                      bg,
                      text,
                    )}
                  >
                    {heatLabel(level)}
                  </span>
                </div>
              )
            })}
          </div>

          {PLAN_CREWS.map((crew) => (
            <div
              key={crew.id}
              role="row"
              className={cn(grid, 'items-stretch border-t border-line-soft pt-2')}
            >
              <div role="rowheader" className="flex flex-col justify-center gap-0.5">
                <span className="text-[15px] font-extrabold">{crew.name}</span>
                <span className="text-[13px] text-muted">{crew.meta}</span>
              </div>
              {plan[crew.id].split('').map((letter, hour) => {
                const task = letter as TaskType
                const tooHot = isTooHot(task, PLAN_HEAT[hour])
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
                const time = `${PLAN_TIMES[hour]}:00`
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

/** Screen 9: shift plan. Values and logic from design-reference/source/Planner.dc.html. */
export function PlanScreen() {
  const [view, setView] = useState<View>('current')
  const [suggested, setSuggested] = useState<Plan>(PLANS.suggested)
  const [editing, setEditing] = useState(false)
  const [sent, setSent] = useState(false)
  const sentRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  const current = countPlan(PLANS.current)
  const shownPlan = view === 'current' ? PLANS.current : suggested
  const shown = countPlan(shownPlan)
  const fewerHours = current.working - countPlan(suggested).working
  const title =
    view === 'current' ? PLAN_TEXT.current : editing ? PLAN_TEXT.editing : PLAN_TEXT.suggested

  const strenuous =
    view === 'current'
      ? crewHours(current.tooHot)
      : `${crewHours(shown.tooHot)} (was ${current.tooHot})`

  const send = () => {
    setEditing(false)
    setView('suggested')
    setSent(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{PLAN_TEXT.title}</h1>
          <p className="m-0 text-[15px] text-muted">{PLAN_TEXT.subtitle}</p>
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
            value={crewHours(shown.working)}
            note={
              countPlan(suggested).working === current.working
                ? PLAN_TEXT.workingNoteSame
                : PLAN_TEXT.workingNoteDifferent
            }
          />
          <SummaryCard
            title={PLAN_TEXT.reducedTitle}
            value={String(WORKERS_NEEDING_REDUCED_EXPOSURE)}
            note={PLAN_TEXT.reducedNote}
          />
        </div>
        {/* Announces the live totals while editing. */}
        <p role="status" className="sr-only">
          {editing
            ? `${PLAN_TEXT.strenuousTitle}: ${strenuous}. Working hours: ${shown.working}.`
            : ''}
        </p>
        {view === 'suggested' && fewerHours > 0 && (
          <p className="m-0 rounded-xl bg-warn-bg px-3.5 py-2.5 text-[14px] font-bold text-warn-text">
            {PLAN_TEXT.fewerHours(fewerHours)}
          </p>
        )}
      </div>

      <Timeline
        plan={shownPlan}
        title={title}
        editing={editing && view === 'suggested'}
        onCycle={(crew, hour) =>
          setSuggested((plan) => setTask(plan, crew, hour, NEXT_TASK[plan[crew][hour] as TaskType]))
        }
      />

      <div className="flex flex-wrap gap-5">
        <Card
          variant="page"
          aria-label={PLAN_TEXT.changesTitle}
          className="flex min-w-0 flex-[3_1_560px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{PLAN_TEXT.changesTitle}</h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {PLAN_CHANGES.map((change, index) => (
              <li
                key={change.who}
                className={cn(
                  'flex gap-3.5 py-3',
                  index < PLAN_CHANGES.length - 1 && 'border-b border-line-soft',
                )}
              >
                <span className="w-[72px] shrink-0 text-[15px] font-extrabold">{change.who}</span>
                <span className="text-[15px] leading-[1.45]">{change.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          variant="page"
          aria-label="Send the plan"
          className="flex min-w-0 flex-[2_1_380px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{PLAN_TEXT.sendTitle}</h2>
          <p className="m-0 text-[15px] leading-[1.45]">{PLAN_SEND.text}</p>
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
              <Button className="px-5!" onClick={send}>
                {PLAN_TEXT.useThis}
              </Button>
              <Button
                variant="secondary"
                className="px-5!"
                onClick={() => {
                  setSuggested(PLANS.suggested)
                  setEditing(false)
                }}
              >
                {PLAN_TEXT.cancelChanges}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button className="px-5!" onClick={send}>
                {PLAN_TEXT.useSuggested}
              </Button>
              <Button
                variant="secondary"
                className="px-5!"
                onClick={() => {
                  setView('suggested')
                  setEditing(true)
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
