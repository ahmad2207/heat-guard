import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, LockIcon } from '../../components/icons'
import { RiskBadge } from '../../components/RiskBadge'
import { StatusPill } from '../../components/StatusPill'
import { OH_OUTCOMES, REASSIGN_OPTIONS, TODAY_TEXT } from '../../data/mock'
import { useEscalationOutcomes } from '../occupational-health/escalationOutcomes'
import type { NeedsAttentionAlert } from '../../data/types'
import { now } from '../../lib/clock'
import { cn } from '../../lib/cn'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

interface AlertState {
  onMyWayAt?: string
  acknowledgedAt?: string
  resolvedAt?: string
  /** True while the Reassign choices are open. */
  reassigning?: boolean
  reassignedTo?: string
  reassignedAt?: string
}

/** What to focus after a button disappears: an alert's status, or the resolved line. */
type FocusTarget =
  | { id: string; part: 'onMyWay' | 'acknowledged' | 'reassignFirst' | 'reassigned' | 'reassign' }
  | { part: 'resolved' }
  | null

function Strong({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <strong>{label}</strong> {children}
    </>
  )
}

/**
 * Needs attention on supervisor Today. Symptom reports come first. Button state is kept in this
 * component only for now.
 */
export function NeedsAttention({ alerts }: { alerts: NeedsAttentionAlert[] }) {
  const [state, setState] = useState<Record<string, AlertState>>({})
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null)
  // Elements that take focus after a button disappears get an id built from this.
  const baseId = useId()
  const focusId = (key: string) => `${baseId}-${key}`

  useEffect(() => {
    if (!focusTarget) return
    const key =
      focusTarget.part === 'resolved' ? 'resolved' : `${focusTarget.id}-${focusTarget.part}`
    document.getElementById(`${baseId}-${key}`)?.focus()
  }, [focusTarget, state, baseId])

  const { outcomes } = useEscalationOutcomes()
  const outcomeFor = (workerId: string) => {
    const saved = outcomes[workerId]
    const option = OH_OUTCOMES.find((o) => o.id === saved?.id)
    return saved && option ? `${option.supervisorSees} · ${saved.at}` : undefined
  }

  const update = (id: string, change: AlertState) =>
    setState((current) => ({ ...current, [id]: { ...current[id], ...change } }))

  // Symptom reports first, then the rest in their usual order.
  const ordered = [...alerts].sort(
    (a, b) => Number(b.kind === 'symptom') - Number(a.kind === 'symptom'),
  )
  const open = ordered.filter((alert) => !state[alert.id]?.resolvedAt)
  const resolved = ordered.filter((alert) => state[alert.id]?.resolvedAt)

  return (
    <Card
      variant="page"
      aria-label="High-priority alerts"
      className="flex min-w-0 flex-[3_1_604px] flex-col gap-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Needs attention</h2>
        <span className="text-[14px] text-muted">{open.length} open</span>
      </div>

      {open.length === 0 && (
        <p className="m-0 text-[15px] text-muted">{TODAY_TEXT.nothingNeedsAttention}</p>
      )}

      {open.map((alert) => {
        const alertState = state[alert.id] ?? {}
        const isSymptom = alert.kind === 'symptom'
        const acknowledged = alertState.acknowledgedAt

        return (
          <article
            key={alert.id}
            aria-labelledby={`${alert.id}-title`}
            className={cn(
              'flex flex-col gap-2.5 rounded-[14px] p-4',
              isSymptom ? 'border-2 border-risk-4' : 'border border-line',
            )}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              {alert.kind === 'symptom' && <StatusPill status="act-now" />}
              {alert.kind === 'crew-risk' && <RiskBadge level={alert.level} size="sm" />}
              {alert.kind === 'precaution' && (
                <StatusPill status="precaution">{alert.levelName}</StatusPill>
              )}
              <h3 id={`${alert.id}-title`} className="text-[16px] font-extrabold">
                {alert.title}
              </h3>
              {acknowledged && (
                <span
                  id={focusId(`${alert.id}-acknowledged`)}
                  role="status"
                  tabIndex={-1}
                  className={cn('rounded-full', focusRing)}
                >
                  <StatusPill status="acknowledged">Acknowledged {acknowledged}</StatusPill>
                </span>
              )}
              <span className="ml-auto text-[13px] text-muted">{alert.meta}</span>
            </div>

            {alert.kind === 'symptom' && (
              <p className="m-0 text-[15px] leading-[1.45]">{alert.text}</p>
            )}
            {alert.kind === 'symptom' && outcomeFor(alert.workerId) && (
              // Only the outcome reaches the supervisor, never symptoms or the clinical note.
              <p className="m-0 rounded-xl bg-info-bg px-3.5 py-2.5 text-[15px] font-bold text-info-text">
                {TODAY_TEXT.occupationalHealth}: {outcomeFor(alert.workerId)}
              </p>
            )}
            {alert.kind === 'crew-risk' && (
              <p className="m-0 text-[15px] leading-[1.45]">
                <Strong label="Why:">{alert.why}</Strong> <Strong label="Do:">{alert.do}</Strong>
              </p>
            )}
            {alert.kind === 'precaution' && (
              <>
                <p className="m-0 text-[15px] leading-[1.45]">
                  <Strong label="Do:">{alert.do}</Strong>
                </p>
                <p className="m-0 flex items-center gap-2 text-[13px] text-muted">
                  <LockIcon size={16} className="shrink-0" />
                  {alert.note}
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              {alert.kind === 'symptom' && (
                <>
                  {alertState.onMyWayAt ? (
                    <span
                      id={focusId(`${alert.id}-onMyWay`)}
                      role="status"
                      tabIndex={-1}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-info-bg px-[18px] text-[15px] font-bold text-info-text',
                        focusRing,
                      )}
                    >
                      <CheckIcon size={18} strokeWidth={2.4} />
                      {TODAY_TEXT.onMyWay} · {alertState.onMyWayAt}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        update(alert.id, { onMyWayAt: now() })
                        setFocusTarget({ id: alert.id, part: 'onMyWay' })
                      }}
                    >
                      {alert.actions[0]}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      update(alert.id, { resolvedAt: now() })
                      setFocusTarget({ part: 'resolved' })
                    }}
                  >
                    {alert.actions[1]}
                  </Button>
                </>
              )}

              {alert.kind === 'crew-risk' && (
                <>
                  {!acknowledged && (
                    <Button
                      size="sm"
                      onClick={() => {
                        update(alert.id, { acknowledgedAt: now() })
                        setFocusTarget({ id: alert.id, part: 'acknowledged' })
                      }}
                    >
                      {alert.actions[0]}
                    </Button>
                  )}
                  <ButtonLink to="/supervisor/plan" size="sm" variant="secondary">
                    {alert.actions[1]}
                  </ButtonLink>
                </>
              )}

              {alert.kind === 'precaution' && (
                <>
                  {alertState.reassignedTo ? (
                    <span
                      id={focusId(`${alert.id}-reassigned`)}
                      role="status"
                      tabIndex={-1}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-info-bg px-[18px] text-[15px] font-bold text-info-text',
                        focusRing,
                      )}
                    >
                      <CheckIcon size={18} strokeWidth={2.4} />
                      {TODAY_TEXT.reassignedTo} {alertState.reassignedTo} ·{' '}
                      {alertState.reassignedAt}
                    </span>
                  ) : alertState.reassigning ? (
                    <div
                      role="group"
                      aria-labelledby={focusId(`${alert.id}-reassign-label`)}
                      className="flex w-full flex-col gap-2 rounded-xl bg-ground p-3"
                    >
                      <p
                        id={focusId(`${alert.id}-reassign-label`)}
                        className="m-0 text-[14px] font-bold"
                      >
                        {TODAY_TEXT.reassignTo}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {REASSIGN_OPTIONS.map((option, index) => (
                          <Button
                            key={option}
                            id={index === 0 ? focusId(`${alert.id}-reassignFirst`) : undefined}
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              update(alert.id, {
                                reassigning: false,
                                reassignedTo: option,
                                reassignedAt: now(),
                              })
                              setFocusTarget({ id: alert.id, part: 'reassigned' })
                            }}
                          >
                            {option}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            update(alert.id, { reassigning: false })
                            setFocusTarget({ id: alert.id, part: 'reassign' })
                          }}
                        >
                          {TODAY_TEXT.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      id={focusId(`${alert.id}-reassign`)}
                      size="sm"
                      onClick={() => {
                        update(alert.id, { reassigning: true })
                        setFocusTarget({ id: alert.id, part: 'reassignFirst' })
                      }}
                    >
                      {alert.actions[0]}
                    </Button>
                  )}
                  {!acknowledged && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        update(alert.id, { acknowledgedAt: now() })
                        setFocusTarget({ id: alert.id, part: 'acknowledged' })
                      }}
                    >
                      {alert.actions[1]}
                    </Button>
                  )}
                </>
              )}
            </div>
          </article>
        )
      })}

      {/* Always present so screen readers announce it; pulled up while empty so it adds no gap. */}
      <div
        id={focusId('resolved')}
        role="status"
        tabIndex={-1}
        className={cn('rounded-lg', focusRing, resolved.length === 0 && '-mt-3.5')}
      >
        {resolved.length > 0 && (
          <p className="m-0 flex items-start gap-2 text-[14px] text-muted">
            <CheckIcon size={18} strokeWidth={2.4} className="mt-px shrink-0 text-ok" />
            <span>
              <strong className="text-ink">{TODAY_TEXT.resolvedToday}:</strong>{' '}
              {resolved
                .map((alert) => `${alert.title} (${state[alert.id]?.resolvedAt})`)
                .join('; ')}
            </span>
          </p>
        )}
      </div>
    </Card>
  )
}
