import { useEffect, useId, useRef, useState } from 'react'
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
  /**
   * When set, the account button opens a small menu with "Signed in as ..." and Sign out
   * (api mode). Without it the button does nothing, as in the design.
   */
  account?: { signedInAs: string; signOutLabel: string; onSignOut: () => void }
  className?: string
}

/** Dark supervisor header with Today, Plan and Measures tabs. Values from 08-supervisor-today.html. */
export function SupervisorHeader({
  active,
  status,
  showRole = true,
  initials,
  onAccountClick,
  account,
  className,
}: SupervisorHeaderProps) {
  const { pathname } = useLocation()
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Escape or a click outside closes the menu; Escape returns focus to the button.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      buttonRef.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])
  const current = active ?? tabFromPath(pathname)
  const focus =
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-surface'

  return (
    <header className={cn('bg-ink text-surface', className)}>
      <div className="mx-auto flex max-w-[1408px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
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
              <div ref={accountRef} className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  aria-label="Account"
                  aria-expanded={account ? menuOpen : undefined}
                  aria-controls={account ? menuId : undefined}
                  onClick={() => {
                    onAccountClick?.()
                    if (account) setMenuOpen((open) => !open)
                  }}
                  className={cn(
                    'size-11 rounded-full border border-muted bg-ink-control text-[14px] font-bold text-surface',
                    focus,
                  )}
                >
                  {initials}
                </button>
                {account && menuOpen && (
                  <div
                    id={menuId}
                    className="absolute top-full right-0 z-20 mt-2 flex w-60 flex-col gap-2 rounded-2xl border border-line bg-surface p-3 text-ink shadow-lg"
                  >
                    <p className="m-0 text-[14px] text-muted">{account.signedInAs}</p>
                    <button
                      type="button"
                      onClick={account.onSignOut}
                      className="flex min-h-11 items-center justify-center rounded-[10px] border border-field bg-surface text-[15px] font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {account.signOutLabel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
