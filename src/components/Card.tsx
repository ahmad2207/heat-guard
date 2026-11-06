import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { cn } from '../lib/cn'

export type CardVariant = 'worker' | 'page'

type CardProps<T extends ElementType> = {
  as?: T
  /** worker: phone screens (16px radius and padding). page: supervisor and OH pages (18px radius, 22px padding). */
  variant?: CardVariant
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

const VARIANTS: Record<CardVariant, string> = {
  worker: 'rounded-2xl p-4',
  page: 'rounded-[18px] p-[22px]',
}

export function Card<T extends ElementType = 'section'>({
  as,
  variant = 'worker',
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Component: ElementType = as ?? 'section'
  return (
    <Component className={cn('bg-surface', VARIANTS[variant], className)} {...rest}>
      {children}
    </Component>
  )
}
