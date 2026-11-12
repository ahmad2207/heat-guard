import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isMockMode } from '../../api/config'
import { loadCrewOptions, NO_FILTERS, type TodayFilters } from '../../api/supervisor'
import { useApiData, type LoadContext } from '../../api/useApiData'
import { Card } from '../../components/Card'
import { ForecastStrip, type ForecastHour } from '../../components/ForecastStrip'
import { DustIcon, StormIcon } from '../../components/icons'
import { ErrorState, LoadingState } from '../../components/LoadStates'
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
  CREWS_PEAK_LABEL,
  FILTERS,
  LAST_7_DAYS,
  LAST_7_DAYS_SUMMARY,
  NEEDS_ATTENTION,
  PRECAUTION_ALERTS,
  precautionFor,
  SITE,
  SITE_HEAT_BY_HOUR,
  SITE_HEAT_NOTE,
  SITE_HEAT_NOW,
  SUPERVISOR_LIVE_TEXT,
  SUPERVISOR_PRIVACY,
  SYSTEM_HEALTH,
  TODAY_SO_FAR,
  TODAY_TEXT,
  WORKERS_BY_LEVEL,
} from '../../data/mock'
import type {
  ActionToday,
  ClimateHazard,
  CrewId,
  DayBar,
  Figure,
  NeedsAttentionAlert,
  SystemHealthRow,
} from '../../data/types'
import { useSetSupervisorStatus } from '../../layouts/supervisorStatus'
import { cn } from '../../lib/cn'
import { riskClasses, riskLabel, riskName, type RiskLevel } from '../../lib/risk'
import { useCurrentSession } from '../session/session'
import { CrewsTable } from './CrewsTable'
import { NeedsAttention } from './NeedsAttention'
import { NeedsAttentionLive } from './NeedsAttentionLive'
import { useLiveToday } from './useLiveToday'

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

const HAZARD_PILL: Record<ClimateHazard['severity'], 'hazard-moderate' | 'hazard-possible'> = {
  Moderate: 'hazard-moderate',
  High: 'hazard-possible',
  Possible: 'hazard-possible',
}

interface FilterOption {
  value: string
  label: string
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
  minWidth,
}: {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
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
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-11 rounded-[10px] border border-field bg-surface px-2.5 text-[14px] text-ink',
          minWidth,
          focusRing,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface SiteHeatData {
  /** null: no current reading. Never guessed. */
  level: RiskLevel | null
  wbgt: string
  wbgtNote: string
  /** Hidden when there is no peak. */
  peak: { title: string; text: string } | null
  hours: ForecastHour[]
  note: string
}

function SiteHeat({ data }: { data: SiteHeatData }) {
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
            {data.level ? (
              <RiskBadge level={data.level} size="lg" />
            ) : (
              <span className="text-[16px] font-bold text-muted">{TODAY_TEXT.noReading}</span>
            )}
            <span className="flex flex-col">
              <span className="font-mono text-[26px] font-bold">{data.wbgt}</span>
              <span className="text-[13px] text-muted">{data.wbgtNote}</span>
            </span>
          </div>
        </div>
        {data.peak && (
          <div className="flex max-w-[360px] flex-col gap-1.5 rounded-[14px] bg-danger-bg px-4 py-3.5">
            <p className="m-0 text-[15px] font-extrabold text-danger-text">{data.peak.title}</p>
            <p className="m-0 text-[14px] leading-[1.4]">{data.peak.text}</p>
          </div>
        )}
      </div>
      {data.hours.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[14px] font-bold">{TODAY_TEXT.hourByHour}</h3>
          <ForecastStrip hours={data.hours} variant="site" label={TODAY_TEXT.hourByHour} />
          <p className="m-0 text-[13px] text-muted">{data.note}</p>
        </div>
      )}
    </Card>
  )
}

function WorkersByLevel({
  levels,
  noRecentData,
}: {
  levels: Array<{ level: RiskLevel; count: number }>
  noRecentData: number
}) {
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
      <p className="m-0 text-[13px] leading-[1.4] text-muted">{WORKERS_BY_LEVEL.note}</p>
    </Card>
  )
}

function ClimateHazards({ hazards, source }: { hazards: ClimateHazard[]; source: string }) {
  return (
    <Card
      variant="page"
      aria-label="Other climate hazards"
      className="flex min-w-0 flex-[1_1_464px] flex-col gap-1.5"
    >
      <SectionLabel>Other climate hazards today</SectionLabel>
      {hazards.length === 0 ? (
        <p className="m-0 py-3 text-[15px] text-muted">{SUPERVISOR_LIVE_TEXT.noHazards}</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {hazards.map((hazard) => {
            const Icon = HAZARD_ICONS[hazard.icon]
            return (
              <li
                key={hazard.id}
                className="flex items-start gap-3.5 border-b border-line-soft py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ground text-muted">
                  <Icon size={20} />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold">{hazard.title}</span>
                    <StatusPill status={HAZARD_PILL[hazard.severity]}>{hazard.severity}</StatusPill>
                  </span>
                  <span className="text-[14px] leading-[1.4] text-muted">{hazard.detail}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="m-0 pt-1.5 text-[13px] text-muted">{source}</p>
    </Card>
  )
}

function SystemHealth({ rows }: { rows: SystemHealthRow[] }) {
  return (
    <Card
      variant="page"
      aria-label="System health"
      className="flex min-w-0 flex-[1_1_464px] flex-col gap-1.5"
    >
      <SectionLabel>System health</SectionLabel>
      <ul className="m-0 list-none p-0">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 border-b border-line-soft py-[11px]">
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                row.status === 'ok' ? 'bg-ok' : row.status === 'check' ? 'bg-warn' : 'bg-field',
              )}
            />
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-[15px] font-bold">{row.title}</span>
              <span className="text-[13px] text-muted">{row.detail}</span>
            </span>
            {row.value && (
              <span className="font-mono text-[15px] font-bold whitespace-nowrap">{row.value}</span>
            )}
            {row.status && <StatusPill status={row.status} />}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ActionsToday({
  actions,
  done,
  total,
}: {
  actions: ActionToday[]
  done: number
  total: number
}) {
  return (
    <Card
      variant="page"
      aria-label="Recommended actions"
      className="flex min-w-0 flex-[2_1_424px] flex-col gap-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Actions today</h2>
        <span className="text-[14px] text-muted">
          {done} of {total} done
        </span>
      </div>
      {actions.length === 0 && (
        <p className="m-0 text-[15px] text-muted">{SUPERVISOR_LIVE_TEXT.noActions}</p>
      )}
      <ul className="m-0 flex list-none flex-col p-0">
        {actions.map((action, index) => (
          <li
            key={action.id}
            className={cn(
              'flex items-start gap-3 py-3',
              index < actions.length - 1 && 'border-b border-line-soft',
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

function TodaySoFar({ figures }: { figures: Figure[] }) {
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
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col-reverse gap-0.5 py-1">
            <dt className="text-[13px] text-muted">{figure.label}</dt>
            <dd className="m-0 font-mono text-[24px] font-bold">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function LastSevenDays({ days, summary: heading }: { days: DayBar[]; summary: string }) {
  const summary =
    'Hours at High or above: ' +
    days.map((day) => `${DAY_NAMES[day.day] ?? day.day} ${day.hours}`).join(', ')
  return (
    <Card variant="page" aria-label="Last 7 days" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">Last 7 days</h2>
        <span className="text-[14px] text-muted">{heading}</span>
      </div>
      {days.length === 0 ? (
        <p className="m-0 text-[15px] text-muted">{SUPERVISOR_LIVE_TEXT.noHistory}</p>
      ) : (
        <div
          role="img"
          aria-label={summary}
          className="grid h-[180px] items-end gap-3.5"
          style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}
        >
          {days.map((day, index) => (
            <div
              key={`${day.day}-${index}`}
              className="flex h-full flex-col items-center justify-end gap-1.5"
            >
              <span className="font-mono text-[13px] font-bold">{day.hours}</span>
              {day.hours > 0 ? (
                <span
                  className="w-full max-w-16 rounded-t-lg bg-risk-3"
                  // Capped so a long day stays inside the 180px chart.
                  style={{ height: Math.min(day.hours * BAR_PX_PER_HOUR, 130) }}
                />
              ) : (
                <span className="h-0.5 w-full max-w-16 bg-field" />
              )}
              <span className="text-[13px] text-muted">{day.day}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/** The page frame: title, subtitle and filters, then the sections. */
function TodayLayout({
  title,
  subtitle,
  filters,
  children,
}: {
  title: string
  subtitle: ReactNode
  filters: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{title}</h1>
          <p className="m-0 text-[15px] text-muted">{subtitle}</p>
        </div>
        <div role="group" aria-label="Filters" className="flex flex-wrap items-end gap-2.5">
          {filters}
        </div>
      </div>
      {children}
      <PrivacyFooter className="pb-6">{SUPERVISOR_PRIVACY}</PrivacyFooter>
    </>
  )
}

/** Screen 8: supervisor Today. Values from design-reference/html/08-supervisor-today.html. */
export function TodayScreen() {
  return isMockMode ? <MockToday /> : <ApiToday />
}

/** Sample data: filters work on the sample crews; shift is visual only. */
function MockToday() {
  const [crewFilter, setCrewFilter] = useState('0')
  const [activityFilter, setActivityFilter] = useState('0')
  const [shiftFilter, setShiftFilter] = useState('0')

  // A crew shows when it matches both filters. null means "all".
  const allowed = (crew: CrewId) =>
    [
      FILTERS.crews[Number(crewFilter)].crews,
      FILTERS.activities[Number(activityFilter)].crews,
    ].every((list) => list === null || list.includes(crew))
  const crews = CREWS.filter((crew) => allowed(crew.id))
  // Individual precaution alerts follow the worker's precaution level. Standard has no alert.
  // Decision D1: the supervisor sees the action only, never the level name or health reasons.
  const alerts = NEEDS_ATTENTION.flatMap((alert): NeedsAttentionAlert[] => {
    if (alert.kind !== 'precaution') return [alert]
    const { level } = precautionFor(alert.workerId)
    if (level === 'standard') return []
    const copy = PRECAUTION_ALERTS[level]
    return [{ ...alert, title: copy.title(alert.workerId), do: copy.do }]
  }).filter((alert) => allowed(alert.crew))
  const indexed = (labels: string[]) => labels.map((label, i) => ({ value: String(i), label }))

  return (
    <TodayLayout
      title={SITE.name}
      subtitle={`${SITE.shift} · ${SITE.hours} · ${SITE.workersOnShift} workers on shift`}
      filters={
        <>
          <FilterSelect
            label="Crew"
            options={indexed(FILTERS.crews.map((option) => option.label))}
            value={crewFilter}
            onChange={setCrewFilter}
            minWidth="min-w-[140px]"
          />
          <FilterSelect
            label="Activity"
            options={indexed(FILTERS.activities.map((option) => option.label))}
            value={activityFilter}
            onChange={setActivityFilter}
            minWidth="min-w-[150px]"
          />
          {/* Shift is visual only with sample data. */}
          <FilterSelect
            label="Shift"
            options={indexed(FILTERS.shifts)}
            value={shiftFilter}
            onChange={setShiftFilter}
            minWidth="min-w-[120px]"
          />
        </>
      }
    >
      <div className="flex flex-wrap gap-5">
        <SiteHeat
          data={{
            level: SITE_HEAT_NOW.level,
            wbgt: SITE_HEAT_NOW.wbgt,
            wbgtNote: SITE_HEAT_NOW.wbgtNote,
            peak: SITE_HEAT_NOW.peak,
            hours: SITE_HEAT_BY_HOUR,
            note: SITE_HEAT_NOTE,
          }}
        />
        <WorkersByLevel
          levels={WORKERS_BY_LEVEL.levels}
          noRecentData={WORKERS_BY_LEVEL.noRecentData}
        />
      </div>
      <div className="flex flex-wrap gap-5">
        <ClimateHazards hazards={CLIMATE_HAZARDS} source={CLIMATE_HAZARDS_SOURCE} />
        <SystemHealth rows={SYSTEM_HEALTH} />
      </div>
      <div className="flex flex-wrap gap-5">
        <NeedsAttention alerts={alerts} />
        <ActionsToday
          actions={ACTIONS_TODAY}
          done={ACTIONS_TODAY.filter((action) => action.status === 'done').length}
          total={ACTIONS_TODAY.length}
        />
      </div>
      <TodaySoFar figures={TODAY_SO_FAR} />
      <CrewsTable crews={crews} peakLabel={CREWS_PEAK_LABEL} />
      <LastSevenDays days={LAST_7_DAYS} summary={LAST_7_DAYS_SUMMARY} />
    </TodayLayout>
  )
}

/** Api mode: the supervisor's site from GET /sites (kept in the session). */
function ApiToday() {
  const site = useCurrentSession()?.site
  if (!site) {
    return (
      <Card variant="page" role="alert">
        <p className="m-0 text-[15px]">{SUPERVISOR_LIVE_TEXT.noSite}</p>
      </Card>
    )
  }
  return <ApiTodayForSite siteId={site.id} />
}

/** Api mode: the whole page from GET /sites/{id}/today, refreshed every 5 minutes and on focus. */
function ApiTodayForSite({ siteId }: { siteId: string }) {
  const [filters, setFilters] = useState<TodayFilters>(NO_FILTERS)
  const today = useLiveToday(siteId, filters)
  const loadOptions = useCallback(
    (context: LoadContext) => loadCrewOptions(siteId, context),
    [siteId],
  )
  const options = useApiData(loadOptions)
  const setStatus = useSetSupervisorStatus()
  const status = today.data?.status ?? null
  useEffect(() => setStatus(status), [setStatus, status])

  const { data } = today
  // Activity choices come from an unfiltered load, so they all stay after one is picked.
  const [activities, setActivities] = useState<Array<{ code: string; name: string }>>([])
  const unfiltered =
    today.dataFilters &&
    !today.dataFilters.crewId &&
    !today.dataFilters.activity &&
    !today.dataFilters.shift
  if (data && unfiltered && JSON.stringify(data.activities) !== JSON.stringify(activities)) {
    setActivities(data.activities)
  }
  // If the crew list cannot be loaded, the crews of an unfiltered page fill the dropdown instead.
  const [pageCrews, setPageCrews] = useState<Array<{ id: string; name: string }>>([])
  const crewsHere =
    data && unfiltered ? data.crews.map((crew) => ({ id: crew.id, name: crew.name })) : null
  if (crewsHere && JSON.stringify(crewsHere) !== JSON.stringify(pageCrews)) setPageCrews(crewsHere)
  if (!data) {
    return today.error ? (
      <ErrorState
        variant="page"
        message={today.error.message}
        onRetry={() => void today.reload()}
      />
    ) : (
      <LoadingState variant="page" slow={today.slow} />
    )
  }

  const set = (key: keyof TodayFilters) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }))
  const crewOptions: FilterOption[] = [
    { value: '', label: FILTERS.crews[0].label },
    ...(options.status === 'ready' ? options.data : pageCrews).map((crew) => ({
      value: crew.id,
      label: crew.name,
    })),
  ]
  const activityOptions: FilterOption[] = [
    { value: '', label: FILTERS.activities[0].label },
    ...activities.map((activity) => ({
      value: activity.code,
      label: activity.name,
    })),
  ]
  const shiftOptions: FilterOption[] = [
    { value: '', label: SUPERVISOR_LIVE_TEXT.allShifts },
    ...data.shifts.map((shift) => ({ value: shift, label: shift })),
  ]

  return (
    <TodayLayout
      title={data.siteName}
      subtitle={
        <>
          {data.subtitle}
          {today.updating && (
            <span role="status" className="ml-2 font-semibold">
              {SUPERVISOR_LIVE_TEXT.updating}
            </span>
          )}
        </>
      }
      filters={
        <>
          <FilterSelect
            label="Crew"
            options={crewOptions}
            value={filters.crewId}
            onChange={set('crewId')}
            minWidth="min-w-[140px]"
          />
          <FilterSelect
            label="Activity"
            options={activityOptions}
            value={filters.activity}
            onChange={set('activity')}
            minWidth="min-w-[150px]"
          />
          <FilterSelect
            label="Shift"
            options={shiftOptions}
            value={filters.shift}
            onChange={set('shift')}
            minWidth="min-w-[120px]"
          />
        </>
      }
    >
      {today.error && (
        <ErrorState
          variant="page"
          message={today.error.message}
          onRetry={() => void today.reload()}
        />
      )}
      <div className="flex flex-wrap gap-5">
        <SiteHeat data={data.siteHeat} />
        <WorkersByLevel
          levels={data.workersByLevel.levels}
          noRecentData={data.workersByLevel.noRecentData}
        />
      </div>
      <div className="flex flex-wrap gap-5">
        <ClimateHazards hazards={data.hazards} source={data.hazardsSource} />
        <SystemHealth rows={data.systemHealth} />
      </div>
      <div className="flex flex-wrap gap-5">
        <NeedsAttentionLive
          open={data.needsAttention.open}
          items={data.needsAttention.items}
          onChanged={today.reload}
        />
        <ActionsToday
          actions={data.actionsToday.actions}
          done={data.actionsToday.done}
          total={data.actionsToday.total}
        />
      </div>
      <TodaySoFar figures={data.todaySoFar} />
      <CrewsTable crews={data.crews} peakLabel={data.peakLabel} />
      <LastSevenDays days={data.last7Days} summary={data.last7Summary} />
    </TodayLayout>
  )
}
