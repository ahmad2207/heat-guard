import { Outlet } from 'react-router-dom'
import { SupervisorHeader } from '../components/SupervisorHeader'
import { useRouteHandle } from './routeHandle'

/** Dark header with Today, Plan and Measures, then a content area up to 1360px wide. */
export function SupervisorLayout() {
  const { supervisorHeader } = useRouteHandle()

  return (
    <div className="min-h-dvh bg-ground text-ink">
      <SupervisorHeader
        status={supervisorHeader?.status}
        showRole={supervisorHeader?.showRole ?? true}
        initials={supervisorHeader?.initials}
      />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-5 p-6">
        <Outlet />
      </main>
    </div>
  )
}
