import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type RadioTileProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label: string
  hint?: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  /**
   * worker: health profile single choice (selected tile gets warn-bg).
   * oh: precaution level on the occupational health profile (selected tile gets oh-selected).
   */
  variant?: 'worker' | 'oh'
}

/** A real radio button inside a tile-shaped label. Values from 02-health-profile.html and 11-occupational-health.html. */
export function RadioTile({
  label,
  hint,
  name,
  value,
  checked,
  onChange,
  variant = 'worker',
  className,
  ...rest
}: RadioTileProps) {
  const isOh = variant === 'oh'
  return (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer gap-3 rounded-xl border-2',
        'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
        isOh ? 'items-start px-3.5 py-3' : 'items-center px-3 py-2.5',
        checked ? 'border-ink' : 'border-line bg-surface',
        checked && (isOh ? 'bg-oh-selected' : 'bg-warn-bg'),
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className={cn('m-0 size-5 shrink-0 cursor-pointer accent-ink', isOh && 'mt-0.5')}
        {...rest}
      />
      {hint ? (
        // OH values from the levels template in design-reference/source/OccHealth.dc.html.
        <span className={cn('flex flex-col', isOh ? 'gap-0.5' : 'gap-px')}>
          <span className={cn('text-[15px]', isOh ? 'font-extrabold' : 'font-bold')}>{label}</span>
          <span className="text-[13px] text-muted">{hint}</span>
        </span>
      ) : (
        <span className="text-[15px] font-semibold">{label}</span>
      )}
    </label>
  )
}
