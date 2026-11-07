import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import App from './App.tsx'
import { SUPERVISOR_HEADER_STATUS } from './data/mock'
import { ConsentScreen } from './features/worker/ConsentScreen'
import { HealthProfileScreen } from './features/worker/HealthProfileScreen'
import { HomeScreen } from './features/worker/HomeScreen'
import { MyDataScreen } from './features/worker/MyDataScreen'
import { PrivacyNoticePage } from './features/worker/PrivacyNoticePage'
import { ReportScreen } from './features/worker/ReportScreen'
import { RequireConsent } from './features/worker/RequireConsent'
import { WhatToDoScreen } from './features/worker/WhatToDoScreen'
import { CasesScreen } from './features/occupational-health/CasesScreen'
import { MeasuresScreen } from './features/supervisor/MeasuresScreen'
import { PlanScreen } from './features/supervisor/PlanScreen'
import { TodayScreen } from './features/supervisor/TodayScreen'
import { OccupationalHealthLayout } from './layouts/OccupationalHealthLayout'
import type { RouteHandle } from './layouts/routeHandle'
import { SupervisorLayout } from './layouts/SupervisorLayout'
import { WorkerLayout } from './layouts/WorkerLayout'
import { NotFoundPage } from './pages/NotFoundPage'

/** Route handle with a page title, and the bottom nav on the worker screens that have it. */
const page = (title: string, extra: RouteHandle = {}): RouteHandle => ({ title, ...extra })

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/components',
        handle: page('Component library'),
        lazy: async () => {
          const { default: Component } = await import('./dev/DevComponentsPage.tsx')
          return { Component }
        },
      },
    ]
  : []

export const router = createBrowserRouter([
  // Role switcher
  { path: '/', element: <App /> },

  // Worker app (screens 1 to 7). Field mode (7) is shown inside /worker.
  {
    path: '/worker',
    element: <WorkerLayout />,
    children: [
      {
        // Home switches to field mode (screen 7) itself. Workers with no saved consent go to
        // the consent screen first.
        index: true,
        // Field mode is part of this route, so it keeps the Status title.
        handle: page('Status', { bottomNav: true }),
        element: (
          <RequireConsent>
            <HomeScreen />
          </RequireConsent>
        ),
      },
      {
        // Placeholder until the full privacy notice is written.
        path: 'privacy',
        handle: page('Privacy notice'),
        element: <PrivacyNoticePage />,
      },
      {
        path: 'welcome',
        handle: page('Consent and choices'),
        element: <ConsentScreen />,
      },
      {
        path: 'health-profile',
        handle: page('Health profile'),
        element: <HealthProfileScreen />,
      },
      {
        path: 'what-to-do',
        handle: page('What to do'),
        element: <WhatToDoScreen />,
      },
      {
        path: 'report',
        handle: page('Report symptoms', { bottomNav: true }),
        element: <ReportScreen />,
      },
      {
        path: 'my-data',
        handle: page('My data and privacy', { bottomNav: true }),
        element: <MyDataScreen />,
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
        handle: page('Today', {
          supervisorHeader: {
            status: SUPERVISOR_HEADER_STATUS.today,
            initials: SUPERVISOR_HEADER_STATUS.initials,
          },
        }),
        element: <TodayScreen />,
      },
      {
        path: 'plan',
        handle: page('Shift plan', {
          supervisorHeader: {
            status: SUPERVISOR_HEADER_STATUS.plan,
            initials: SUPERVISOR_HEADER_STATUS.initials,
          },
        }),
        element: <PlanScreen />,
      },
      {
        path: 'measures',
        // The Measures design shows the header without role, status or account.
        handle: page('Safety and productivity measures', { supervisorHeader: { showRole: false } }),
        element: <MeasuresScreen />,
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
        handle: page('Cases and profiles'),
        element: <CasesScreen />,
      },
    ],
  },

  // Component library, development builds only. In production the URL shows the not-found
  // page, and Vite leaves the page out of the bundle.
  ...devRoutes,

  { path: '*', handle: page('Page not found'), element: <NotFoundPage /> },
])

const APP_NAME = 'HeatGuard AI'

/** Sets the page title from the deepest matching route: "[Screen] · HeatGuard AI". */
function applyTitle(state: typeof router.state) {
  const title = [...state.matches]
    .reverse()
    .map((match) => (match.route.handle as RouteHandle | undefined)?.title)
    .find(Boolean)
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
}
applyTitle(router.state)
router.subscribe(applyTitle)
