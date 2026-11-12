import { MY_DATA } from '../../data/mock'
import type { WorkerPreferences } from './workerPreferences'

/**
 * Saves the worker's own data as heatguard-my-data.json: consent choices, language, health
 * profile answers and review request status, plus the date. Nothing else is included.
 */
export function downloadMyData(preferences: WorkerPreferences): void {
  const data = {
    exportedAt: new Date().toISOString(),
    consent: {
      agreed: preferences.consentGiven,
      healthPrecautions: preferences.sharing.health,
      wearableBand: preferences.sharing.band,
      symptomReports: preferences.sharing.reports,
      readWarningsAloud: preferences.sharing.voice,
    },
    language: preferences.language,
    healthProfile: preferences.profile,
  }

  saveJsonFile(data, MY_DATA.downloadFileName)
}

/** Saves data as a JSON file the browser downloads, for example heatguard-my-data.json. */
export function saveJsonFile(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before releasing the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
