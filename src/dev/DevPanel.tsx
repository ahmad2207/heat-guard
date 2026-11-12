import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { RadioTile } from '../components/RadioTile'
import { Switch } from '../components/Switch'
import { RISK_LEVELS, riskLabel, type RiskLevel } from '../lib/risk'
import { CURRENT_RISK_LEVEL } from '../data/mock'
import { useWorkerPreferences } from '../features/worker/workerPreferences'
import { useDevSettings } from './devSettings'

/**
 * Floating developer panel. Only loaded in development builds (see main.tsx), so it is not in
 * the production bundle.
 */
export default function DevPanel() {
  const { riskLevel, setRiskLevel, forceFieldMode, setForceFieldMode } = useDevSettings()
  const { resetOnboarding, consentGiven, loadSampleAnswers } = useWorkerPreferences()
  /** Clears the saved worker state and resets this panel. */
  const resetDemoData = () => {
    resetOnboarding()
    setRiskLevel(CURRENT_RISK_LEVEL)
    setForceFieldMode(false)
  }
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="fixed right-3 bottom-[148px] z-50 flex flex-col items-end gap-2">
      {open && (
        <section
          id={panelId}
          aria-label="Developer panel"
          className="flex w-[min(320px,calc(100vw-24px))] flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="m-0 text-[16px] font-extrabold">Developer panel</h2>
            <span className="text-[12px] text-muted">Development builds only</span>
          </div>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-[13px] font-bold tracking-[0.08em] text-muted uppercase">
              Worker risk level
            </legend>
            {RISK_LEVELS.map((level) => (
              <RadioTile
                key={level}
                name="dev-risk-level"
                value={String(level)}
                label={riskLabel(level)}
                checked={riskLevel === level}
                onChange={(value) => setRiskLevel(Number(value) as RiskLevel)}
              />
            ))}
          </fieldset>

          <Switch
            label="Force field mode"
            description="Show the offline layout while online."
            checked={forceFieldMode}
            onChange={setForceFieldMode}
          />

          <div className="flex flex-col gap-1 border-t border-line-soft pt-3">
            <Button variant="secondary" size="sm" fullWidth onClick={loadSampleAnswers}>
              Load W-0412 sample answers
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={resetOnboarding}>
              Reset onboarding
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={resetDemoData}>
              Reset demo data
            </Button>
            <p className="m-0 text-[12px] text-muted">
              Reset onboarding clears consent and the health profile. Reset demo data also resets
              this panel. {consentGiven ? 'Consent is saved.' : 'No consent saved.'}
            </p>
          </div>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-surface shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {open ? 'Close dev' : 'Dev'}
        <span className="rounded-full bg-ink-raised px-2 py-0.5 font-mono text-[12px]">
          L{riskLevel}
          {forceFieldMode ? ' · field' : ''}
        </span>
      </button>
    </div>
  )
}
