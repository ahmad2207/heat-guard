import { Outlet } from 'react-router-dom'
import { WorkerBottomNav } from '../components/WorkerBottomNav'
import { ActionConfirmationProvider } from '../features/worker/ActionConfirmationProvider'
import { useRouteHandle } from './routeHandle'

/**
 * Worker app shell: full width on phones, a centred column about 430px wide on larger screens.
 * The bottom navigation shows on Status, Report and My data only (set per route in router.tsx).
 */
export function WorkerLayout() {
  const { bottomNav } = useRouteHandle()

  return (
    <ActionConfirmationProvider>
      <div className="min-h-dvh bg-ground text-ink">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
          {bottomNav && <WorkerBottomNav className="sticky bottom-0 z-10" />}
        </div>
      </div>
    </ActionConfirmationProvider>
  )
}
