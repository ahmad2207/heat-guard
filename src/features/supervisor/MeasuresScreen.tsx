import { useCallback, useId, useState } from 'react'
import { isMockMode } from '../../api/config'
import {
  MEASURE_PERIOD_OPTIONS,
  type MeasurePeriod,
  type MeasuresView,
} from '../../api/converters/measures'
import { loadMeasures } from '../../api/supervisor'
import { useApiData, type LoadContext } from '../../api/useApiData'
import { Card } from '../../components/Card'
import { EmptyState, ErrorState, LoadingState } from '../../components/LoadStates'
import { PrivacyFooter } from '../../components/PrivacyFooter'
import { StatusPill } from '../../components/StatusPill'
import {
  ACTIONS_BY_CREW,
  MEASURE_PERIODS,
  MEASURES,
  MEASURES_LIVE_TEXT,
  MEASURES_TEXT,
  SUPERVISOR_LIVE_TEXT,
  WARNING_LEAD_TIMES,
} from '../../data/mock'
import type { Bar } from '../../data/types'
import { cn } from '../../lib/cn'
import { useCurrentSession } from '../session/session'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/**
 * Horizontal bar chart with plain divs (10-supervisor-measures.html). Bars are drawn relative to
 * `max`. The chart is one image for screen readers, described by `summary`.
 */
function BarChart({
  bars,
  max,
  barClass,
  format,
  summary,
}: {
  bars: Bar[]
  max: number
  barClass: string
  format: (value: number) => string
  summary: string
}) {
  const top = Math.max(max, 1)
  return (
    <div
      role="img"
      aria-label={summary}
      className="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-3"
    >
      {bars.map((bar, index) => (
        <div key={`${bar.label}-${index}`} className="contents">
          <span className="text-[14px] font-semibold">{bar.label}</span>
          <span className="h-[22px] overflow-hidden rounded-md bg-ground">
            <span
              className={cn('block h-[22px] rounded-md', barClass)}
              style={{ width: `${Math.round((bar.value / top) * 100)}%` }}
            />
          </span>
          <span className="text-right font-mono text-[14px] font-bold">{format(bar.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface MeasuresBoardProps {
  /** Mock mode only: the "Sample data" badge. */
  sample: boolean
  subtitle: string
  periodOptions: Array<{ value: string; label: string }>
  period: string
  onPeriod: (value: string) => void
  data: MeasuresView
  /** Shown under "Actions followed, by crew" (sample data only). */
  insight?: string
  updating?: boolean
  error?: { message: string; retry: () => void } | null
}

/** Screen 10: Measures. Values from design-reference/html/10-supervisor-measures.html. */
function MeasuresBoard({
  sample,
  subtitle,
  periodOptions,
  period,
  onPeriod,
  data,
  insight,
  updating = false,
  error = null,
}: MeasuresBoardProps) {
  const periodId = useId()
  const periodLabel = periodOptions.find((option) => option.value === period)?.label ?? ''
  const leadMax = Math.max(0, ...data.leadTimes.map((bar) => bar.value))

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{MEASURES_TEXT.title}</h1>
            {sample && <StatusPill status="sample-data" />}
          </div>
          <p className="m-0 text-[15px] text-muted">
            {subtitle}
            {updating && (
              <span role="status" className="ml-2 font-semibold">
                {SUPERVISOR_LIVE_TEXT.updating}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={periodId} className="text-[12px] font-bold text-muted">
            {MEASURES_TEXT.periodLabel}
          </label>
          {/* 44px tall (the design has 40px) to meet the touch target rule. */}
          <select
            id={periodId}
            value={period}
            onChange={(event) => onPeriod(event.target.value)}
            className={cn(
              'h-11 min-w-40 rounded-[10px] border border-field bg-surface px-2.5 text-[14px] text-ink',
              focusRing,
            )}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorState variant="page" message={error.message} onRetry={error.retry} />}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-4">
        {data.cards.map((measure) => (
          <article
            key={measure.id}
            aria-labelledby={`${measure.id}-title`}
            className="flex flex-col gap-2 rounded-[18px] bg-surface p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id={`${measure.id}-title`} className="text-[15px] font-bold text-muted">
                {measure.title}
              </h2>
              {measure.provisional && (
                <StatusPill status="pending">{MEASURES_LIVE_TEXT.provisional}</StatusPill>
              )}
            </div>
            <p className="m-0 font-mono text-[34px] leading-[1.1] font-bold">{measure.value}</p>
            <p className="m-0 text-[14px] font-bold">{measure.summary}</p>
            <p className="m-0 text-[13px] leading-[1.45] text-muted">{measure.detail}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-5">
        <Card
          variant="page"
          aria-label="Warning lead time"
          className="flex min-w-0 flex-[1_1_504px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{MEASURES_TEXT.leadTimesTitle}</h2>
          <p className="m-0 text-[14px] text-muted">
            {MEASURES_LIVE_TEXT.leadTimesNote(periodLabel.toLowerCase())}
          </p>
          {leadMax === 0 ? (
            <EmptyState variant="page" message={MEASURES_LIVE_TEXT.noWarnings} />
          ) : (
            <BarChart
              bars={data.leadTimes}
              max={leadMax}
              barClass="bg-chart-primary"
              format={String}
              summary={
                'Number of warnings by lead time: ' +
                data.leadTimes.map((bar) => `${bar.label} ${bar.value}`).join(', ')
              }
            />
          )}
        </Card>

        <Card
          variant="page"
          aria-label="Actions followed by crew"
          className="flex min-w-0 flex-[1_1_504px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{MEASURES_TEXT.byCrewTitle}</h2>
          <p className="m-0 text-[14px] text-muted">{MEASURES_TEXT.byCrewNote}</p>
          {data.byCrew.length === 0 ? (
            <EmptyState variant="page" message={MEASURES_LIVE_TEXT.noCrewActions} />
          ) : (
            <BarChart
              bars={data.byCrew}
              max={100}
              barClass="bg-ok"
              format={(value) => `${value}%`}
              summary={
                'Actions followed, by crew: ' +
                data.byCrew.map((bar) => `${bar.label} ${bar.value}%`).join(', ')
              }
            />
          )}
          {insight && <p className="m-0 text-[14px] leading-[1.45]">{insight}</p>}
        </Card>
      </div>

      <PrivacyFooter className="pb-6">{MEASURES_TEXT.privacy}</PrivacyFooter>
    </>
  )
}

export function MeasuresScreen() {
  return isMockMode ? <MockMeasures /> : <ApiMeasures />
}

/** Sample data: the period select is visual only. */
function MockMeasures() {
  const [period, setPeriod] = useState(MEASURE_PERIODS[0])
  return (
    <MeasuresBoard
      sample
      subtitle={MEASURES_TEXT.subtitle}
      periodOptions={MEASURE_PERIODS.map((label) => ({ value: label, label }))}
      period={period}
      onPeriod={setPeriod}
      data={{ cards: MEASURES, leadTimes: WARNING_LEAD_TIMES, byCrew: ACTIONS_BY_CREW }}
      insight={MEASURES_TEXT.insight}
    />
  )
}

function ApiMeasures() {
  const site = useCurrentSession()?.site
  if (!site) {
    return (
      <Card variant="page" role="alert">
        <p className="m-0 text-[15px]">{SUPERVISOR_LIVE_TEXT.noSite}</p>
      </Card>
    )
  }
  return <ApiMeasuresForSite siteId={site.id} siteName={site.name} />
}

/** Api mode: GET /sites/{id}/measures for the chosen period. A new period keeps the page on screen. */
function ApiMeasuresForSite({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [period, setPeriod] = useState<MeasurePeriod>('30d')
  const load = useCallback(
    (context: LoadContext) => loadMeasures(siteId, period, context),
    [siteId, period],
  )
  const measures = useApiData(load)
  const [last, setLast] = useState<MeasuresView | null>(null)
  if (measures.status === 'ready' && measures.data !== last) setLast(measures.data)
  const data = measures.status === 'ready' ? measures.data : last

  if (!data) {
    return measures.status === 'error' ? (
      <ErrorState variant="page" message={measures.error.message} onRetry={measures.retry} />
    ) : (
      <LoadingState variant="page" slow={measures.status === 'loading' && measures.slow} />
    )
  }
  return (
    <MeasuresBoard
      sample={false}
      subtitle={`${siteName} · ${MEASURES_LIVE_TEXT.subtitleEnd}`}
      periodOptions={MEASURE_PERIOD_OPTIONS}
      period={period}
      onPeriod={(value) => setPeriod(value as MeasurePeriod)}
      data={data}
      updating={measures.status === 'loading'}
      error={
        measures.status === 'error'
          ? { message: measures.error.message, retry: measures.retry }
          : null
      }
    />
  )
}
