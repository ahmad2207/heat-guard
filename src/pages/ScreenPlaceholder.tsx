import { Card } from '../components/Card'
import { SectionLabel } from '../components/SectionLabel'
import { cn } from '../lib/cn'

interface ScreenPlaceholderProps {
  /** Screen number from design-reference/SCREENS.md, for example "3". */
  number: string
  name: string
  route: string
  /** Screenshot file names in design-reference/screens/. */
  references: string[]
  /** worker: inside the 430px worker column. page: supervisor and OH pages. */
  variant?: 'worker' | 'page'
  /** Phase that builds the real screen. */
  phase: number
}

/** Temporary page for a route whose screen is not built yet. */
export function ScreenPlaceholder({
  number,
  name,
  route,
  references,
  variant = 'worker',
  phase,
}: ScreenPlaceholderProps) {
  return (
    <div className={cn(variant === 'worker' && 'p-4')}>
      <Card variant={variant} className="flex flex-col gap-3">
        <SectionLabel as="div">Screen {number} · placeholder</SectionLabel>
        <h1 className="m-0 text-[26px] leading-tight font-extrabold">{name}</h1>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[15px]">
          <dt className="font-bold">Route</dt>
          <dd className="m-0 font-mono text-[14px] break-all">{route}</dd>
          <dt className="font-bold">Reference</dt>
          <dd className="m-0 flex flex-col font-mono text-[14px] break-all">
            {references.map((file) => (
              <span key={file}>{file}</span>
            ))}
          </dd>
        </dl>
        <p className="m-0 text-[14px] text-muted">Built in Phase {phase}.</p>
      </Card>
    </div>
  )
}
