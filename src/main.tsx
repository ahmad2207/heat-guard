import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts so they work offline. Public Sans loads every subset because
// Hausa, Yoruba and Igbo letters fall in latin-ext and vietnamese. IBM Plex Mono
// is only used for numbers and readings, so latin is enough.
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import '@fontsource/public-sans/800.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { DevSettingsProvider } from './dev/DevSettingsProvider.tsx'
import { WorkerPreferencesProvider } from './features/worker/WorkerPreferencesProvider.tsx'
import { router } from './router.tsx'

// import.meta.env.DEV is false in production builds, so Vite drops the panel and its import.
const DevPanel = import.meta.env.DEV ? lazy(() => import('./dev/DevPanel.tsx')) : null

// Clear saved precaution levels and escalation outcomes from an earlier version of the demo,
// so old demo state cannot leak into the worker or supervisor screens.
for (const key of ['heatguard.precautions.v1', 'heatguard.outcomes.v1']) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage blocked (for example private browsing): nothing to clear.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevSettingsProvider>
      <WorkerPreferencesProvider>
        <RouterProvider router={router} />
        {DevPanel && (
          <Suspense fallback={null}>
            <DevPanel />
          </Suspense>
        )}
      </WorkerPreferencesProvider>
    </DevSettingsProvider>
  </StrictMode>,
)
