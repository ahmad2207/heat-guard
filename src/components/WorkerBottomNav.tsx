import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { HeartIcon, LockIcon, ThermometerIcon } from './icons'

export type WorkerTab = 'status' | 'report' | 'my-data'

/** The nav version of the thermometer has no inner bulb. */
function StatusIcon(props: Parameters<typeof HeartIcon>[0]) {
  return <ThermometerIcon withBulb={false} {...props} />
}

const TABS: Array<{ id: WorkerTab; label: string; to: string; Icon: typeof HeartIcon }> = [
  { id: 'status', label: 'Status', to: '/worker', Icon: StatusIcon },
  { id: 'report', label: 'Report', to: '/worker/report', Icon: HeartIcon },
  { id: 'my-data', label: 'My data', to: '/worker/my-data', Icon: LockIcon },
]

function tabFromPath(pathname: string): WorkerTab | undefined {
  if (pathname.startsWith('/worker/report')) return 'report'
  if (pathname.startsWith('/worker/my-data')) return 'my-data'
  if (pathname === '/worker' || pathname === '/worker/') return 'status'
  return undefined
}

interface WorkerBottomNavProps {
  /** Which tab is current. Worked out from the URL when not given. */
  active?: WorkerTab
  className?: string
}

/** Status, Report and My data. Values from 03-home.html. */
export function WorkerBottomNav({ active, className }: WorkerBottomNavProps) {
  const { pathname } = useLocation()
  const current = active ?? tabFromPath(pathname)

  return (
    <nav
      aria-label="Main"
      className={cn(
        'grid grid-cols-3 border-t border-line bg-surface px-2 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {TABS.map(({ id, label, to, Icon }) => {
        const isCurrent = id === current
        return (
          <Link
            key={id}
            to={to}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[13px] no-underline',
              'focus-visible:outline-3 focus-visible:-outline-offset-2 focus-visible:outline-ink',
              isCurrent ? 'font-extrabold text-ink' : 'font-semibold text-muted',
            )}
          >
            <Icon size={24} strokeWidth={isCurrent ? 2.2 : 2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
