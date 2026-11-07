import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ForecastStrip } from '../../components/ForecastStrip'
import { DustIcon, StormIcon } from '../../components/icons'
import { PrivacyFooter } from '../../components/PrivacyFooter'
import { RiskBadge } from '../../components/RiskBadge'
import { SectionLabel } from '../../components/SectionLabel'
import { StatusPill } from '../../components/StatusPill'
import {
  ACTIONS_TODAY,
  ACTIONS_TODAY_NOTE,
  CLIMATE_HAZARDS,
  CLIMATE_HAZARDS_SOURCE,
  CREWS,
  FILTERS,
  LAST_7_DAYS,
  LAST_7_DAYS_SUMMARY,
  NEEDS_ATTENTION,
  PRECAUTION_ALERTS,
  PRECAUTION_LEVELS,
  SITE,
  SITE_HEAT_BY_HOUR,
  SITE_HEAT_NOTE,
  SITE_HEAT_NOW,
  SUPERVISOR_PRIVACY,
  SYSTEM_HEALTH,
  TODAY_SO_FAR,
  TODAY_TEXT,
  WORKERS_BY_LEVEL,
} from '../../data/mock'
import type { CrewId, NeedsAttentionAlert } from '../../data/types'
import { cn } from '../../lib/cn'
import { riskClasses, riskLabel, riskName } from '../../lib/risk'
import { usePrecautionLevels } from '../occupational-health/precautionLevels'
import { CrewsTable } from './CrewsTable'
import { NeedsAttention } from './NeedsAttention'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'
const HAZARD_ICONS = { dust: DustIcon, storm: StormIcon }
const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}
/*
 * Card flex-basis values are the design's basis plus 44px of padding: the design HTML measures
 * flex-basis on the content box, Tailwind on the border box.
 */

/** Last 7 days: each hour at High or above is 20px of bar, as in 08-supervisor-today.html. */
const BAR_PX_PER_HOUR = 20

function FilterSelect({
  label,
  options,
  value,
  onChange,
  minWidth,
}: {
  label: string
  options: string[]
  value: number
  onChange: (index: number) => void
  minWidth: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-bold text-muted">
        {label}
      </label>
      {/* 44px tall (the design has 40px) to meet the touch target rule. */}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-11 rounded-[10px] border border-field bg-surface px-2.5 text-[14px] text-ink',
          minWidth,
          focusRing,
        )}
      >
        {options.map((option, index) => (
          <option key={option} value={index}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function SiteHeat() {
  return (
    <Card
      variant="page"
      aria-label="Site heat overview"
      className="flex min-w-0 flex-[2_1_604px] flex-col gap-[18px]"
    >
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SectionLabel>Site heat now</SectionLabel>
          <div className="flex items-center gap-3.5">
            <RiskBadge level={SITE_HEAT_NOW.level} size="lg" />
            <span className="flex flex-col">
              <span className="font-mono text-[26px] font-bold">{SITE_HEAT_NOW.wbgt}</span>
              <span className="text-[13px] text-muted">{SITE_HEAT_NOW.wbgtNote}</span>
            </span>
          </div>
        </div>
        <div className="flex max-w-[360px] flex-col gap-1.5 rounded-[14px] bg-danger-bg px-4 py-3.5">
          <p className="m-0 text-[15px] font-extrabold text-danger-text">
            {SITE_HEAT_NOW.peak.title}
          </p>
          <p className="m-0 text-[14px] leading-[1.4]">{SITE_HEAT_NOW.peak.text}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[14px] font-bold">{TODAY_TEXT.hourByHour}</h3>
        <ForecastStrip hours={SITE_HEAT_BY_HOUR} variant="site" label={TODAY_TEXT.hourByHour} />
        <p className="m-0 text-[13px] text-muted">{SITE_HEAT_NOTE}</p>
      </div>
    </Card>
  )
}

function WorkersByLevel() {
  const { levels, noRecentData, note } = WORKERS_BY_LEVEL
  // Lowest level first in the bar, as drawn; zero counts are left out.
  const segments = [...levels].reverse().filter((row) => row.count > 0)
  const summary =
    [...levels]
      .reverse()
      .map((row) => `${row.count} ${riskName(row.level).toLowerCase()}`)
      .join(', ') + `, ${noRecentData} with no recent data`

  return (
    <Card
      variant="page"
      aria-label="Workforce risk distribution"
      className="flex min-w-0 flex-[1_1_364px] flex-col gap-4"
    >
      <SectionLabel>Workers by risk level</SectionLabel>
      <div role="img" aria-label={summary} className="flex h-[18px] overflow-hidden rounded-[9px]">
        {segments.map((row) => (
          <span key={row.level} className={riskClasses(row.level).bg} style={{ flex: row.count }} />
        ))}
        {noRecentData > 0 && <span className="bg-field" style={{ flex: noRecentData }} />}
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {levels.map((row) => (
          <li
            key={row.level}
            className="flex items-center justify-between border-b border-line-soft py-2.5"
          >
            <span className="flex items-center gap-2.5 text-[15px]">
              <span
                aria-hidden="true"
                className={cn('size-3.5 rounded', riskClasses(row.level).bg)}
              />
              {riskLabel(row.level)}
            </span>
            <span className="font-mono text-[18px] font-bold">{row.count}</span>
          </li>
        ))}
        <li className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2.5 text-[15px]">
            <span aria-hidden="true" className="size-3.5 rounded bg-field" />
            No recent data
          </span>
          <span className="font-mono text-[18px] font-bold">{noRecentData}</span>
        </li>
      </ul>
      <p className="m-0 text-[13px] leading-[1.4] text-muted">{note}</p>
    </Card>
  )
}

function ClimateHazards() {
  return (
    <Card
      variant="page"
      aria-label="Other climate hazards"
      className="flex min-w-0 flex-[1_1_464px] flex-col gap-1.5"
    >
      <SectionLabel>Other climate hazards today</SectionLabel>
      <ul className="m-0 list-none p-0">
        {CLIMATE_HAZARDS.map((hazard) => {
          const Icon = HAZARD_ICONS[hazard.icon]
          return (
            <li key={hazard.id} className="flex items-start gap-3.5 border-b border-line-soft py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ground text-muted">
                <Icon size={20} />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold">{hazard.title}</span>
                  <StatusPill
                    status={hazard.severity === 'Moderate' ? 'hazard-moderate' : 'hazard-possible'}
                  />
                </span>
                <span className="text-[14px] leading-[1.4] text-muted">{hazard.detail}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="m-0 pt-1.5 text-[13px] text-muted">{CLIMATE_HAZARDS_SOURCE}</p>
    </Card>
  )
}

function SystemHealth() {
  return (
    <Card
      variant="page"
      aria-label="System health"
      className="flex min-w-0 flex-[1_1_464px] flex-col gap-1.5"
    >
      <SectionLabel>System health</SectionLabel>
      <ul className="m-0 list-none p-0">
        {SYSTEM_HEALTH.map((row) => (
          <li key={row.id} className="flex items-center gap-3 border-b border-line-soft py-[11px]">
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                row.status === 'ok' ? 'bg-ok' : 'bg-warn',
              )}
            />
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-[15px] font-bold">{row.title}</span>
              <span className="text-[13px] text-muted">{row.detail}</span>
            </span>
            <span className="font-mono text-[15px] font-bold whitespace-nowrap">{row.value}</span>
            <StatusPill status={row.status} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ActionsToday() {
  const done = ACTIONS_TODAY.filter((action) => action.status === 'done').length
  return (
    <Card
      variant="page"
      aria-label="Recommended actions"
      className="flex min-w-0 flex-[2_1_424px] flex-col gap-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Actions today</h2>
        <span className="text-[14px] text-muted">
          {done} of {ACTIONS_TODAY.length} done
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {ACTIONS_TODAY.map((action, index) => (
          <li
            key={action.id}
            className={cn(
              'flex items-start gap-3 py-3',
              index < ACTIONS_TODAY.length - 1 && 'border-b border-line-soft',
            )}
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold">{action.title}</span>
              <span className="text-[13px] text-muted">{action.meta}</span>
            </span>
            <StatusPill status={action.status} />
          </li>
        ))}
      </ul>
      <p className="m-0 text-[13px] leading-[1.4] text-muted">{ACTIONS_TODAY_NOTE}</p>
    </Card>
  )
}

function TodaySoFar() {
  return (
    <Card variant="page" aria-label="Today's measures" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Today so far</h2>
        <Link
          to="/supervisor/measures"
          className={cn(
            'inline-flex min-h-11 items-center rounded text-[15px] font-bold text-link underline hover:text-info-text',
            focusRing,
          )}
        >
          {TODAY_TEXT.measuresLink}
        </Link>
      </div>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        {TODAY_SO_FAR.map((figure) => (
          <div key={figure.label} className="flex flex-col-reverse gap-0.5 py-1">
            <dt className="text-[13px] text-muted">{figure.label}</dt>
            <dd className="m-0 font-mono text-[24px] font-bold">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function LastSevenDays() {
  const summary =
    'Hours at High or above: ' +
    LAST_7_DAYS.map((day) => `${DAY_NAMES[day.day] ?? day.day} ${day.hours}`).join(', ')
  return (
    <Card variant="page" aria-label="Last 7 days" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Last 7 days</h2>
        <span className="text-[14px] text-muted">{LAST_7_DAYS_SUMMARY}</span>
      </div>
      <div role="img" aria-label={summary} className="grid h-[180px] grid-cols-7 items-end gap-3.5">
        {LAST_7_DAYS.map((day) => (
          <div key={day.day} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="font-mono text-[13px] font-bold">{day.hours}</span>
            {day.hours > 0 ? (
              <span
                className="w-full max-w-16 rounded-t-lg bg-risk-3"
                style={{ height: day.hours * BAR_PX_PER_HOUR }}
              />
            ) : (
              <span className="h-0.5 w-full max-w-16 bg-field" />
            )}
            <span className="text-[13px] text-muted">{day.day}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Screen 8: supervisor Today. Values from design-reference/html/08-supervisor-today.html. */
export function TodayScreen() {
  const [crewFilter, setCrewFilter] = useState(0)
  const [activityFilter, setActivityFilter] = useState(0)
  const [shiftFilter, setShiftFilter] = useState(0)
  const { recordFor } = usePrecautionLevels()

  // A crew shows when it matches both filters. null means "all".
  const allowed = (crew: CrewId) =>
    [FILTERS.crews[crewFilter].crews, FILTERS.activities[activityFilter].crews].every(
      (list) => list === null || list.includes(crew),
    )
  const crews = CREWS.filter((crew) => allowed(crew.id))
  // Individual precaution alerts follow the level occupational health has saved. Standard has no
  // alert. The supervisor sees the level and the action only, never the health reasons.
  const alerts = NEEDS_ATTENTION.flatMap((alert): NeedsAttentionAlert[] => {
    if (alert.kind !== 'precaution') return [alert]
    const { level } = recordFor(alert.workerId)
    if (level === 'standard') return []
    const copy = PRECAUTION_ALERTS[level]
    return [
      {
        ...alert,
        title: copy.title(alert.workerId),
        do: copy.do,
        levelName: PRECAUTION_LEVELS[level].name,
      },
    ]
  }).filter((alert) => allowed(alert.crew))

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{SITE.name}</h1>
          <p className="m-0 text-[15px] text-muted">
            {SITE.shift} · {SITE.hours} · {SITE.workersOnShift} workers on shift
          </p>
        </div>
        <div role="group" aria-label="Filters" className="flex flex-wrap gap-2.5">
          <FilterSelect
            label="Crew"
            options={FILTERS.crews.map((option) => option.label)}
            value={crewFilter}
            onChange={setCrewFilter}
            minWidth="min-w-[140px]"
          />
          <FilterSelect
            label="Activity"
            options={FILTERS.activities.map((option) => option.label)}
            value={activityFilter}
            onChange={setActivityFilter}
            minWidth="min-w-[150px]"
          />
          {/* Shift is visual only for now. */}
          <FilterSelect
            label="Shift"
            options={FILTERS.shifts}
            value={shiftFilter}
            onChange={setShiftFilter}
            minWidth="min-w-[120px]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <SiteHeat />
        <WorkersByLevel />
      </div>

      <div className="flex flex-wrap gap-5">
        <ClimateHazards />
        <SystemHealth />
      </div>

      <div className="flex flex-wrap gap-5">
        <NeedsAttention alerts={alerts} />
        <ActionsToday />
      </div>

      <TodaySoFar />
      <CrewsTable crews={crews} />
      <LastSevenDays />

      <PrivacyFooter className="pb-6">{SUPERVISOR_PRIVACY}</PrivacyFooter>
    </>
  )
}
