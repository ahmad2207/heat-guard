import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PillStatus =
  | 'done'
  | 'acknowledged'
  | 'pending'
  | 'ok'
  | 'check'
  | 'act-now'
  | 'escalation'
  | 'sample-data'
  | 'precaution'
  | 'hazard-moderate'
  | 'hazard-possible'

const LOUD = 'px-2.5 py-1 uppercase tracking-[0.04em]'
const COMPACT = 'px-2 py-0.5'
const NORMAL = 'px-2.5 py-1'

// Values from 08-supervisor-today.html, 10-supervisor-measures.html and 11-occupational-health.html.
const STYLES: Record<PillStatus, { className: string; label: string }> = {
  done: { className: cn(NORMAL, 'bg-ok-bg text-ok-text'), label: 'Done' },
  acknowledged: { className: cn(NORMAL, 'bg-info-bg text-info-text'), label: 'Acknowledged' },
  pending: { className: cn(NORMAL, 'bg-ground text-muted'), label: 'Pending' },
  ok: { className: cn(COMPACT, 'bg-ok-bg text-ok-text'), label: 'OK' },
  check: { className: cn(COMPACT, 'bg-warn-bg text-warn-text'), label: 'Check' },
  'act-now': { className: cn(LOUD, 'bg-risk-4 text-risk-4-text'), label: 'Act now' },
  escalation: { className: cn(LOUD, 'bg-risk-4 text-risk-4-text'), label: 'Escalation' },
  'sample-data': { className: cn(LOUD, 'bg-risk-2 text-risk-2-text'), label: 'Sample data' },
  // No default wording: supervisors never see a precaution level name (decision D1). Pass the
  // text as children where a level name is allowed.
  precaution: { className: cn(NORMAL, 'bg-ink text-surface'), label: '' },
  'hazard-moderate': { className: cn(COMPACT, 'bg-risk-2 text-risk-2-text'), label: 'Moderate' },
  'hazard-possible': { className: cn(COMPACT, 'bg-risk-3 text-risk-3-text'), label: 'Possible' },
}

interface StatusPillProps {
  status: PillStatus
  /** Overrides the default wording for this status. */
  children?: ReactNode
  className?: string
}

export function StatusPill({ status, children, className }: StatusPillProps) {
  const style = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full text-[12px] font-extrabold whitespace-nowrap',
        style.className,
        className,
      )}
    >
      {children ?? style.label}
    </span>
  )
}
