import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type RadioTileProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label: string
  hint?: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
}

/** A real radio button inside a tile-shaped label. Values from 02-health-profile.html. */
export function RadioTile({
  label,
  hint,
  name,
  value,
  checked,
  onChange,
  className,
  ...rest
}: RadioTileProps) {
  return (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer gap-3 rounded-xl border-2',
        'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
        'items-center px-3 py-2.5',
        checked ? 'border-ink bg-warn-bg' : 'border-line bg-surface',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="m-0 size-5 shrink-0 cursor-pointer accent-ink"
        {...rest}
      />
      {hint ? (
        <span className="flex flex-col gap-px">
          <span className="text-[15px] font-bold">{label}</span>
          <span className="text-[13px] text-muted">{hint}</span>
        </span>
      ) : (
        <span className="text-[15px] font-semibold">{label}</span>
      )}
    </label>
  )
}
