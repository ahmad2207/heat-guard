import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon } from './icons'

export type ChipVariant = 'default' | 'source'

interface ChipProps {
  /** default: grey chip for reasons ("Why") and recorded factors. source: white data-source chip with a green tick. */
  variant?: ChipVariant
  className?: string
  children: ReactNode
}

export function Chip({ variant = 'default', className, children }: ChipProps) {
  if (variant === 'source') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[13px] font-semibold',
          className,
        )}
      >
        <CheckIcon size={12} strokeWidth={3.5} className="text-ok" />
        {children}
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
