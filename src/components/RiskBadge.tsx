import { cn } from '../lib/cn'
import { riskClasses, riskName, type RiskLevel } from '../lib/risk'

export type RiskBadgeSize = 'sm' | 'md' | 'lg'

interface RiskBadgeProps {
  level: RiskLevel
  size?: RiskBadgeSize
  /** Forecast that may reach this level but is not certain, for example "4 · Critical possible". */
  possible?: boolean
  className?: string
}

// sm: actions and alerts. md: crews table. lg: "Site heat now". Values from 08-supervisor-today.html.
const SIZES: Record<RiskBadgeSize, string> = {
  sm: 'rounded-full px-2.5 py-1 text-[12px]',
  md: 'rounded-full px-2.5 py-1 text-[13px]',
  lg: 'rounded-xl px-4 py-2 text-[26px] leading-tight',
}

/** Risk level as number, name and colour together. */
export function RiskBadge({ level, size = 'md', possible = false, className }: RiskBadgeProps) {
  const { bg, text } = riskClasses(level)
  return (
    <span
      className={cn(
        'inline-flex items-center font-extrabold whitespace-nowrap',
        bg,
        text,
        SIZES[size],
        className,
      )}
    >
      {level} · {riskName(level)}
      {possible && ' possible'}
    </span>
  )
}
