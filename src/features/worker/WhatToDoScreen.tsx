import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  CoolIcon,
  DropIcon,
  HeartIcon,
  LighterWorkIcon,
  WarningIcon,
} from '../../components/icons'
import { ListenButton } from '../../components/ListenButton'
import { SectionLabel } from '../../components/SectionLabel'
import { CREWS, WHAT_TO_DO, WORKER } from '../../data/mock'
import type { WhatToDoAction } from '../../data/types'
import { useDevSettings } from '../../dev/devSettings'
import { cn } from '../../lib/cn'
import { riskClasses, riskName } from '../../lib/risk'
import { useSpeech } from '../../lib/useSpeech'
import { useActionConfirmation } from './actionConfirmation'

const ACTION_ICONS: Record<WhatToDoAction['icon'], typeof DropIcon> = {
  rest: ClockIcon,
  water: DropIcon,
  cool: CoolIcon,
  lighter: LighterWorkIcon,
  shift: CalendarIcon,
  watch: WarningIcon,
  unwell: HeartIcon,
  urgent: WarningIcon,
}

const focusRing = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink'

function ActionRow({ action }: { action: WhatToDoAction }) {
  const Icon = ACTION_ICONS[action.icon]
  const urgent = action.icon === 'unwell' || action.icon === 'urgent'
  const content = (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          urgent ? 'bg-danger-bg text-risk-4' : 'bg-ground text-ink',
        )}
      >
        <Icon size={20} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span
          className={cn(
            'text-[16px] leading-[1.3] font-bold',
            action.linksToReport && 'underline decoration-2 underline-offset-2',
          )}
        >
          {action.title}
        </span>
        {action.detail && (
          <span className="text-[14px] leading-[1.4] text-muted">{action.detail}</span>
        )}
      </span>
    </>
  )

  if (action.linksToReport) {
    return (
      <li>
        <Link
          to="/worker/report"
          className={cn(
            '-m-1 flex items-start gap-3 rounded-xl p-1 text-ink no-underline',
            focusRing,
          )}
        >
          {content}
        </Link>
      </li>
    )
  }
  return <li className="flex items-start gap-3">{content}</li>
}

/** Screen 4: What to do. Values from design-reference/html/04-what-to-do.html. */
export function WhatToDoScreen() {
  const { riskLevel } = useDevSettings()
  const { confirmedLevel, confirm } = useActionConfirmation()
  const { speak } = useSpeech()
  const content = WHAT_TO_DO.byLevel[riskLevel]
  const { bg, text } = riskClasses(riskLevel)
  const levelLabel = `Level ${riskLevel} · ${riskName(riskLevel)}`
  const isConfirmed = confirmedLevel === riskLevel

  // "Who" depends on the worker's level compared with their crew's current level.
  const crewLevel = CREWS.find((crew) => crew.name === WORKER.crew)?.now ?? riskLevel
  const who =
    riskLevel > crewLevel
      ? WHAT_TO_DO.who.above
      : riskLevel < crewLevel
        ? WHAT_TO_DO.who.below
        : WHAT_TO_DO.who.same

  // The button disappears when pressed, so move focus to the confirmation instead of losing it.
  const confirmedRef = useRef<HTMLDivElement>(null)
  const [justConfirmed, setJustConfirmed] = useState(false)
  useEffect(() => {
    if (justConfirmed && isConfirmed) confirmedRef.current?.focus()
  }, [justConfirmed, isConfirmed])

  const listen = speak
    ? () =>
        speak(
          `${levelLabel}. ${content.headline}. Do this now. ` +
            content.actions
              .map((action) => [action.title, action.detail].filter(Boolean).join(' '))
              .join('. '),
        )
    : undefined

  return (
    <>
      <header className="flex items-center gap-2 pt-3 pr-3 pb-2 pl-2">
        <Link
          to="/worker"
          aria-label="Back to status"
          className={cn(
            'flex size-11 items-center justify-center rounded-full text-ink',
            focusRing,
          )}
        >
          <ChevronLeftIcon size={24} strokeWidth={2.2} />
        </Link>
        <h1 className="m-0 flex-1 text-[19px] font-extrabold">What to do</h1>
        {listen && <ListenButton aria-label="Listen in your language" onClick={listen} />}
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <section
          aria-label="Your heat risk"
          className={cn('flex items-start gap-3 rounded-[18px] px-[18px] py-4', bg, text)}
        >
          <WarningIcon size={28} strokeWidth={2.2} className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[13px] font-bold tracking-[0.08em] uppercase">{levelLabel}</p>
            <p className="m-0 text-[20px] leading-[1.25] font-extrabold">{content.headline}</p>
          </div>
        </section>

        <Card className="flex flex-col gap-3.5">
          <SectionLabel>Do this now</SectionLabel>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {content.actions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-3">
          {[
            ['Why it matters', content.why],
            ['When', content.when],
            ['Who', who],
          ].map(([label, body]) => (
            <div key={label} className="flex flex-col gap-1">
              <SectionLabel>{label}</SectionLabel>
              <p className="m-0 text-[15px] leading-[1.45]">{body}</p>
            </div>
          ))}
        </Card>

        <section
          aria-label="Warning signs"
          className="flex flex-col gap-1.5 rounded-2xl bg-danger-bg px-4 py-3.5"
        >
          <p className="m-0 text-[15px] font-extrabold text-danger-text">
            {WHAT_TO_DO.warningSigns.title}
          </p>
          <p className="m-0 text-[15px] leading-[1.45]">{WHAT_TO_DO.warningSigns.text}</p>
        </section>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {isConfirmed ? (
          <div
            ref={confirmedRef}
            role="status"
            tabIndex={-1}
            className={cn(
              'flex h-[54px] items-center justify-center gap-2 rounded-[14px] bg-ok-bg text-[17px] font-bold text-ok-text',
              focusRing,
            )}
          >
            <CheckIcon size={22} strokeWidth={2.4} />
            {WHAT_TO_DO.confirmedText}
          </div>
        ) : (
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              confirm(riskLevel)
              setJustConfirmed(true)
            }}
          >
            I understand, starting now
          </Button>
        )}
        <Link
          to="/worker/report"
          className={cn(
            'flex h-12 items-center justify-center rounded-[14px] border border-field text-[16px] font-bold text-ink no-underline',
            focusRing,
          )}
        >
          I feel unwell
        </Link>
      </div>
    </>
  )
}
