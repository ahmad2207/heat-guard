import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { AttentionItem } from '../../api/converters/siteToday'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import {
  acknowledgeHelp,
  recordIntervention,
  resolveHelp,
  type InterventionStatus,
} from '../../api/supervisor'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, LockIcon, WarningIcon } from '../../components/icons'
import { RiskBadge } from '../../components/RiskBadge'
import { StatusPill } from '../../components/StatusPill'
import { REASSIGN_OPTIONS, SUPERVISOR_LIVE_TEXT as T, TODAY_TEXT } from '../../data/mock'
import { cn } from '../../lib/cn'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

function Strong({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <strong>{label}</strong> {children}
    </>
  )
}

/** The words for one card. Worker codes only; worker_care shows the need, never the reason. */
function cardText(item: AttentionItem): { title: string; text?: ReactNode; meta: string } {
  switch (item.kind) {
    case 'help':
      return {
        title:
          item.helpKind === 'symptom_report'
            ? T.helpSymptom(item.workerCode)
            : T.helpFirstAid(item.workerCode),
        text: T.helpText,
        meta: `${item.crewName} · ${item.time}`,
      }
    case 'critical':
      return {
        title: T.criticalTitle(item.workerCode),
        text: T.criticalText,
        meta: `${item.crewName} · ${item.time}`,
      }
    case 'crew_risk':
      return {
        title: T.crewRiskTitle(item.crewName, item.activity, item.highOrAbove),
        text: item.doText ? <Strong label="Do:">{item.doText}.</Strong> : undefined,
        meta: item.due ? `Before ${item.due}` : item.time,
      }
    case 'worker_care':
      return {
        title:
          item.need === 'earlier_breaks'
            ? T.earlierBreaks(item.workerCode)
            : T.reducedExposure(item.workerCode),
        meta: `${item.crewName} · ${item.time}`,
      }
  }
}

const isAcknowledged = (item: AttentionItem) => item.status === 'acknowledged'

/**
 * Needs attention on supervisor Today (api mode). Every button saves to the backend and then
 * reloads the page's data, so the list always shows the server's state.
 */
export function NeedsAttentionLive({
  open,
  items,
  onChanged,
}: {
  open: number
  items: AttentionItem[]
  /** Reloads Today after a button has been saved. */
  onChanged: () => Promise<void>
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [reassigning, setReassigning] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstChoiceRef = useRef<HTMLButtonElement>(null)
  const baseId = useId()

  useEffect(() => {
    if (reassigning) firstChoiceRef.current?.focus()
  }, [reassigning])

  async function run(item: AttentionItem, done: string, action: () => Promise<void>) {
    setBusy(item.id)
    setErrors((e) => ({ ...e, [item.id]: '' }))
    try {
      await action()
      setReassigning(null)
      setAnnouncement(`${done}: ${cardText(item).title}`)
      await onChanged()
      // The pressed button may be gone after the reload: keep focus in this card.
      headingRef.current?.focus()
    } catch (error) {
      setErrors((e) => ({
        ...e,
        [item.id]: error instanceof ApiError ? error.message : FALLBACK_MESSAGES.unknown,
      }))
    } finally {
      setBusy(null)
    }
  }
  const intervene = (
    item: AttentionItem,
    status: InterventionStatus,
    done: string,
    note?: string,
  ) => run(item, done, () => recordIntervention(item.id, status, note))

  return (
    <Card
      variant="page"
      aria-label="Urgent alerts"
      className="flex min-w-0 flex-[3_1_604px] flex-col gap-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={cn('rounded text-[18px] font-extrabold', focusRing)}
        >
          Needs attention
        </h2>
        <span className="text-[14px] text-muted">{open} open</span>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {items.length === 0 && (
        <p className="m-0 text-[15px] text-muted">{TODAY_TEXT.nothingNeedsAttention}</p>
      )}

      {items.map((item) => {
        const { title, text, meta } = cardText(item)
        const titleId = `${baseId}-${item.kind}-${item.id}`
        const urgent = item.kind === 'help' || item.kind === 'critical'
        const disabled = busy === item.id
        return (
          <article
            key={`${item.kind}-${item.id}`}
            aria-labelledby={titleId}
            aria-busy={disabled || undefined}
            className={cn(
              'flex flex-col gap-2.5 rounded-[14px] p-4',
              urgent ? 'border-2 border-risk-4' : 'border border-line',
              item.kind === 'critical' && 'bg-danger-bg',
            )}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {item.kind === 'help' && <StatusPill status="act-now" />}
              {item.kind === 'critical' && <RiskBadge level={4} size="sm" />}
              {item.kind === 'crew_risk' && <RiskBadge level={item.level} size="sm" />}
              <h3 id={titleId} className="text-[16px] font-extrabold">
                {title}
              </h3>
              {item.kind !== 'help' && isAcknowledged(item) && (
                <StatusPill status="acknowledged">Acknowledged</StatusPill>
              )}
              <span className="ml-auto text-[13px] text-muted">{meta}</span>
            </div>

            {text && <p className="m-0 text-[15px] leading-[1.45]">{text}</p>}
            {item.kind === 'worker_care' && (
              <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
                <LockIcon size={16} className="shrink-0" />
                {T.healthNote}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {item.kind === 'help' && (
                <>
                  {item.acknowledgedAt ? (
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-info-bg px-[18px] text-[15px] font-bold text-info-text">
                      <CheckIcon size={18} strokeWidth={2.4} />
                      {TODAY_TEXT.onMyWay} · {item.acknowledgedAt}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={disabled}
                      onClick={() => void run(item, T.onMyWayDone, () => acknowledgeHelp(item.id))}
                    >
                      {T.onMyWay}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => void run(item, T.resolvedDone, () => resolveHelp(item.id))}
                  >
                    {T.markResolved}
                  </Button>
                </>
              )}

              {item.kind === 'critical' && (
                <>
                  {!isAcknowledged(item) && (
                    <Button
                      size="sm"
                      disabled={disabled}
                      onClick={() => void intervene(item, 'acknowledged', T.acknowledgedDone)}
                    >
                      {T.acknowledge}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => void intervene(item, 'implemented', T.stoppedDone)}
                  >
                    {T.activityStopped}
                  </Button>
                </>
              )}

              {item.kind === 'crew_risk' && (
                <>
                  {!isAcknowledged(item) && (
                    <Button
                      size="sm"
                      disabled={disabled}
                      onClick={() => void intervene(item, 'acknowledged', T.acknowledgedDone)}
                    >
                      {T.acknowledge}
                    </Button>
                  )}
                  <ButtonLink to="/supervisor/plan" size="sm" variant="secondary">
                    {T.changeShiftTiming}
                  </ButtonLink>
                </>
              )}

              {item.kind === 'worker_care' &&
                (reassigning === item.id ? (
                  <div
                    role="group"
                    aria-labelledby={`${titleId}-reassign`}
                    className="flex w-full flex-col gap-2 rounded-xl bg-ground p-3"
                  >
                    <p id={`${titleId}-reassign`} className="m-0 text-[14px] font-bold">
                      {TODAY_TEXT.reassignTo}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REASSIGN_OPTIONS.map((option, index) => (
                        <Button
                          key={option}
                          ref={index === 0 ? firstChoiceRef : undefined}
                          size="sm"
                          variant="secondary"
                          disabled={disabled}
                          onClick={() =>
                            void intervene(
                              item,
                              'reassigned',
                              `${TODAY_TEXT.reassignedTo} ${option}`,
                              option,
                            )
                          }
                        >
                          {option}
                        </Button>
                      ))}
                      <Button size="sm" variant="secondary" onClick={() => setReassigning(null)}>
                        {TODAY_TEXT.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button size="sm" disabled={disabled} onClick={() => setReassigning(item.id)}>
                      {T.reassign}
                    </Button>
                    {!isAcknowledged(item) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => void intervene(item, 'acknowledged', T.acknowledgedDone)}
                      >
                        {T.acknowledge}
                      </Button>
                    )}
                  </>
                ))}
            </div>

            {errors[item.id] && (
              <p
                role="alert"
                className="m-0 flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-2.5 text-[14px] font-semibold text-danger-text"
              >
                <WarningIcon size={18} strokeWidth={2.2} className="mt-px shrink-0" />
                {errors[item.id]}
              </p>
            )}
          </article>
        )
      })}
    </Card>
  )
}
