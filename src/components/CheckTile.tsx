import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type CheckTileProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label: string
  /** Second line under the label, as in the health profile. */
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * A real checkbox inside a tile-shaped label. Selected tiles get an ink border and warn-bg fill.
 * Values from 05-report-symptoms.html (no hint) and 02-health-profile.html (with hint).
 */
export function CheckTile({ label, hint, checked, onChange, className, ...rest }: CheckTileProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center rounded-xl border-2 px-3 py-2.5',
        'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
        hint ? 'min-h-[52px] gap-3' : 'min-h-14 gap-2.5',
        checked ? 'border-ink bg-warn-bg' : 'border-line bg-surface',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="m-0 size-[22px] shrink-0 cursor-pointer accent-ink"
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
