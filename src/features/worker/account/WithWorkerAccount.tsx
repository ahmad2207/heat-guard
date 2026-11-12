import type { ReactNode } from 'react'
import { ErrorState, LoadingState } from '../../../components/LoadStates'
import type { WorkerAccount } from '../../../api/workerProfile'
import { useWorkerAccount } from './workerAccount'

/** The loading or error card for a worker screen, with the screen's usual side padding. */
export function ScreenStatus({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 px-4 py-4">{children}</div>
}

/**
 * Api mode: renders children with the loaded account, or the loading (with "Waking up the
 * server..." after 3 seconds) and error states while it loads.
 */
export function WithWorkerAccount({
  children,
}: {
  children: (account: WorkerAccount) => ReactNode
}) {
  const { state, reload } = useWorkerAccount()
  if (state.status === 'ready') return children(state.account)
  if (state.status === 'error') {
    return (
      <ScreenStatus>
        <ErrorState message={state.error.message} onRetry={reload} />
      </ScreenStatus>
    )
  }
  return (
    <ScreenStatus>
      <LoadingState slow={state.status === 'loading' && state.slow} />
    </ScreenStatus>
  )
}
