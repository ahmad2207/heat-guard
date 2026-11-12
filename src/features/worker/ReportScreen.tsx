import { useEffect, useId, useRef, useState } from 'react'
import { isMockMode } from '../../api/config'
import { sendFirstAidAlert, sendSymptomReport } from '../../api/liveWorker'
import type { OutboxOutcome } from '../../api/outbox'
import { Button, ButtonLink } from '../../components/Button'
import { CheckTile } from '../../components/CheckTile'
import { CheckIcon, LockIcon } from '../../components/icons'
import { LIVE_TEXT, SYMPTOM_REPORT } from '../../data/mock'
import { cn } from '../../lib/cn'
import { useCurrentSession } from '../session/session'
import { useWorkerPreferences } from './workerPreferences'

type SendState = 'idle' | 'sending' | 'sent' | 'queued'

/** Api mode: what an outbox outcome means for the screen. A refusal is shown as an error. */
const stateFor = (outcome: OutboxOutcome): SendState | 'failed' =>
  outcome.status === 'sent' ? 'sent' : outcome.status === 'queued' ? 'queued' : 'failed'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2'

/** Screen 5: Report symptoms. Values from design-reference/html/05-report-symptoms.html. */
export function ReportScreen() {
  const { emergency } = SYMPTOM_REPORT
  const { sharing } = useWorkerPreferences()
  // Api mode: the site's emergency number from /me. The call link always shows.
  const siteNumber = useCurrentSession()?.site?.emergencyNumber
  const phoneNumber = isMockMode ? emergency.phoneNumber : siteNumber || emergency.phoneNumber
  const phoneLabel = isMockMode ? emergency.phoneLabel : phoneNumber
  const noteId = useId()
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [alertState, setAlertState] = useState<SendState>('idle')
  const [reportState, setReportState] = useState<SendState>('idle')
  const [error, setError] = useState<string | null>(null)
  const firstAiderAlerted = alertState === 'sent' || alertState === 'queued'
  const sent = reportState === 'sent' || reportState === 'queued'

  /** "Alert first aider": always sent; queued when offline. */
  async function alertFirstAider() {
    setError(null)
    if (isMockMode) return setAlertState('sent')
    setAlertState('sending')
    const next = stateFor(await sendFirstAidAlert())
    if (next === 'failed') {
      setAlertState('idle')
      setError(LIVE_TEXT.alertFailed)
    } else setAlertState(next)
  }

  /** "Send report": details only when the worker shares symptom details (D5). */
  async function sendReport() {
    setError(null)
    if (isMockMode) return setReportState('sent')
    setReportState('sending')
    const symptoms = Object.keys(ticked).filter((id) => ticked[id])
    const next = stateFor(await sendSymptomReport({ symptoms, note }, sharing.reports))
    if (next === 'failed') {
      setReportState('idle')
      setError(LIVE_TEXT.reportFailed)
    } else setReportState(next)
  }

  const count = Object.values(ticked).filter(Boolean).length
  const canSend = count > 0 || note.trim() !== ''
  const sendLabel =
    count > 0
      ? `Send report (${count} ticked)`
      : canSend
        ? 'Send report'
        : SYMPTOM_REPORT.sendDisabledLabel

  // Both buttons disappear when pressed, so move focus to what replaces them.
  const alertedRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (firstAiderAlerted) alertedRef.current?.focus()
  }, [firstAiderAlerted])
  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  return (
    <>
      <header className="px-5 pt-4 pb-2">
        <h1 className="m-0 text-[22px] font-extrabold">How are you feeling?</h1>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <section
          aria-label="Emergency"
          className="flex flex-col gap-2.5 rounded-[18px] bg-risk-4 p-4 text-risk-4-text"
        >
          <h2 className="m-0 text-[17px] font-extrabold">{emergency.title}</h2>
          <p className="m-0 text-[15px] leading-[1.4]">{emergency.text}</p>
          <div className="grid grid-cols-2 gap-2">
            {firstAiderAlerted ? (
              <div
                ref={alertedRef}
                role="status"
                tabIndex={-1}
                className={cn(
                  'col-span-2 flex min-h-[50px] items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-[15px] font-extrabold text-ink',
                  focusRing,
                  'focus-visible:outline-surface',
                )}
              >
                <CheckIcon size={20} strokeWidth={2.4} className="shrink-0 text-ok" />
                <span className="flex flex-col">
                  {SYMPTOM_REPORT.alertedText}
                  {alertState === 'queued' && (
                    <span className="text-[13px] font-bold text-warn-text">{LIVE_TEXT.queued}</span>
                  )}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={alertFirstAider}
                disabled={alertState === 'sending'}
                className={cn(
                  'h-[50px] rounded-xl bg-surface px-2 text-[15px] font-extrabold text-danger-text',
                  focusRing,
                  'focus-visible:outline-surface',
                )}
              >
                Alert first aider
              </button>
            )}
            <a
              href={`tel:${phoneNumber}`}
              className={cn(
                'flex min-h-[50px] items-center justify-center rounded-xl border-2 border-surface px-2 text-center text-[15px] leading-tight font-extrabold text-surface no-underline',
                firstAiderAlerted && 'col-span-2',
                focusRing,
                'focus-visible:outline-surface',
              )}
            >
              Call {phoneLabel}
            </a>
          </div>
        </section>

        {sent ? (
          <section
            ref={sentRef}
            role="status"
            tabIndex={-1}
            aria-labelledby={`${noteId}-sent`}
            className={cn(
              'flex flex-col gap-2.5 rounded-2xl bg-surface p-5',
              focusRing,
              'focus-visible:outline-ink',
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-ok-bg text-ok-text">
              <CheckIcon size={26} strokeWidth={2.4} />
            </span>
            <h2 id={`${noteId}-sent`} className="m-0 text-[20px] font-extrabold">
              {SYMPTOM_REPORT.sentTitle}
            </h2>
            <p className="m-0 text-[15px] leading-[1.45]">
              {sharing.reports ? SYMPTOM_REPORT.sentText : SYMPTOM_REPORT.sentTextNoDetails}
            </p>
            {reportState === 'queued' && (
              <p className="m-0 text-[15px] font-bold text-warn-text">{LIVE_TEXT.queued}</p>
            )}
            <ButtonLink to="/worker" variant="secondary" className="mt-1 self-start">
              Back to Status
            </ButtonLink>
          </section>
        ) : (
          <fieldset className="m-0 flex flex-col gap-2.5 rounded-2xl border-0 bg-surface p-4">
            <legend className="float-left mb-1 p-0 text-[16px] font-bold">
              Tick anything you feel now
            </legend>
            <div className="clear-both grid grid-cols-2 gap-2">
              {SYMPTOM_REPORT.symptoms.map((symptom) => (
                <CheckTile
                  key={symptom.id}
                  name="symptoms"
                  value={symptom.id}
                  label={symptom.label}
                  checked={!!ticked[symptom.id]}
                  onChange={(on) => setTicked((current) => ({ ...current, [symptom.id]: on }))}
                />
              ))}
            </div>
            <label htmlFor={noteId} className="mt-1 text-[15px] font-bold">
              {SYMPTOM_REPORT.noteLabel}
            </label>
            <textarea
              id={noteId}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={SYMPTOM_REPORT.notePlaceholder}
              className={cn(
                'resize-none rounded-xl border border-field p-3 text-[16px] placeholder:text-muted',
                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
              )}
            />
          </fieldset>
        )}

        {error && (
          <p
            role="alert"
            className="m-0 rounded-xl border-2 border-risk-4 bg-danger-bg px-3.5 py-3 text-[15px] leading-[1.4] font-bold text-danger-text"
          >
            {error}
          </p>
        )}

        <div className="flex items-start gap-2.5 px-1 pt-1">
          <LockIcon size={20} className="mt-px shrink-0 text-muted" />
          <p className="m-0 text-[13px] leading-[1.45] text-muted">{SYMPTOM_REPORT.privacy}</p>
        </div>
      </div>

      {!sent && (
        // Pinned above the bottom nav: the nav is 63px plus its bottom padding of 10px or the
        // safe-area inset, whichever is larger.
        <div className="sticky bottom-[calc(63px_+_max(10px,env(safe-area-inset-bottom)))] z-10 bg-ground px-4 pt-3 pb-2">
          <Button
            size="lg"
            fullWidth
            disabled={!canSend || reportState === 'sending'}
            onClick={sendReport}
          >
            {sendLabel}
          </Button>
        </div>
      )}
    </>
  )
}
