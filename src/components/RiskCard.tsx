import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import { RISK_WORKER_MESSAGES, riskClasses, riskName, type RiskLevel } from '../lib/risk'
import { ListenButton } from './ListenButton'

interface RiskCardProps {
  level: RiskLevel
  /** Defaults to the standard message for the level. */
  message?: string
  /** Where "See what to do" goes. */
  whatToDoHref?: string
  /** Reads the warning aloud. The Listen button is hidden when this is not given. */
  onListen?: () => void
  className?: string
}

/** The big "Your heat risk now" card on worker Home. Values from 03-home.html and 03b-home-critical.html. */
export function RiskCard({
  level,
  message,
  whatToDoHref = '/worker/what-to-do',
  onListen,
  className,
}: RiskCardProps) {
  const { bg, text, focusRing } = riskClasses(level)
  return (
    <section
      aria-label="Your heat risk"
      className={cn('flex flex-col gap-3 rounded-[20px] p-5', bg, text, className)}
    >
      <p className="m-0 text-[13px] font-bold tracking-[0.08em] uppercase">Your heat risk now</p>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[46px] leading-none font-extrabold tracking-[-0.02em]">
          {riskName(level)}
        </span>
        <span className="text-[17px] font-bold">Level {level} of 4</span>
      </p>
      <p className="m-0 text-[18px] leading-[1.35] font-semibold">
        {message ?? RISK_WORKER_MESSAGES[level]}
      </p>
      <div className="flex gap-2">
        <Link
          to={whatToDoHref}
          className={cn(
            'flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-surface text-[17px] font-bold text-ink no-underline focus-visible:outline-3 focus-visible:outline-offset-2',
            // The ring sits on the card colour, so it uses the card's text colour.
            focusRing,
          )}
        >
          See what to do
        </Link>
        {onListen && <ListenButton variant="icon" onClick={onListen} />}
      </div>
    </section>
  )
}
