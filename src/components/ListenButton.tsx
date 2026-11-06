import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { SpeakerIcon } from './icons'

type ListenButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /**
   * icon: square icon-only button on the risk card (52px, outline and icon in the card's text colour).
   * labelled: "Listen" pill in screen headers (44px).
   */
  variant?: 'icon' | 'labelled'
  /** Accessible name. Required wording for the icon-only version. */
  'aria-label'?: string
}

export function ListenButton({
  variant = 'labelled',
  className,
  type = 'button',
  'aria-label': ariaLabel,
  ...rest
}: ListenButtonProps) {
  const focus = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

  if (variant === 'icon') {
    return (
      <button
        type={type}
        aria-label={ariaLabel ?? 'Listen to this warning'}
        className={cn(
          // Outline, icon and focus ring all follow the surrounding text colour. On RiskCard that is
          // the level's risk-N-text: ink on Elevated and High, white on Low and Critical.
          'flex size-[52px] shrink-0 items-center justify-center rounded-[14px] border-2 border-current bg-transparent text-current',
          'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current',
          className,
        )}
        {...rest}
      >
        <SpeakerIcon size={24} strokeWidth={2.2} />
      </button>
    )
  }

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-11 items-center gap-1.5 rounded-full border border-field bg-surface px-3.5 text-[15px] font-bold text-ink',
        focus,
        className,
      )}
      {...rest}
    >
      <SpeakerIcon size={18} strokeWidth={2.2} />
      Listen
    </button>
  )
}
