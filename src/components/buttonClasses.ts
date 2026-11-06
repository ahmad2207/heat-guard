import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-surface border border-ink',
  secondary: 'bg-surface text-ink border border-field',
  // "Refer to clinic" in 11-occupational-health.html
  danger: 'bg-surface text-risk-4 border border-field',
}

// sm: supervisor and OH pages (44px). md: secondary worker buttons (48px).
// lg: main worker actions at the bottom of a screen (54px).
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-[18px] rounded-[10px] text-[15px]',
  md: 'min-h-12 px-4 rounded-xl text-[15px]',
  lg: 'min-h-[54px] px-5 rounded-[14px] text-[17px]',
}

/** Shared by Button and ButtonLink so a link can look exactly like a button. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 font-bold no-underline',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )
}
