import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ChevronLeftIcon } from '../../components/icons'

/** Placeholder for the full privacy notice, linked from the consent screen. Not in the design yet. */
export function PrivacyNoticePage() {
  return (
    <>
      <header className="flex items-center gap-2 pt-3 pr-3 pb-2 pl-2">
        <Link
          to="/worker/welcome"
          aria-label="Back to your choices"
          className="flex size-11 items-center justify-center rounded-full text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ChevronLeftIcon size={24} strokeWidth={2.2} />
        </Link>
        <h1 className="m-0 flex-1 text-[21px] font-extrabold">Privacy notice</h1>
      </header>
      <div className="px-4 pb-4">
        <Card className="flex flex-col gap-2">
          <p className="m-0 text-[15px] leading-[1.45]">
            The full privacy notice will appear here. It is not written yet.
          </p>
          <p className="m-0 text-[14px] text-muted">Placeholder page.</p>
        </Card>
      </div>
    </>
  )
}
