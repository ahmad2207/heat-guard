import { useCallback, useEffect, useState } from 'react'
import type { DataSource, HazardRow, RiskView } from '../../api/converters/myRisk'
import { addCup, loadWater } from '../../api/liveWorker'
import { useApiData } from '../../api/useApiData'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { ForecastStrip, type ForecastHour } from '../../components/ForecastStrip'
import { CheckIcon, ClockIcon, DropIcon, DustIcon, StormIcon } from '../../components/icons'
import { ErrorState, LoadingState } from '../../components/LoadStates'
import { RiskCard } from '../../components/RiskCard'
import { StatusPill } from '../../components/StatusPill'
import {
  EXTRA_PRECAUTIONS_REASON,
  FIELD_MODE,
  LIVE_TEXT,
  precautionFor,
  WORKER,
  WORKER_STATUS,
} from '../../data/mock'
import { useDevSettings } from '../../dev/devSettings'
import { RISK_WORKER_MESSAGES, riskName, type RiskLevel } from '../../lib/risk'
import { useSpeech } from '../../lib/useSpeech'
import { ScreenStatus } from './account/WithWorkerAccount'
import { FieldModeView } from './FieldModeView'
import { useMyRisk, usePendingCount } from './live/myRisk'
import { useFieldMode, type ReconnectStatus } from './useFieldMode'
import { WorkerHomeHeader } from './WorkerHomeHeader'

const HAZARD_ICONS = { dust: DustIcon, storm: StormIcon }

const BACK_ONLINE_MS = 4000

/** Everything the Home status view shows, from sample data or from GET /me/risk. */
interface StatusData {
  level: RiskLevel
  /** The main instruction. Defaults to the standard message for the level. */
  message?: string
  updatedAt: string
  dataSources: DataSource[]
  /** dataQuality "degraded": shows "No fresh heat data". */
  degraded?: boolean
  nextBreak: { title: string; detail: string } | null
  reasons: string[]
  forecast: { hours: ForecastHour[]; confidence: string | null }
  hazards: Array<Pick<HazardRow, 'id' | 'icon' | 'title' | 'detail'> & { pill?: HazardRow['pill'] }>
}

interface WaterData {
  /** null while the count is loading or could not be loaded. */
  cups: number | null
  onAddCup: () => void
  /** Cups waiting to be sent. */
  queued?: number
  error?: string | null
}

/**
 * Screen 3: worker Home. Switches to field mode (screen 7) when offline, forced by the dev panel,
 * or (api mode) when the server cannot be reached.
 */
export function HomeScreen() {
  const fieldMode = useFieldMode()
  const risk = useMyRisk()
  const api = risk.status !== 'mock'

  // Api mode: "Try to reconnect" also tries the server again.
  const [apiReconnect, setApiReconnect] = useState<ReconnectStatus>('idle')
  const reconnect = async () => {
    fieldMode.reconnect()
    if (!api) return
    setApiReconnect('checking')
    setApiReconnect((await risk.refresh()) ? 'idle' : 'failed')
  }
  const active = fieldMode.active || (api && risk.unreachable)

  // When field mode ends, briefly say that the data is up to date again.
  const [wasFieldMode, setWasFieldMode] = useState(active)
  const [showBackOnline, setShowBackOnline] = useState(false)
  if (active !== wasFieldMode) {
    setWasFieldMode(active)
    setShowBackOnline(!active)
  }
  useEffect(() => {
    if (!showBackOnline) return
    const timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS)
    return () => clearTimeout(timer)
  }, [showBackOnline])

  if (active) {
    const status = api && apiReconnect !== 'idle' ? apiReconnect : fieldMode.status
    return <FieldModeView reconnect={reconnect} status={status} />
  }
  if (!api) return <MockStatus showBackOnline={showBackOnline} />
  if (risk.view) return <ApiStatus view={risk.view} showBackOnline={showBackOnline} />
  if (risk.status === 'loading') {
    return (
      <>
        <WorkerHomeHeader />
        <ScreenStatus>
          <LoadingState slow={risk.slow} />
        </ScreenStatus>
      </>
    )
  }
  return (
    <>
      <WorkerHomeHeader />
      <ScreenStatus>
        <ErrorState
          message={risk.error?.message ?? 'Your heat risk is not available right now.'}
          onRetry={() => void risk.refresh()}
        />
      </ScreenStatus>
    </>
  )
}

/** Sample data: the dev panel sets the level. */
function MockStatus({ showBackOnline }: { showBackOnline: boolean }) {
  const { riskLevel } = useDevSettings()
  // "Extra precautions" only shows while W-0412 is on Enhanced or High-priority precautions.
  const { level } = precautionFor(WORKER.id)
  const [cups, setCups] = useState(WORKER_STATUS.water.cupsToday)
  return (
    <StatusView
      showBackOnline={showBackOnline}
      data={{
        level: riskLevel,
        updatedAt: WORKER_STATUS.updatedAt,
        dataSources: WORKER_STATUS.dataSources,
        nextBreak: WORKER_STATUS.nextBreak,
        reasons: WORKER_STATUS.reasons.filter(
          (reason) => reason !== EXTRA_PRECAUTIONS_REASON || level !== 'standard',
        ),
        forecast: WORKER_STATUS.forecast,
        hazards: WORKER_STATUS.hazards,
      }}
      water={{ cups, onAddCup: () => setCups((count) => count + 1) }}
    />
  )
}

/** Api mode: GET /me/risk (from the shared provider) and GET /me/water. */
function ApiStatus({ view, showBackOnline }: { view: RiskView; showBackOnline: boolean }) {
  const water = useApiData(loadWater)
  const queued = usePendingCount(['water'])
  const [serverCups, setServerCups] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loaded = water.status === 'ready' ? water.data.cupsToday : null

  // When queued cups are sent later (back online), load the count again from the server.
  const [lastQueued, setLastQueued] = useState(queued)
  if (queued !== lastQueued) {
    setLastQueued(queued)
    if (queued < lastQueued) {
      setServerCups(null)
      water.retry()
    }
  }
  const cups = serverCups ?? loaded

  const onAddCup = useCallback(async () => {
    setError(null)
    const outcome = await addCup()
    if (outcome.status === 'sent') {
      const body = outcome.response as { cupsToday?: unknown } | undefined
      if (typeof body?.cupsToday === 'number') setServerCups(body.cupsToday)
    }
    if (outcome.status === 'dropped') setError(LIVE_TEXT.cupFailed)
  }, [])

  return (
    <StatusView
      showBackOnline={showBackOnline}
      data={{
        level: view.level,
        message: view.instruction || undefined,
        updatedAt: view.updatedAt,
        dataSources: view.dataSources,
        degraded: view.degraded,
        nextBreak: view.nextBreak,
        reasons: view.reasons,
        forecast: view.forecast,
        hazards: view.hazards,
      }}
      water={{
        // Cups waiting to be sent are counted, so the number goes up as soon as it is pressed.
        cups: cups === null ? null : cups + queued,
        onAddCup: () => void onAddCup(),
        queued,
        error,
      }}
    />
  )
}

/** Screen 3: worker Home. Values from design-reference/html/03-home.html and 03b-home-critical.html. */
function StatusView({
  data,
  water,
  showBackOnline,
}: {
  data: StatusData
  water: WaterData
  showBackOnline: boolean
}) {
  const { speak } = useSpeech()
  const { level, nextBreak, forecast } = data
  const message = data.message ?? RISK_WORKER_MESSAGES[level]

  const listen = speak
    ? () =>
        speak(
          `Your heat risk now: ${riskName(level)}, level ${level} of 4. ${message}` +
            (nextBreak ? ` ${nextBreak.title}. ${nextBreak.detail}.` : ''),
        )
    : undefined

  return (
    <>
      <WorkerHomeHeader />
      {/* The design has no visible page title on Home; this one is for screen readers. */}
      <h1 className="sr-only">Your heat status</h1>

      <div role="status" className="px-4">
        {showBackOnline && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-ok-bg px-3.5 py-2.5 text-[15px] font-bold text-ok-text">
            <CheckIcon size={20} strokeWidth={2.4} />
            {FIELD_MODE.backOnline}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div aria-label="Data sources" className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="mr-0.5 text-muted">{data.updatedAt} from</span>
          {data.dataSources.map((source) => (
            <Chip key={source.label} variant="source" ok={source.ok}>
              {source.label}
            </Chip>
          ))}
          {data.degraded && (
            <span className="ml-0.5 font-bold text-warn-text">{LIVE_TEXT.noFreshData}</span>
          )}
        </div>

        <RiskCard level={level} message={message} onListen={listen} />

        <Card aria-label="Breaks and water" className="flex flex-col gap-3.5">
          {nextBreak && (
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-risk-1">
                <ClockIcon size={22} stopwatch />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[17px] font-bold">{nextBreak.title}</span>
                <span className="text-[14px] text-muted">{nextBreak.detail}</span>
              </span>
            </div>
          )}
          <div
            className={
              nextBreak
                ? 'flex items-center gap-3.5 border-t border-line-soft pt-3.5'
                : 'flex items-center gap-3.5'
            }
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-risk-1">
              <DropIcon size={22} />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span aria-live="polite" className="text-[17px] font-bold">
                {water.cups === null
                  ? 'Water today'
                  : `Water: ${water.cups} ${water.cups === 1 ? 'cup' : 'cups'} today`}
              </span>
              <span className="text-[14px] text-muted">{WORKER_STATUS.water.advice}</span>
              {!!water.queued && (
                <span className="text-[13px] font-semibold text-warn-text">{LIVE_TEXT.queued}</span>
              )}
              {water.error && (
                <span role="alert" className="text-[13px] font-semibold text-danger-text">
                  {water.error}
                </span>
              )}
            </span>
            <button
              type="button"
              aria-label="Add a cup of water"
              onClick={water.onAddCup}
              className="h-11 shrink-0 rounded-xl border border-field bg-surface px-3.5 text-[15px] font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              + Cup
            </button>
          </div>
        </Card>

        {data.reasons.length > 0 && (
          <Card aria-label="Why this risk level" className="flex flex-col gap-2.5">
            <h2 className="m-0 text-[16px] font-bold">Why</h2>
            <div className="flex flex-wrap gap-2">
              {data.reasons.map((reason) => (
                <Chip key={reason}>{reason}</Chip>
              ))}
            </div>
          </Card>
        )}

        {forecast.hours.length > 0 && (
          <Card aria-label={WORKER_STATUS.forecast.title} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="m-0 text-[16px] font-bold">{WORKER_STATUS.forecast.title}</h2>
              {forecast.confidence && (
                <span className="text-[13px] text-muted">{forecast.confidence}</span>
              )}
            </div>
            <ForecastStrip hours={forecast.hours} />
          </Card>
        )}

        {data.hazards.length > 0 && (
          <Card aria-label="Other weather risks today" className="flex flex-col gap-3">
            <h2 className="m-0 text-[16px] font-bold">Also today</h2>
            {data.hazards.map((hazard) => {
              const Icon = HAZARD_ICONS[hazard.icon]
              return (
                <div key={hazard.id} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ground text-muted">
                    <Icon size={20} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                      {hazard.title}
                      {hazard.pill && (
                        <StatusPill status={hazard.pill.status}>{hazard.pill.label}</StatusPill>
                      )}
                    </span>
                    <span className="text-[14px] leading-[1.4] text-muted">{hazard.detail}</span>
                  </span>
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </>
  )
}
