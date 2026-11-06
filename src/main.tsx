import { StrictMode } from 'react'
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
import { router } from './router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
