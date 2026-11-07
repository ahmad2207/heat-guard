import { ThermometerIcon } from '../../components/icons'
import { LANGUAGE_CODES } from '../../data/mock'
import { cn } from '../../lib/cn'
import { useWorkerPreferences } from './workerPreferences'

/** Logo and language button at the top of Home and field mode (03-home.html, 07-field-mode.html). */
/** Field mode uses slightly more padding than Home (07-field-mode.html: 16px top, 12px bottom). */
export function WorkerHomeHeader({ fieldMode = false }: { fieldMode?: boolean }) {
  const { language } = useWorkerPreferences()
  return (
    <header
      className={cn(
        'flex items-center justify-between px-5',
        fieldMode ? 'pt-4 pb-3' : 'pt-3.5 pb-2.5',
      )}
    >
      <div className="flex items-center gap-2">
        <ThermometerIcon size={26} className="text-brand" />
        <span className="text-[19px] font-extrabold tracking-[-0.01em]">HeatGuard</span>
      </div>
      {/* Language choice is visual only for now. Translations come after Phase 9. */}
      <button
        type="button"
        aria-label={`Change language, current ${language}`}
        className="h-11 min-w-16 rounded-full border border-field bg-surface px-3.5 text-[15px] font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {LANGUAGE_CODES[language]}
      </button>
    </header>
  )
}
