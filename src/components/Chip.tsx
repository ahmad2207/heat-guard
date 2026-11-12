import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon, WarningIcon } from './icons'

export type ChipVariant = 'default' | 'source'

interface ChipProps {
  /** default: grey chip for reasons ("Why") and recorded factors. source: white data-source chip with a green tick. */
  variant?: ChipVariant
  /** source only: false shows a warning mark instead of the green tick (the source is not updating). */
  ok?: boolean
  className?: string
  children: ReactNode
}

export function Chip({ variant = 'default', ok = true, className, children }: ChipProps) {
  if (variant === 'source') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[13px] font-semibold',
          className,
        )}
      >
        {ok ? (
          <CheckIcon size={12} strokeWidth={3.5} className="text-ok" />
        ) : (
          <WarningIcon size={12} strokeWidth={3} className="text-warn" />
        )}
        {children}
        {!ok && <span className="sr-only"> (not updating)</span>}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-ground px-3 py-2 text-[14px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  )
}
