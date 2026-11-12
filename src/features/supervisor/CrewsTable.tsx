import { useId } from 'react'
import { Card } from '../../components/Card'
import { RiskBadge } from '../../components/RiskBadge'
import { TODAY_TEXT } from '../../data/mock'
import type { CrewRow } from '../../data/types'
import { cn } from '../../lib/cn'

const headings = (peakLabel: string) => [
  'Crew',
  'Activity',
  'Workload',
  'PPE',
  'Workers',
  'Now',
  peakLabel,
  'Next action',
]

/** Crews table. Scrolls sideways inside its own box on narrow screens. */
export function CrewsTable({ crews, peakLabel }: { crews: CrewRow[]; peakLabel: string }) {
  const HEADINGS = headings(peakLabel)
  const headingId = useId()
  const cell = (last: boolean) => cn('px-3 py-3.5', !last && 'border-b border-line-soft')

  return (
    <Card variant="page" aria-labelledby={headingId} className="flex flex-col gap-3.5">
      <h2 id={headingId} className="text-[18px] font-extrabold">
        Crews
      </h2>
      <div
        role="region"
        aria-labelledby={headingId}
        tabIndex={0}
        className="relative overflow-x-auto rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <table className="w-full min-w-[900px] border-collapse text-[15px]">
          <thead>
            <tr className="text-left text-[13px] text-muted">
              {HEADINGS.map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b-2 border-line px-3 py-2.5 font-bold"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crews.length === 0 && (
              <tr>
                <td colSpan={HEADINGS.length} className="px-3 py-3.5 text-muted">
                  {TODAY_TEXT.noCrews}
                </td>
              </tr>
            )}
            {crews.map((crew, index) => {
              const last = index === crews.length - 1
              return (
                <tr key={crew.id}>
                  <th scope="row" className={cn(cell(last), 'text-left font-bold')}>
                    {crew.name}
                  </th>
                  <td className={cell(last)}>{crew.activity}</td>
                  <td className={cell(last)}>{crew.workload}</td>
                  <td className={cell(last)}>{crew.ppe}</td>
                  <td className={cn(cell(last), 'font-mono')}>{crew.workers}</td>
                  <td className={cell(last)}>
                    {crew.now ? (
                      <RiskBadge level={crew.now} size="md" />
                    ) : (
                      <span className="text-[14px] text-muted">{TODAY_TEXT.noReading}</span>
                    )}
                  </td>
                  <td className={cell(last)}>
                    <RiskBadge level={crew.peak.level} size="md" possible={crew.peak.possible} />
                  </td>
                  <td className={cell(last)}>{crew.nextAction}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
