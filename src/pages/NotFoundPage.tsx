import { ButtonLink } from '../components/Button'
import { ThermometerIcon } from '../components/icons'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ground p-4 text-ink">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center">
        <ThermometerIcon size={32} className="text-brand" />
        <h1 className="m-0 text-[24px] font-extrabold">Page not found</h1>
        <p className="m-0 text-[16px] leading-[1.45] text-muted">
          This page does not exist or has moved. Go back to the start to choose your role.
        </p>
        <ButtonLink to="/" size="lg" fullWidth>
          Back to HeatGuard
        </ButtonLink>
      </div>
    </main>
  )
}
