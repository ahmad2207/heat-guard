import { cn } from '../lib/cn'
import { riskClasses, riskName, type RiskLevel } from '../lib/risk'

export interface ForecastHour {
  /** "11:00" for the worker strip, "11" for the site strip. */
  time: string
  level: RiskLevel
  /** May reach this level but not certain. Shown as "Possible" (worker) or "4?" (site). */
  possible?: boolean
  /** The current hour, outlined on the site strip. */
  now?: boolean
}

interface ForecastStripProps {
  hours: ForecastHour[]
  /**
   * worker: "Next 6 hours" on worker Home (03-home.html).
   * site: "Today, hour by hour" on supervisor Today (08-supervisor-today.html), scrolls sideways on phones.
   */
  variant?: 'worker' | 'site'
  /** Field mode: a saved forecast, drawn with dashed outlines instead of fills (07-field-mode.html). */
  saved?: boolean
  /** Name of the scrolling box on the site strip, so keyboard users can scroll it. */
  label?: string
  className?: string
}

// Dashed outline colours for a saved forecast. Levels 3 and 4 are from 07-field-mode.html.
// The design has no saved level 1 or 2 hour; risk-1 and muted keep a 3:1 contrast on white.
const SAVED_BORDER: Record<RiskLevel, string> = {
  1: 'border-risk-1',
  2: 'border-muted',
  3: 'border-warn-strong',
  4: 'border-risk-4',
}

function describe(hour: ForecastHour, saved: boolean): string {
  const name = riskName(hour.level)
  const parts = [hour.time, `level ${hour.level}, ${name}`]
  if (hour.possible) parts[1] += ' possible, not certain'
  if (hour.now) parts.push('now')
  if (saved) parts.push('saved forecast')
  return parts.join(', ')
}

export function ForecastStrip({
  hours,
  variant = 'worker',
  saved = false,
  label = 'Hour by hour forecast',
  className,
}: ForecastStripProps) {
  if (variant === 'site') {
    const minWidth = hours.length * 52 + (hours.length - 1) * 6
    return (
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          'overflow-x-auto rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
          className,
        )}
      >
        <ol
          className="m-0 grid list-none gap-1.5 p-1"
          style={{
            gridTemplateColumns: `repeat(${hours.length}, minmax(52px, 1fr))`,
            minWidth,
          }}
        >
          {hours.map((hour) => {
            const { bg, text } = riskClasses(hour.level)
            return (
              <li key={hour.time} className="relative flex flex-col items-center gap-1.5">
                <span className="sr-only">{describe(hour, false)}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-full items-center justify-center rounded-lg font-extrabold',
                    bg,
                    text,
                    hour.now && 'outline-3 outline-offset-2 outline-ink',
                  )}
                >
                  {hour.level}
                  {hour.possible && '?'}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'font-mono text-[12px]',
                    hour.now ? 'font-extrabold text-ink' : 'text-muted',
                  )}
                >
                  {hour.time}
                  {hour.now && ' now'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <ol
      className={cn('m-0 grid list-none gap-1.5 p-0', className)}
      style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}
    >
      {hours.map((hour) => {
        const { bg, text } = riskClasses(hour.level)
        return (
          <li key={hour.time} className="relative flex flex-col items-center gap-1.5">
            <span className="sr-only">{describe(hour, saved)}</span>
            <span aria-hidden="true" className="font-mono text-[13px] text-muted">
              {hour.time}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'flex w-full items-center justify-center rounded-[10px] font-extrabold',
                saved
                  ? cn('h-10 border-2 border-dashed text-ink', SAVED_BORDER[hour.level])
                  : cn('h-11 text-[17px]', bg, text),
              )}
            >
              {hour.level}
            </span>
            <span aria-hidden="true" className="text-[12px] font-semibold">
              {hour.possible ? 'Possible' : riskName(hour.level)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
