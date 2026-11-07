import { useId, useState } from 'react'
import { Card } from '../../components/Card'
import { PrivacyFooter } from '../../components/PrivacyFooter'
import { StatusPill } from '../../components/StatusPill'
import {
  ACTIONS_BY_CREW,
  MEASURE_PERIODS,
  MEASURES,
  MEASURES_TEXT,
  WARNING_LEAD_TIMES,
} from '../../data/mock'
import type { Bar } from '../../data/types'
import { cn } from '../../lib/cn'

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
  return (
    <div
      role="img"
      aria-label={summary}
      className="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-3"
    >
      {bars.map((bar) => (
        <div key={bar.label} className="contents">
          <span className="text-[14px] font-semibold">{bar.label}</span>
          <span className="h-[22px] overflow-hidden rounded-md bg-ground">
            <span
              className={cn('block h-[22px] rounded-md', barClass)}
              style={{ width: `${Math.round((bar.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-right font-mono text-[14px] font-bold">{format(bar.value)}</span>
        </div>
      ))}
    </div>
  )
}

/** Screen 10: Measures. Values from design-reference/html/10-supervisor-measures.html. */
export function MeasuresScreen() {
  const periodId = useId()
  // Visual only for now.
  const [period, setPeriod] = useState(MEASURE_PERIODS[0])
  const leadMax = Math.max(...WARNING_LEAD_TIMES.map((bar) => bar.value))

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{MEASURES_TEXT.title}</h1>
            <StatusPill status="sample-data" />
          </div>
          <p className="m-0 text-[15px] text-muted">{MEASURES_TEXT.subtitle}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={periodId} className="text-[12px] font-bold text-muted">
            {MEASURES_TEXT.periodLabel}
          </label>
          {/* 44px tall (the design has 40px) to meet the touch target rule. */}
          <select
            id={periodId}
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className={cn(
              'h-11 min-w-40 rounded-[10px] border border-field bg-surface px-2.5 text-[14px] text-ink',
              focusRing,
            )}
          >
            {MEASURE_PERIODS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-4">
        {MEASURES.map((measure) => (
          <article
            key={measure.id}
            aria-labelledby={`${measure.id}-title`}
            className="flex flex-col gap-2 rounded-[18px] bg-surface p-5"
          >
            <h2 id={`${measure.id}-title`} className="text-[15px] font-bold text-muted">
              {measure.title}
            </h2>
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
          <p className="m-0 text-[14px] text-muted">{MEASURES_TEXT.leadTimesNote}</p>
          <BarChart
            bars={WARNING_LEAD_TIMES}
            max={leadMax}
            barClass="bg-chart-primary"
            format={String}
            summary={
              'Number of warnings by lead time: ' +
              WARNING_LEAD_TIMES.map((bar) => `${bar.label} ${bar.value}`).join(', ')
            }
          />
        </Card>

        <Card
          variant="page"
          aria-label="Actions followed by crew"
          className="flex min-w-0 flex-[1_1_504px] flex-col gap-3.5"
        >
          <h2 className="text-[18px] font-extrabold">{MEASURES_TEXT.byCrewTitle}</h2>
          <p className="m-0 text-[14px] text-muted">{MEASURES_TEXT.byCrewNote}</p>
          <BarChart
            bars={ACTIONS_BY_CREW}
            max={100}
            barClass="bg-ok"
            format={(value) => `${value}%`}
            summary={
              'Actions followed, by crew: ' +
              ACTIONS_BY_CREW.map((bar) => `${bar.label} ${bar.value}%`).join(', ')
            }
          />
          <p className="m-0 text-[14px] leading-[1.45]">{MEASURES_TEXT.insight}</p>
        </Card>
      </div>

      <PrivacyFooter className="pb-6">{MEASURES_TEXT.privacy}</PrivacyFooter>
    </>
  )
}
