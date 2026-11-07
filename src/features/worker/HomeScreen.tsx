import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { ForecastStrip } from '../../components/ForecastStrip'
import { CheckIcon, ClockIcon, DropIcon, DustIcon, StormIcon } from '../../components/icons'
import { RiskCard } from '../../components/RiskCard'
import { EXTRA_PRECAUTIONS_REASON, FIELD_MODE, WORKER, WORKER_STATUS } from '../../data/mock'
import { usePrecautionLevels } from '../occupational-health/precautionLevels'
import { useDevSettings } from '../../dev/devSettings'
import { RISK_WORKER_MESSAGES, riskName } from '../../lib/risk'
import { useSpeech } from '../../lib/useSpeech'
import { FieldModeView } from './FieldModeView'
import { useFieldMode } from './useFieldMode'
import { WorkerHomeHeader } from './WorkerHomeHeader'

const HAZARD_ICONS = { dust: DustIcon, storm: StormIcon }

const BACK_ONLINE_MS = 4000

/**
 * Screen 3: worker Home. Switches to field mode (screen 7) when offline or forced by the dev panel.
 */
export function HomeScreen() {
  const fieldMode = useFieldMode()

  // When field mode ends, briefly say that the data is up to date again.
  const [wasFieldMode, setWasFieldMode] = useState(fieldMode.active)
  const [showBackOnline, setShowBackOnline] = useState(false)
  if (fieldMode.active !== wasFieldMode) {
    setWasFieldMode(fieldMode.active)
    setShowBackOnline(!fieldMode.active)
  }
  useEffect(() => {
    if (!showBackOnline) return
    const timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS)
    return () => clearTimeout(timer)
  }, [showBackOnline])

  if (fieldMode.active) {
    return <FieldModeView reconnect={fieldMode.reconnect} status={fieldMode.status} />
  }
  return <StatusView showBackOnline={showBackOnline} />
}

/** Screen 3: worker Home. Values from design-reference/html/03-home.html and 03b-home-critical.html. */
function StatusView({ showBackOnline }: { showBackOnline: boolean }) {
  const { riskLevel } = useDevSettings()
  // "Extra precautions" only shows while occupational health has W-0412 on Enhanced or High-priority.
  const { level } = usePrecautionLevels().recordFor(WORKER.id)
  const reasons = WORKER_STATUS.reasons.filter(
    (reason) => reason !== EXTRA_PRECAUTIONS_REASON || level !== 'standard',
  )
  const { speak } = useSpeech()
  const [cups, setCups] = useState(WORKER_STATUS.water.cupsToday)
  const { nextBreak, water, forecast } = WORKER_STATUS

  const listen = speak
    ? () =>
        speak(
          `Your heat risk now: ${riskName(riskLevel)}, level ${riskLevel} of 4. ` +
            `${RISK_WORKER_MESSAGES[riskLevel]} ${nextBreak.title}. ${nextBreak.detail}.`,
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
          <span className="mr-0.5 text-muted">{WORKER_STATUS.updatedAt} from</span>
          {WORKER_STATUS.dataSources.map((source) => (
            <Chip key={source.label} variant="source">
              {source.label}
            </Chip>
          ))}
        </div>

        <RiskCard level={riskLevel} onListen={listen} />

        <Card aria-label="Breaks and water" className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-risk-1">
              <ClockIcon size={22} stopwatch />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[17px] font-bold">{nextBreak.title}</span>
              <span className="text-[14px] text-muted">{nextBreak.detail}</span>
            </span>
          </div>
          <div className="flex items-center gap-3.5 border-t border-line-soft pt-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-risk-1">
              <DropIcon size={22} />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span aria-live="polite" className="text-[17px] font-bold">
                Water: {cups} {cups === 1 ? 'cup' : 'cups'} today
              </span>
              <span className="text-[14px] text-muted">{water.advice}</span>
            </span>
            <button
              type="button"
              aria-label="Add a cup of water"
              onClick={() => setCups((count) => count + 1)}
              className="h-11 shrink-0 rounded-xl border border-field bg-surface px-3.5 text-[15px] font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              + Cup
            </button>
          </div>
        </Card>

        <Card aria-label="Why this risk level" className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[16px] font-bold">Why</h2>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason) => (
              <Chip key={reason}>{reason}</Chip>
            ))}
          </div>
        </Card>

        <Card aria-label={forecast.title} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[16px] font-bold">{forecast.title}</h2>
            <span className="text-[13px] text-muted">{forecast.confidence}</span>
          </div>
          <ForecastStrip hours={forecast.hours} />
        </Card>

        <Card aria-label="Other weather risks today" className="flex flex-col gap-3">
          <h2 className="m-0 text-[16px] font-bold">Also today</h2>
          {WORKER_STATUS.hazards.map((hazard) => {
            const Icon = HAZARD_ICONS[hazard.icon]
            return (
              <div key={hazard.id} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ground text-muted">
                  <Icon size={20} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{hazard.title}</span>
                  <span className="text-[14px] leading-[1.4] text-muted">{hazard.detail}</span>
                </span>
              </div>
            )
          })}
        </Card>
      </div>
    </>
  )
}
