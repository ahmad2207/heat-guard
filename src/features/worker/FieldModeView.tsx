import type { ComponentType } from 'react'
import { Card } from '../../components/Card'
import { ForecastStrip } from '../../components/ForecastStrip'
import { BandOffIcon, BatteryLowIcon, CheckIcon, NoSignalIcon } from '../../components/icons'
import { FIELD_MODE } from '../../data/mock'
import { cn } from '../../lib/cn'
import { riskClasses, riskName } from '../../lib/risk'
import { useBattery, type BatteryState } from '../../lib/useBattery'
import type { ReconnectStatus } from './useFieldMode'
import { WorkerHomeHeader } from './WorkerHomeHeader'

function batteryRow(battery: BatteryState | null): { title: string; detail: string } {
  if (!battery) return FIELD_MODE.battery
  const saver = !battery.charging && battery.percent <= FIELD_MODE.batterySaverAt
  if (saver) {
    return { title: `Battery ${battery.percent}% · saver on`, detail: FIELD_MODE.battery.detail }
  }
  return {
    title: `Battery ${battery.percent}%${battery.charging ? ' · charging' : ''}`,
    detail: FIELD_MODE.batteryNormalDetail,
  }
}

function StatusRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  title: string
  detail: string
}) {
  return (
    <li className="flex items-center gap-3 border-b border-ink-raised py-2.5">
      <Icon size={22} strokeWidth={2.2} className="shrink-0 text-ink-accent" />
      <span className="flex flex-1 flex-col gap-px">
        <span className="text-[15px] font-bold">{title}</span>
        <span className="text-[13px] text-line">{detail}</span>
      </span>
    </li>
  )
}

interface FieldModeViewProps {
  reconnect: () => void
  status: ReconnectStatus
}

/** Screen 7: field mode, shown inside /worker. Values from design-reference/html/07-field-mode.html. */
export function FieldModeView({ reconnect, status }: FieldModeViewProps) {
  const battery = batteryRow(useBattery())
  const level = FIELD_MODE.assumedLevel
  const { bg, text, border } = riskClasses(level)

  return (
    <>
      <WorkerHomeHeader />

      <div className="flex flex-col gap-3 px-4 pb-4">
        <section
          aria-label="Field status"
          className="flex flex-col rounded-2xl bg-ink px-3.5 pt-1.5 pb-2.5 text-surface"
        >
          <ul className="m-0 list-none p-0">
            <StatusRow icon={NoSignalIcon} {...FIELD_MODE.connection} />
            <StatusRow icon={BandOffIcon} {...FIELD_MODE.band} />
            <StatusRow icon={BatteryLowIcon} {...battery} />
          </ul>
          <button
            type="button"
            onClick={reconnect}
            disabled={status === 'checking'}
            className="mt-2 h-11 rounded-[10px] border border-subtle bg-transparent text-[15px] font-bold text-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:opacity-70"
          >
            {FIELD_MODE.reconnect[status]}
          </button>
          {/* Announces the result of "Try to reconnect" to screen readers. */}
          <p role="status" className="sr-only">
            {status === 'failed' ? FIELD_MODE.reconnect.failed : ''}
          </p>
        </section>

        <section
          aria-label="Your heat risk"
          className={cn(
            'flex flex-col gap-3 rounded-[20px] border-[3px] bg-surface p-[18px]',
            border,
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[12px] font-extrabold tracking-[0.06em] uppercase',
                bg,
                text,
              )}
            >
              Safety mode
            </span>
          </div>
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[40px] leading-none font-extrabold tracking-[-0.02em]">
              Assume {riskName(level)}
            </span>
            {/* Not in the design: added so the level shows its number as well as name and colour. */}
            <span className="text-[17px] font-bold">Level {level} of 4</span>
          </p>
          <p className="m-0 text-[16px] leading-[1.45]">{FIELD_MODE.safetyText}</p>
          <p className="m-0 text-[14px] text-muted">{FIELD_MODE.lastKnown}</p>
        </section>

        <Card aria-label="Standard heat plan" className="flex flex-col gap-3">
          <h2 className="m-0 text-[16px] font-bold">Follow the standard heat plan</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {FIELD_MODE.standardPlan.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckIcon size={22} strokeWidth={2.4} className="mt-px shrink-0 text-ok" />
                <span className="text-[16px] leading-[1.4]">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card aria-label={FIELD_MODE.savedForecast.title} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[16px] font-bold">{FIELD_MODE.savedForecast.title}</h2>
            <span className="text-[13px] text-muted">{FIELD_MODE.savedForecast.note}</span>
          </div>
          <ForecastStrip hours={FIELD_MODE.savedForecast.hours} saved />
        </Card>
      </div>
    </>
  )
}
