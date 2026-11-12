import { useEffect, useRef, useState } from 'react'
import {
  applyShiftAction,
  SHIFT_LABELS,
  shiftTimesFromApi,
  shiftView,
  type ShiftAction,
  type ShiftTimes,
} from '../../../api/converters/shift'
import { sendShiftAction } from '../../../api/liveWorker'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { CalendarIcon } from '../../../components/icons'
import { LIVE_TEXT } from '../../../data/mock'
import { cn } from '../../../lib/cn'
import { formatTime } from '../../../lib/format'
import { useWorkerAccount } from '../account/workerAccount'
import { usePendingCount } from './myRisk'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/**
 * Api mode: Start shift, breaks and End shift on Home, from today's assignment in /me. Hidden in
 * mock mode, while the account loads, and when there is no assignment today.
 */
export function ShiftCard() {
  const { state } = useWorkerAccount()
  // /me has no assignment once a shift is clocked out, so a shift ended on this screen is kept
  // here to keep showing "Shift ended at". After leaving Home the card is hidden, as on a reload.
  const [ended, setEnded] = useState<{ id: string; activity: string; times: ShiftTimes } | null>(
    null,
  )
  const assignment = state.status === 'ready' ? state.account.assignment : null
  const times = shiftTimesFromApi(assignment)
  if (assignment && times) {
    const activity = assignment.activity?.name ?? ''
    return (
      <ShiftCardView
        key={assignment.id}
        assignmentId={assignment.id}
        activity={activity}
        serverTimes={times}
        onEnded={(endedTimes) => setEnded({ id: assignment.id, activity, times: endedTimes })}
      />
    )
  }
  if (ended) {
    return (
      <ShiftCardView
        key={`${ended.id}-ended`}
        assignmentId={ended.id}
        activity={ended.activity}
        serverTimes={ended.times}
      />
    )
  }
  return null
}

function ShiftCardView({
  assignmentId,
  activity,
  serverTimes,
  onEnded,
}: {
  assignmentId: string
  activity: string
  serverTimes: ShiftTimes
  /** Called with the final state when "End shift" is saved. */
  onEnded?: (times: ShiftTimes) => void
}) {
  const { refresh } = useWorkerAccount()
  // Presses change the card straight away; the server's answer (or a fresh /me) replaces it.
  const [times, setTimes] = useState(serverTimes)
  // A fresh /me (after a 409, a sync or a reload) replaces the card's state, keeping any message.
  const serverKey = JSON.stringify(serverTimes)
  const [lastServerKey, setLastServerKey] = useState(serverKey)
  if (serverKey !== lastServerKey) {
    setLastServerKey(serverKey)
    setTimes(serverTimes)
  }
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)
  const queued = usePendingCount(['shift'])
  const view = shiftView(times)
  const confirmRef = useRef<HTMLParagraphElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  /** Counts presses and Cancels, so focus moves to the new first button after each one. */
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
  }, [confirming])
  // The buttons change after each press, so focus moves to the new first button.
  useEffect(() => {
    if (focusTick > 0 && !busy) firstButtonRef.current?.focus()
  }, [focusTick, busy])

  // When presses queued earlier have been sent, load /me again to show the server's state.
  // (A press being sent from here reloads /me itself.)
  const lastQueued = useRef(queued)
  useEffect(() => {
    if (queued < lastQueued.current && !busy) refresh().catch(() => {})
    lastQueued.current = queued
  }, [queued, busy, refresh])

  async function press(action: ShiftAction) {
    setConfirming(false)
    setMessage(null)
    setBusy(true)
    const before = times
    const applied = applyShiftAction(times, action, new Date().toISOString())
    setTimes(applied)
    const outcome = await sendShiftAction(assignmentId, action)
    if (outcome.status === 'sent') {
      const fromServer = shiftTimesFromApi(outcome.response)
      if (fromServer) setTimes(fromServer)
      if (action === 'clock-out') onEnded?.(fromServer ?? applied)
      // Keep the account in step, so Home shows this state after leaving and coming back.
      refresh().catch(() => {})
    } else if (outcome.status === 'queued') {
      if (action === 'clock-out') onEnded?.(applied)
    } else if (outcome.status === 'dropped') {
      setTimes(before)
      if (outcome.error.kind === 'conflict') {
        // The shift had already changed (another device, or a supervisor): load the real state,
        // then say so.
        await refresh().catch(() => {})
        setMessage({ text: LIVE_TEXT.shiftConflict, tone: 'info' })
      } else {
        setMessage({ text: LIVE_TEXT.shiftFailed, tone: 'error' })
      }
    }
    setBusy(false)
    setFocusTick((n) => n + 1)
  }

  const hours = `${formatTime(times.startsAt)} to ${formatTime(times.endsAt)}`

  return (
    <Card aria-label={LIVE_TEXT.shiftTitle} className="flex flex-col gap-3">
      <div className="flex items-center gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-risk-1">
          <CalendarIcon size={22} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[17px] font-bold">{LIVE_TEXT.shiftTitle}</span>
          <span aria-live="polite" className="text-[14px] text-muted">
            {view.status}
          </span>
          {view.phase !== 'not-started' && (
            <span className="text-[13px] text-muted">
              {[activity, hours].filter(Boolean).join(' · ')}
            </span>
          )}
          {/* Not while a press is being sent: only when it is really waiting for signal. */}
          {queued > 0 && !busy && (
            <span className="text-[13px] font-semibold text-warn-text">{LIVE_TEXT.queued}</span>
          )}
        </span>
      </div>

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'm-0 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold',
            message.tone === 'error'
              ? 'bg-danger-bg text-danger-text'
              : 'bg-info-bg text-info-text',
          )}
        >
          {message.text}
        </p>
      )}

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-risk-4 p-3">
          <p
            ref={confirmRef}
            tabIndex={-1}
            className={cn('m-0 text-[15px] font-semibold', focusRing)}
          >
            {LIVE_TEXT.endShiftConfirm}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="danger" onClick={() => void press('clock-out')} disabled={busy}>
              {SHIFT_LABELS['clock-out']}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false)
                setFocusTick((n) => n + 1)
              }}
            >
              {LIVE_TEXT.endShiftCancel}
            </Button>
          </div>
        </div>
      ) : (
        view.actions.length > 0 && (
          <div
            className={cn('grid gap-2', view.actions.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}
          >
            {view.actions.map((action, index) => (
              <Button
                key={action}
                ref={index === 0 ? firstButtonRef : undefined}
                variant={action === 'clock-out' ? 'secondary' : 'primary'}
                disabled={busy}
                onClick={() => (action === 'clock-out' ? setConfirming(true) : void press(action))}
              >
                {SHIFT_LABELS[action]}
              </Button>
            ))}
          </div>
        )
      )}
    </Card>
  )
}
