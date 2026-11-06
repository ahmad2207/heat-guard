import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface SectionLabelProps {
  as?: 'h2' | 'h3' | 'span' | 'div'
  className?: string
  children: ReactNode
}

/** Small uppercase label, for example "DO THIS NOW" or "SITE HEAT NOW". */
export function SectionLabel({ as: Component = 'h2', className, children }: SectionLabelProps) {
  return (
    <Component
      className={cn('m-0 text-[13px] font-bold tracking-[0.08em] text-muted uppercase', className)}
    >
      {children}
    </Component>
  )
}
