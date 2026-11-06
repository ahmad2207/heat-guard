import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { ThermometerIcon } from './icons'

export type SupervisorTab = 'today' | 'plan' | 'measures'

const TABS: Array<{ id: SupervisorTab; label: string; to: string }> = [
  { id: 'today', label: 'Today', to: '/supervisor' },
  { id: 'plan', label: 'Plan', to: '/supervisor/plan' },
  { id: 'measures', label: 'Measures', to: '/supervisor/measures' },
]

function tabFromPath(pathname: string): SupervisorTab | undefined {
  if (pathname.startsWith('/supervisor/plan')) return 'plan'
  if (pathname.startsWith('/supervisor/measures')) return 'measures'
  if (pathname === '/supervisor' || pathname === '/supervisor/') return 'today'
  return undefined
}

interface SupervisorHeaderProps {
  /** Which tab is current. Worked out from the URL when not given. */
  active?: SupervisorTab
  /** Live status text, for example "Updated 10:32 · WBGT estimated from weather data". Hidden when empty. */
  status?: string
  /** Shows the "Supervisor" role label next to the logo. */
  showRole?: boolean
  /** Account initials. The account button is hidden when empty. */
  initials?: string
  onAccountClick?: () => void
  className?: string
}

/** Dark supervisor header with Today, Plan and Measures tabs. Values from 08-supervisor-today.html. */
export function SupervisorHeader({
  active,
  status,
  showRole = true,
  initials,
  onAccountClick,
  className,
}: SupervisorHeaderProps) {
  const { pathname } = useLocation()
  const current = active ?? tabFromPath(pathname)
  const focus =
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-surface'

  return (
    <header className={cn('bg-ink text-surface', className)}>
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <ThermometerIcon size={26} className="text-brand" />
          <span className="text-[19px] font-extrabold">HeatGuard</span>
          {showRole && (
            <span className="border-l border-muted pl-2.5 text-[15px] text-line">Supervisor</span>
          )}
        </div>

        <nav aria-label="Sections" className="flex gap-1.5">
          {TABS.map(({ id, label, to }) => {
            const isCurrent = id === current
            return (
              <Link
                key={id}
                to={to}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-[10px] px-3.5 text-[15px] no-underline',
                  focus,
                  isCurrent ? 'bg-ink-raised font-bold text-surface' : 'font-semibold text-line',
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {(status || initials) && (
          <div className="flex flex-wrap items-center gap-4">
            {status && (
              <span className="flex items-center gap-2 text-[14px] text-line">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-status-live" />
                {status}
              </span>
            )}
            {initials && (
              <button
                type="button"
                aria-label="Account"
                onClick={onAccountClick}
                className={cn(
                  'size-11 rounded-full border border-muted bg-ink-control text-[14px] font-bold text-surface',
                  focus,
                )}
              >
                {initials}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
