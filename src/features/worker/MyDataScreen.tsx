import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isMockMode } from '../../api/config'
import type { AccessLogRow } from '../../api/converters/accessLog'
import { ApiError, FALLBACK_MESSAGES } from '../../api/errors'
import { useApiData } from '../../api/useApiData'
import {
  deleteHealthProfile,
  loadAccessLog,
  loadDataExport,
  type WorkerAccount,
} from '../../api/workerProfile'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, LockIcon, ShieldIcon, WarningIcon } from '../../components/icons'
import { EmptyState, ErrorState, LoadingState } from '../../components/LoadStates'
import { SectionLabel } from '../../components/SectionLabel'
import { Switch } from '../../components/Switch'
import { MY_DATA } from '../../data/mock'
import type { SharingChoices } from '../../data/types'
import { cn } from '../../lib/cn'
import { SignOutSection } from '../session/SignOutSection'
import { useWorkerAccount } from './account/workerAccount'
import { WithWorkerAccount } from './account/WithWorkerAccount'
import { downloadMyData, saveJsonFile } from './downloadMyData'
import { mockPrecautionView, precautionViewFromApi, type PrecautionView } from './precautionView'
import { useWorkerPreferences } from './workerPreferences'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'
const errorBox =
  'm-0 flex items-start gap-2.5 rounded-xl border-2 border-risk-4 bg-danger-bg px-3.5 py-3 text-[15px] leading-[1.4] font-bold text-danger-text'

// The supervisor row uses a shield on warm orange (06-my-data.html); other roles use info blue.
const ACCESS_ICONS: Record<AccessLogRow['kind'], string> = {
  supervisor: 'bg-warn-bg text-warn-strong',
  other: 'bg-info-bg text-info-text',
}

const message = (error: unknown) =>
  error instanceof ApiError ? error.message : FALLBACK_MESSAGES.unknown

function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className={errorBox}>
      <WarningIcon size={20} strokeWidth={2.2} className="mt-px shrink-0" />
      {children}
    </p>
  )
}

/**
 * "Download my data" and the two-step "Delete my health information". Deleting clears the
 * health profile answers only; consent choices stay.
 */
function YourDataSection({
  onDownload,
  onDelete,
}: {
  onDownload: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  const [step, setStep] = useState<'idle' | 'confirming' | 'deleting' | 'deleted'>('idle')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmRef = useRef<HTMLParagraphElement>(null)
  const deletedRef = useRef<HTMLParagraphElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const [returnFocus, setReturnFocus] = useState(false)

  useEffect(() => {
    if (step === 'confirming') confirmRef.current?.focus()
    if (step === 'deleted') deletedRef.current?.focus()
    if (step === 'idle' && returnFocus) deleteRef.current?.focus()
  }, [step, returnFocus])

  async function download() {
    setDownloading(true)
    setError(null)
    try {
      await onDownload()
    } catch (caught) {
      setError(message(caught))
    } finally {
      setDownloading(false)
    }
  }

  async function confirmDelete() {
    setStep('deleting')
    setError(null)
    try {
      await onDelete()
      setStep('deleted')
    } catch (caught) {
      setError(message(caught))
      setStep('confirming')
    }
  }

  return (
    <section aria-label="Your data" className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={download} disabled={downloading}>
          {downloading ? MY_DATA.downloading : MY_DATA.download}
        </Button>
        {step === 'idle' && (
          <Button ref={deleteRef} variant="danger" onClick={() => setStep('confirming')}>
            {MY_DATA.delete}
          </Button>
        )}
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      {(step === 'confirming' || step === 'deleting') && (
        <Card className="flex flex-col gap-3 border-2 border-risk-4">
          <p
            ref={confirmRef}
            tabIndex={-1}
            className={cn('m-0 text-[15px] leading-[1.45] font-semibold', focusRing)}
          >
            {MY_DATA.deleteConfirm}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="danger" onClick={confirmDelete} disabled={step === 'deleting'}>
              {step === 'deleting' ? MY_DATA.deleting : MY_DATA.deleteConfirmButton}
            </Button>
            <Button
              variant="secondary"
              disabled={step === 'deleting'}
              onClick={() => {
                setReturnFocus(true)
                setStep('idle')
              }}
            >
              {MY_DATA.deleteCancel}
            </Button>
          </div>
        </Card>
      )}

      {step === 'deleted' && (
        <p
          ref={deletedRef}
          role="status"
          tabIndex={-1}
          className={cn(
            'm-0 flex items-center gap-2 rounded-xl bg-ok-bg px-3.5 py-3 text-[15px] font-bold text-ok-text',
            focusRing,
          )}
        >
          <CheckIcon size={20} strokeWidth={2.4} className="shrink-0" />
          {MY_DATA.deleted}
        </p>
      )}
    </section>
  )
}

function AccessLogList({ rows }: { rows: AccessLogRow[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map((row) => (
        <li key={row.id} className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              ACCESS_ICONS[row.kind],
            )}
          >
            <ShieldIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">{row.title}</span>
            <span className="text-[13px] leading-[1.35] text-muted">{row.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

const healthProfileLink = (
  <Link
    to="/worker/health-profile"
    className={cn(
      'flex h-12 items-center justify-center rounded-xl bg-ink text-[15px] font-bold text-surface no-underline',
      focusRing,
    )}
  >
    {MY_DATA.healthProfileLink}
  </Link>
)

interface MyDataViewProps {
  /** null: no health profile, so no precaution card (only the Health profile link). */
  precaution: PrecautionView | null
  sharing: SharingChoices
  onSwitch: (id: keyof SharingChoices, on: boolean) => void
  /** The switch being saved, which is disabled until the server answers. */
  savingSwitch?: keyof SharingChoices | null
  switchError?: string | null
  accessLog: ReactNode
  onDownload: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}

/** Screen 6: My data and privacy. Values from design-reference/html/06-my-data.html. */
function MyDataView({
  precaution,
  sharing,
  onSwitch,
  savingSwitch = null,
  switchError = null,
  accessLog,
  onDownload,
  onDelete,
}: MyDataViewProps) {
  return (
    <>
      <header className="px-5 pt-4 pb-2">
        <h1 className="m-0 text-[22px] font-extrabold">{MY_DATA.title}</h1>
      </header>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {precaution ? (
          <Card aria-label={MY_DATA.precautionLabel} className="flex flex-col gap-2.5">
            <SectionLabel as="h2">{MY_DATA.precautionLabel}</SectionLabel>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-ink px-3 py-1.5 text-[15px] font-bold text-surface">
                {precaution.name}
              </span>
              {precaution.setOn && (
                <span className="text-[14px] text-muted">{MY_DATA.setOn(precaution.setOn)}</span>
              )}
            </div>
            {/* "Request a review" is hidden: no one reviews precaution levels yet. */}
            {healthProfileLink}
          </Card>
        ) : (
          healthProfileLink
        )}

        <Card aria-label={MY_DATA.sharingTitle} className="flex flex-col pt-3 pb-1">
          <h2 className="mb-1 text-[16px] font-bold">{MY_DATA.sharingTitle}</h2>
          {MY_DATA.sharing.map((item, index) => (
            <Switch
              key={item.id}
              size="sm"
              label={item.label}
              description={item.description}
              checked={sharing[item.id]}
              disabled={savingSwitch === item.id}
              onChange={(on) => onSwitch(item.id, on)}
              divider={index < MY_DATA.sharing.length - 1}
            />
          ))}
          {switchError && (
            <div className="pb-3">
              <ErrorLine>{switchError}</ErrorLine>
            </div>
          )}
        </Card>

        <Card aria-label={MY_DATA.accessTitle} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[16px] font-bold">{MY_DATA.accessTitle}</h2>
            <span className="text-[13px] text-muted">{MY_DATA.accessPeriod}</span>
          </div>
          {accessLog}
        </Card>

        <section
          aria-label="Our promise"
          className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-surface"
        >
          <LockIcon size={22} strokeWidth={2.2} className="mt-px shrink-0 text-ink-accent" />
          <p className="m-0 text-[15px] leading-[1.45] font-semibold">{MY_DATA.promise}</p>
        </section>

        <YourDataSection onDownload={onDownload} onDelete={onDelete} />
        <SignOutSection />
      </div>
    </>
  )
}

/** Sample data: everything is kept on the device. */
function MockMyDataScreen() {
  const preferences = useWorkerPreferences()
  return (
    <MyDataView
      precaution={mockPrecautionView()}
      sharing={preferences.sharing}
      onSwitch={preferences.setSharing}
      accessLog={
        <AccessLogList
          rows={MY_DATA.accessLog.map((entry) => ({
            id: entry.id,
            kind: entry.id === 'supervisor' ? 'supervisor' : 'other',
            title: entry.who,
            detail: entry.detail,
          }))}
        />
      }
      onDownload={() => downloadMyData(preferences)}
      onDelete={preferences.deleteHealthAnswers}
    />
  )
}

/** GET /me/access-log with loading, slow, error and empty states, inside the card. */
function ApiAccessLog() {
  const log = useApiData(loadAccessLog, (rows) => rows.length === 0)
  if (log.status === 'ready') return <AccessLogList rows={log.data} />
  if (log.status === 'empty') return <EmptyState message={MY_DATA.accessEmpty} />
  if (log.status === 'error') return <ErrorState message={log.error.message} onRetry={log.retry} />
  return <LoadingState slow={log.slow} />
}

/** Api mode: switches save to the server straight away; read aloud is a preference. */
function ApiMyData({ account }: { account: WorkerAccount }) {
  const { setConsents, setReadAloud, refresh } = useWorkerAccount()
  const [savingSwitch, setSavingSwitch] = useState<keyof SharingChoices | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const sharing: SharingChoices = { ...account.consents, voice: account.readAloud }

  async function onSwitch(id: keyof SharingChoices, on: boolean) {
    setSavingSwitch(id)
    setSwitchError(null)
    try {
      if (id === 'voice') await setReadAloud(on)
      else await setConsents({ ...account.consents, [id]: on })
    } catch {
      // The switch stays as the server last confirmed it.
      setSwitchError(MY_DATA.saveFailed)
    } finally {
      setSavingSwitch(null)
    }
  }

  return (
    <MyDataView
      precaution={precautionViewFromApi(account.precaution)}
      sharing={sharing}
      onSwitch={onSwitch}
      savingSwitch={savingSwitch}
      switchError={switchError}
      accessLog={<ApiAccessLog />}
      onDownload={async () =>
        saveJsonFile(await loadDataExport(account.workerId), MY_DATA.downloadFileName)
      }
      onDelete={async () => {
        await deleteHealthProfile(account.workerId)
        // The precaution card goes once the profile is gone. Consent stays as it was.
        await refresh().catch(() => {})
      }}
    />
  )
}

export function MyDataScreen() {
  if (isMockMode) return <MockMyDataScreen />
  return <WithWorkerAccount>{(account) => <ApiMyData account={account} />}</WithWorkerAccount>
}
