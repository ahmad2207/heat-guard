import { useState } from 'react'
import { Card } from '../../components/Card'
import { PrivacyFooter } from '../../components/PrivacyFooter'
import { OH_TEXT, PROFILES_TO_REVIEW, PROFILES_WAITING } from '../../data/mock'
import { cn } from '../../lib/cn'
import { EscalationCard } from './EscalationCard'
import { ProfilePanel } from './ProfilePanel'

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

/** Screen 11: cases and profiles. Values from design-reference/html/11-occupational-health.html. */
export function CasesScreen() {
  const [selected, setSelected] = useState(PROFILES_TO_REVIEW[0].workerId)
  const [chosenByUser, setChosenByUser] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-extrabold tracking-[-0.01em]">{OH_TEXT.title}</h1>
        <p className="m-0 text-[15px] text-muted">{OH_TEXT.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-5">
        <EscalationCard />

        <Card
          variant="page"
          aria-label="Review queue"
          className="flex min-w-0 flex-[2_1_424px] flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[18px] font-extrabold">{OH_TEXT.reviewTitle}</h2>
            <span className="text-[14px] text-muted">{PROFILES_WAITING}</span>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {PROFILES_TO_REVIEW.map((row, index) => {
              const isSelected = row.workerId === selected
              const isLast = index === PROFILES_TO_REVIEW.length - 1
              const nextIsSelected = PROFILES_TO_REVIEW[index + 1]?.workerId === selected
              return (
                <li key={row.workerId}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelected(row.workerId)
                      setChosenByUser(true)
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-3 p-3 text-left',
                      isSelected
                        ? 'rounded-xl bg-info-bg'
                        : !isLast && !nextIsSelected && 'border-b border-line-soft',
                      focusRing,
                    )}
                  >
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span
                        className={cn('text-[15px]', isSelected ? 'font-extrabold' : 'font-bold')}
                      >
                        {row.workerId} · {row.crew}
                      </span>
                      <span
                        className={cn('text-[13px]', isSelected ? 'text-info-text' : 'text-muted')}
                      >
                        {row.reason}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="text-[12px] font-extrabold text-info-text">
                        {OH_TEXT.selected}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {/* Keyed by worker so the draft level and saved state reset when another row is chosen. */}
      <ProfilePanel key={selected} workerId={selected} focusOnOpen={chosenByUser} />

      <PrivacyFooter className="pb-6">{OH_TEXT.privacy}</PrivacyFooter>
    </>
  )
}
