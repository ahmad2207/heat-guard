import { createBrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { SUPERVISOR_HEADER_STATUS } from './data/mock'
import { HomeScreen } from './features/worker/HomeScreen'
import { WhatToDoScreen } from './features/worker/WhatToDoScreen'
import { OccupationalHealthLayout } from './layouts/OccupationalHealthLayout'
import type { RouteHandle } from './layouts/routeHandle'
import { SupervisorLayout } from './layouts/SupervisorLayout'
import { WorkerLayout } from './layouts/WorkerLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { ScreenPlaceholder } from './pages/ScreenPlaceholder'

const withBottomNav: RouteHandle = { bottomNav: true }

export const router = createBrowserRouter([
  // Role switcher
  { path: '/', element: <App /> },

  // Worker app (screens 1 to 7). Field mode (7) is shown inside /worker.
  {
    path: '/worker',
    element: <WorkerLayout />,
    children: [
      {
        // Field mode (screen 7) will switch this layout in Phase 4.
        index: true,
        handle: withBottomNav,
        element: <HomeScreen />,
      },
      {
        path: 'welcome',
        element: (
          <ScreenPlaceholder
            number="1"
            name="Consent and choices"
            route="/worker/welcome"
            references={['01-consent.png']}
            phase={5}
          />
        ),
      },
      {
        path: 'health-profile',
        element: (
          <ScreenPlaceholder
            number="2"
            name="Health profile"
            route="/worker/health-profile"
            references={['02-health-profile.png']}
            phase={5}
          />
        ),
      },
      {
        path: 'what-to-do',
        element: <WhatToDoScreen />,
      },
      {
        path: 'report',
        handle: withBottomNav,
        element: (
          <ScreenPlaceholder
            number="5"
            name="Report symptoms"
            route="/worker/report"
            references={['05-report-symptoms.png']}
            phase={4}
          />
        ),
      },
      {
        path: 'my-data',
        handle: withBottomNav,
        element: (
          <ScreenPlaceholder
            number="6"
            name="My data and privacy"
            route="/worker/my-data"
            references={['06-my-data.png']}
            phase={5}
          />
        ),
      },
    ],
  },

  // Supervisor (screens 8 to 10)
  {
    path: '/supervisor',
    element: <SupervisorLayout />,
    children: [
      {
        index: true,
        handle: {
          supervisorHeader: {
            status: SUPERVISOR_HEADER_STATUS.today,
            initials: SUPERVISOR_HEADER_STATUS.initials,
          },
        } satisfies RouteHandle,
        element: (
          <ScreenPlaceholder
            variant="page"
            number="8"
            name="Today"
            route="/supervisor"
            references={['08-supervisor-today.png', '08-supervisor-today-phone-width.png']}
            phase={6}
          />
        ),
      },
      {
        path: 'plan',
        handle: {
          supervisorHeader: {
            status: SUPERVISOR_HEADER_STATUS.plan,
            initials: SUPERVISOR_HEADER_STATUS.initials,
          },
        } satisfies RouteHandle,
        element: (
          <ScreenPlaceholder
            variant="page"
            number="9"
            name="Shift plan"
            route="/supervisor/plan"
            references={[
              '09-supervisor-plan.png',
              '09b-supervisor-plan-suggested.png',
              '09-supervisor-plan-phone-width.png',
            ]}
            phase={7}
          />
        ),
      },
      {
        path: 'measures',
        // The Measures design shows the header without role, status or account.
        handle: { supervisorHeader: { showRole: false } } satisfies RouteHandle,
        element: (
          <ScreenPlaceholder
            variant="page"
            number="10"
            name="Measures"
            route="/supervisor/measures"
            references={['10-supervisor-measures.png', '10-supervisor-measures-phone-width.png']}
            phase={7}
          />
        ),
      },
    ],
  },

  // Occupational health (screen 11)
  {
    path: '/occupational-health',
    element: <OccupationalHealthLayout />,
    children: [
      {
        index: true,
        element: (
          <ScreenPlaceholder
            variant="page"
            number="11"
            name="Cases and profiles"
            route="/occupational-health"
            references={['11-occupational-health.png', '11-occupational-health-phone-width.png']}
            phase={8}
          />
        ),
      },
    ],
  },

  {
    // Temporary component library. Loaded on demand so it stays out of the main bundle.
    // Phase 9 removes it from production builds.
    path: '/dev/components',
    lazy: async () => {
      const { default: Component } = await import('./dev/DevComponentsPage.tsx')
      return { Component }
    },
  },

  { path: '*', element: <NotFoundPage /> },
])
