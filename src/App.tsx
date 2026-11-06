import { Link } from 'react-router-dom'
import { Card } from './components/Card'
import { ThermometerIcon } from './components/icons'
import { cn } from './lib/cn'
import { useOnlineStatus } from './lib/useOnlineStatus'

/** Placeholder page on "/". Phase 2 replaces it with the role switcher. */
export default function App() {
  const isOnline = useOnlineStatus()

  return (
    <div className="flex min-h-screen flex-col justify-between bg-ground p-4 text-ink sm:p-6">
      <header className="mx-auto w-full max-w-sm pt-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <ThermometerIcon size={30} className="text-brand" />
          <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.01em]">HeatGuard AI</h1>
        </div>
        <p className="mt-2 text-[16px] font-medium text-muted">
          Heat-risk decision support for outdoor workers
        </p>
      </header>

      <main className="mx-auto my-auto w-full max-w-sm py-8">
        <Card className="border border-line">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold">Connection status</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold',
                isOnline ? 'bg-ok-bg text-ok-text' : 'bg-danger-bg text-danger-text',
              )}
            >
              <span
                className={cn('size-2 rounded-full', isOnline ? 'bg-ok' : 'bg-risk-4')}
                aria-hidden="true"
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </Card>
      </main>

      <footer className="mx-auto w-full max-w-sm pb-4 text-center">
        <Link
          to="/dev/components"
          className="inline-flex min-h-11 items-center text-[14px] font-bold text-ink underline"
        >
          Component library (for testing)
        </Link>
        <p className="m-0 text-[13px] font-medium text-muted">HeatGuard AI Shell</p>
      </footer>
    </div>
  )
}
