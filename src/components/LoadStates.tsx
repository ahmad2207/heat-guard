import { Button } from './Button'
import { Card, type CardVariant } from './Card'
import { ClockIcon, WarningIcon } from './icons'

export const LOADING_TEXT = 'Loading...'
export const WAKING_TEXT = 'Waking up the server...'
export const WAKING_NOTE = 'This can take a minute or two.'
export const TRY_AGAIN = 'Try again'

/**
 * Shown while a screen loads. After 3 seconds (slow) it explains the wait, because the free
 * server sleeps when nobody uses it.
 */
export function LoadingState({
  slow,
  label = LOADING_TEXT,
  variant = 'worker',
}: {
  slow: boolean
  /** What is loading, shown until the wait gets slow. Defaults to "Loading...". */
  label?: string
  variant?: CardVariant
}) {
  return (
    <Card variant={variant} role="status" className="flex items-start gap-3">
      <ClockIcon size={22} strokeWidth={2.2} className="mt-px shrink-0 text-muted" />
      <span className="flex flex-col gap-0.5">
        <span className="text-[16px] font-bold">{slow ? WAKING_TEXT : label}</span>
        {slow && <span className="text-[14px] text-muted">{WAKING_NOTE}</span>}
      </span>
    </Card>
  )
}

/** A readable error and a Try again button. Never shows codes. */
export function ErrorState({
  message,
  onRetry,
  variant = 'worker',
}: {
  message: string
  onRetry: () => void
  variant?: CardVariant
}) {
  return (
    <Card variant={variant} role="alert" className="flex flex-col gap-3 border-2 border-risk-4">
      <p className="m-0 flex items-start gap-3 text-[15px] leading-[1.45] font-semibold">
        <WarningIcon size={22} strokeWidth={2.2} className="mt-px shrink-0 text-risk-4" />
        {message}
      </p>
      <Button variant="secondary" onClick={onRetry} className="self-start">
        {TRY_AGAIN}
      </Button>
    </Card>
  )
}

/** Shown when a list loads with nothing in it. */
export function EmptyState({
  message,
  variant = 'worker',
}: {
  message: string
  variant?: CardVariant
}) {
  return (
    <Card variant={variant} role="status">
      <p className="m-0 text-[15px] leading-[1.45] text-muted">{message}</p>
    </Card>
  )
}
