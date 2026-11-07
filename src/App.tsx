import { Link } from 'react-router-dom'
import { ButtonLink } from './components/Button'
import { ThermometerIcon } from './components/icons'
import { cn } from './lib/cn'
import { useOnlineStatus } from './lib/useOnlineStatus'

const ROLES = [
  { label: 'Worker', to: '/worker' },
  { label: 'Supervisor', to: '/supervisor' },
  { label: 'Occupational health', to: '/occupational-health' },
]

/**
 * Role switcher on "/". The prototype has no login, so testers pick a role here.
 */
export default function App() {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex min-h-dvh flex-col bg-ground p-4 text-ink sm:p-6">
      <main className="mx-auto my-auto flex w-full max-w-sm flex-col gap-8 py-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <ThermometerIcon size={34} className="text-brand" />
            <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.01em]">HeatGuard</h1>
          </div>
          <p className="m-0 text-[16px] leading-[1.45] text-muted">
            Heat-risk warnings and decision support for outdoor work.
          </p>
        </header>

        <nav aria-label="Choose your role" className="flex flex-col gap-3">
          {ROLES.map((role) => (
            <ButtonLink key={role.to} to={role.to} size="lg" fullWidth className="min-h-16!">
              {role.label}
            </ButtonLink>
          ))}
        </nav>
      </main>

      <footer className="mx-auto flex w-full max-w-sm flex-col items-center gap-1 pb-2">
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted"
        >
          <span
            aria-hidden="true"
            className={cn('size-2 rounded-full', isOnline ? 'bg-ok' : 'bg-risk-4')}
          />
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {import.meta.env.DEV && (
          <Link
            to="/dev/components"
            className="inline-flex min-h-11 items-center text-[14px] font-bold text-ink underline"
          >
            Component library
          </Link>
        )}
      </footer>
    </div>
  )
}
