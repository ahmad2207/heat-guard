import { createBrowserRouter } from 'react-router-dom'
import App from './App.tsx'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    // Temporary component library. Loaded on demand so it stays out of the main bundle.
    // Phase 9 removes it from production builds.
    path: '/dev/components',
    lazy: async () => {
      const { default: Component } = await import('./dev/DevComponentsPage.tsx')
      return { Component }
    },
  },
])
