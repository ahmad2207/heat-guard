import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { LockIcon } from './icons'

interface PrivacyFooterProps {
  /** footer at the end of a page, div when used inside a screen (for example the report screen). */
  as?: 'footer' | 'div'
  className?: string
  children: ReactNode
}

/** Lock icon with a privacy promise, as at the bottom of the supervisor and OH pages. */
export function PrivacyFooter({
  as: Component = 'footer',
  className,
  children,
}: PrivacyFooterProps) {
  return (
    <Component
      className={cn(
        'flex items-start gap-2.5 px-1 text-[13px] leading-normal text-muted',
        className,
      )}
    >
      <LockIcon size={18} className="mt-px shrink-0" />
      <span>{children}</span>
    </Component>
  )
}
