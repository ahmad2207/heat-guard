import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { StatusPill } from '../../components/StatusPill'
import { OH_ESCALATION, OH_OUTCOMES, OH_TEXT } from '../../data/mock'
import { now } from '../../lib/clock'
import { cn } from '../../lib/cn'
import { useEscalationOutcomes } from './escalationOutcomes'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/** The open escalation (W-0388). Values from design-reference/html/11-occupational-health.html. */
export function EscalationCard() {
  const e = OH_ESCALATION
  const noteId = useId()
  const [note, setNote] = useState('')
  const { outcomes, setOutcome } = useEscalationOutcomes()
  const outcome = outcomes[e.workerId]
  const [justChose, setJustChose] = useState(0)
  const resultRef = useRef<HTMLParagraphElement>(null)

  // Move focus to the result every time an outcome is chosen, including when it changes.
  useEffect(() => {
    if (justChose) resultRef.current?.focus()
  }, [justChose])

  const chosen = OH_OUTCOMES.find((option) => option.id === outcome?.id)
  const facts = [
    ['Symptoms reported', e.symptoms],
    ['Conditions at the time', e.conditions],
    ['First aid', e.firstAid],
  ]

  return (
    <Card
      variant="page"
      aria-label="Open escalation"
      className="flex min-w-0 flex-[3_1_604px] flex-col gap-3.5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill status="escalation" />
        <h2 className="text-[18px] font-extrabold">
          Worker {e.workerId} · {e.crew}
        </h2>
        <span className="ml-auto text-[13px] text-muted">{e.reportedAt}</span>
      </div>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-ground px-3.5 py-3">
            <dt className="text-[12px] font-bold text-muted">{label}</dt>
            <dd className="m-0 text-[15px] font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="text-[14px] font-bold">
          {OH_TEXT.clinicalNoteLabel}
        </label>
        <textarea
          id={noteId}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={OH_TEXT.clinicalNotePlaceholder}
          className={cn(
            'resize-y rounded-xl border border-field p-3 text-[15px] placeholder:text-muted',
            focusRing,
          )}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {OH_OUTCOMES.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={option.variant}
            aria-pressed={outcome?.id === option.id}
            onClick={() => {
              setOutcome(e.workerId, { id: option.id, at: now() })
              setJustChose((count) => count + 1)
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {chosen && outcome && (
        <div className="flex flex-col gap-1 rounded-xl bg-info-bg px-3.5 py-3 text-info-text">
          <p className="m-0 text-[15px] font-bold">
            {OH_TEXT.outcome}: {chosen.label} · {outcome.at}
          </p>
          <p
            ref={resultRef}
            role="status"
            tabIndex={-1}
            className={cn('m-0 rounded text-[14px]', focusRing)}
          >
            {OH_TEXT.supervisorSees}: {chosen.supervisorSees}.
          </p>
        </div>
      )}

      <p className="m-0 text-[13px] text-muted">{e.outcomeNote}</p>
    </Card>
  )
}
