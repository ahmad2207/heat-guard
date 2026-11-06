import { useId } from 'react'
import { cn } from '../lib/cn'

interface SwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Draws the divider under the row, for all but the last switch in a card. */
  divider?: boolean
  disabled?: boolean
  className?: string
}

/**
 * A real checkbox with role="switch", wrapped in a label so the whole row is the touch target.
 * Values from 01-consent.html and 06-my-data.html.
 */
export function Switch({
  label,
  description,
  checked,
  onChange,
  divider = false,
  disabled = false,
  className,
}: SwitchProps) {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 py-3',
        divider && 'border-b border-line-soft',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span id={labelId} className="text-[16px] font-bold">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-[14px] leading-[1.4] text-muted">
            {description}
          </span>
        )}
      </span>
      <span className="relative h-8 w-[52px] shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={labelId}
          aria-describedby={description ? descriptionId : undefined}
          className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none block h-8 w-[52px] rounded-full p-[3px] transition-colors',
            'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink',
            checked ? 'bg-ok' : 'bg-subtle',
          )}
        >
          <span
            className={cn(
              'block size-[26px] rounded-full bg-surface transition-transform',
              checked && 'translate-x-5',
            )}
          />
        </span>
      </span>
    </label>
  )
}
