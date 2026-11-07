import { Outlet } from 'react-router-dom'
import { LockIcon, ThermometerIcon } from '../components/icons'

/**
 * Navy occupational health header with the Confidential badge, then a content area up to
 * 1360px wide. Values from design-reference/html/11-occupational-health.html.
 */
export function OccupationalHealthLayout() {
  return (
    <div className="min-h-dvh bg-ground text-ink">
      <header className="bg-oh-header text-surface">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <ThermometerIcon size={26} className="text-oh-accent" />
            <span className="text-[19px] font-extrabold">HeatGuard</span>
            <span className="border-l border-oh-header-line pl-2.5 text-[15px] text-oh-header-muted">
              Occupational health
            </span>
          </div>
          <span className="flex items-center gap-2 rounded-[10px] bg-oh-header-raised px-3 py-2 text-[14px] font-bold">
            <LockIcon size={16} />
            Confidential · every view is logged
          </span>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1360px] flex-col gap-5 p-6">
        <Outlet />
      </main>
    </div>
  )
}
