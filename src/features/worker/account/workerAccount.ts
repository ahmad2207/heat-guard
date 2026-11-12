import { createContext, useContext } from 'react'
import type { ConsentChoices } from '../../../api/converters/consent'
import type { ApiError } from '../../../api/errors'
import type { WorkerAccount } from '../../../api/workerProfile'
import type { Language } from '../../../data/types'

export type WorkerAccountState =
  /** Sample data: screens use the WorkerPreferences store instead. */
  | { status: 'mock' }
  | { status: 'loading'; slow: boolean }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; account: WorkerAccount }

export interface WorkerAccountValue {
  state: WorkerAccountState
  reload: () => void
  /** Loads the account again without showing the loading state, for example after a delete. */
  refresh: () => Promise<void>
  /** PATCH /me/preferences, then updates the account. Throws ApiError on failure. */
  setLanguage: (language: Language) => Promise<void>
  setReadAloud: (on: boolean) => Promise<void>
  /** PUT /me/consents with all three switches. Marks the worker as having chosen. */
  setConsents: (choices: ConsentChoices) => Promise<void>
}

export const WorkerAccountContext = createContext<WorkerAccountValue | null>(null)

export function useWorkerAccount(): WorkerAccountValue {
  const value = useContext(WorkerAccountContext)
  if (!value) throw new Error('useWorkerAccount must be used inside WorkerAccountProvider')
  return value
}
