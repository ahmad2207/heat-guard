# HeatGuard AI

HeatGuard AI is a heat-risk warning and decision support app for outdoor workers, built for Population Health Challenge 07. Workers see their heat risk, what to do about it and how to report symptoms, even without a connection. Supervisors plan shifts and breaks around the heat. Health answers stay private: supervisors only ever see risk levels and actions, never health reasons.

Live site: https://heat-guard-nine.vercel.app

## Stack

- React 19 and TypeScript (strict mode)
- Vite
- Tailwind CSS v4, with the design tokens in `src/index.css`
- React Router
- vite-plugin-pwa (offline support and install as an app)
- Public Sans for text and IBM Plex Mono for numbers, both self-hosted so they work offline

## Getting started

You need Node.js 20 or newer and npm 10 or newer.

```bash
npm install          # install dependencies
npm run dev          # development server (includes the dev panel)
npm run build        # type-check and build into dist/
npm run preview      # serve the production build locally
npm run lint         # check the code with ESLint
npm test             # run the unit tests (Vitest)
npm run format       # format the code with Prettier
npm run generate-icons  # regenerate the PWA icons from public/logo.svg
npm run generate-api-types  # regenerate src/api/schema.d.ts from docs/backend/openapi.json
```

### Environment

Copy `.env.example` to `.env.local` (`.env` and `.env.local` are not committed).

| Variable           | Value                              | Meaning                                                                                  |
| ------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | `https://health-heat.onrender.com` | Backend host only. Routes are under `/api/v1`                                            |
| `VITE_DATA_SOURCE` | `mock` or `api`                    | Sample data or the backend. If empty: `api` when `VITE_API_URL` is set, otherwise `mock` |

With `mock`, the app runs on the sample data in `src/data/mock.ts` and the demo clock (10:32). With `api`, data comes from the backend, times use the device clock shown in the site timezone, and requests wait up to 90 seconds.

**Waking up.** The backend runs on a free Render plan that sleeps when nobody uses it. The first request after a quiet spell can take up to a minute: after 3 seconds every loading screen shows "Waking up the server..." and "This can take a minute or two." Requests give up after 90 seconds with a Try again button. Open the app once a few minutes before a demo.

**Switching to sample data.** Set `VITE_DATA_SOURCE=mock` in `.env.local` (or delete `.env.local`) and restart `npm run dev`. Sample mode has no login: `/` shows the role switcher. On Vercel, change `VITE_DATA_SOURCE` in the project settings and redeploy.

The service worker is off in development. To test it in development, set `DEV_PWA=true`:

```bash
DEV_PWA=true npm run dev            # macOS and Linux
$env:DEV_PWA="true"; npm run dev    # Windows PowerShell
```

`npm run generate-icons` reads `pwa-assets.config.ts` and writes the app icons, the Apple touch icon and the favicon into `public/`. Run it after changing `public/logo.svg`.

## Deploying on Vercel

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New Project** and import the repository.
3. Vercel detects Vite: build command `npm run build`, output directory `dist`.
4. Under **Settings > Environment Variables**, set `VITE_API_URL` and `VITE_DATA_SOURCE` (see Environment above). Vite reads them at build time, so redeploy after changing them.
5. Deploy. Pushes to `main` deploy automatically.

`vercel.json` sends every route to `index.html`, so links such as `/supervisor/plan` work on reload. Real files such as `/sw.js` and the assets are served first.

## Project structure

```
src/
  api/          Backend access: client.ts (the only module that calls fetch), auth, worker, supervisor,
                outbox (offline queue), converters/ (backend codes to app types), schema.d.ts (generated)
  components/   Shared UI: Button, Card, RiskBadge, RiskCard, ForecastStrip, Switch, tiles, headers, icons
  data/         Sample data (mock.ts) and its types (types.ts)
  dev/          Developer panel and component library, development builds only
  features/
    worker/               Worker screens: consent, health profile, Home and field mode, What to do, Report, My data
    supervisor/           Supervisor screens: Today, Shift plan, Measures
  i18n/         Translations (next phase)
  layouts/      Worker and supervisor page shells
  lib/          Helpers: risk levels, clock, time formatting, speech, online status, battery
  pages/        Not-found page
  router.tsx    Every route, with its page title
  index.css     Tailwind theme tokens and base styles
```

## Design reference

`design-reference/` is the source of truth for the UI. It holds a screenshot of every screen, the exact HTML with sizes, spacing and copy, the original design files with their interactive logic, the design tokens (`TOKENS.md`) and the screen list (`SCREENS.md`). When in doubt about a size, colour or word, check the matching file in `design-reference/html/`. Project rules for working on the code are in `CLAUDE.md`.

## Demo guide

The step-by-step demo is in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md). Decisions agreed with the backend team (wording, codes, privacy rules) are in [docs/backend/DECISIONS.md](docs/backend/DECISIONS.md).

### Signing in (api mode)

`/` goes to **Sign in**. Use a worker or staff ID and the PIN. Every demo account has PIN **1234**.

| ID     | Role       | Use it for                                                                                       |
| ------ | ---------- | ------------------------------------------------------------------------------------------------ |
| S-001  | Supervisor | Today, Shift plan and Measures                                                                   |
| W-0412 | Worker     | High-priority precautions: the precaution card, and "needs reduced exposure" on supervisor Today |
| W-0384 | Worker     | Enhanced precautions: "needs earlier breaks" on supervisor Today                                 |
| W-0302 | Worker     | A fresh account that opens on the consent screen (first run)                                     |

Workers go to their Status screen and supervisors to Today. Sign out is at the bottom of **My data** for workers and in the account button (top right) for supervisors. A wrong ID or PIN, or a locked account, shows "Invalid ID or PIN". With no connection the message says so instead.

A worker who has signed in once keeps field mode offline, even when the session has expired. Taps made offline ("+ Cup", "I understand", alerts, symptom reports and the shift buttons) are queued and sent in order when the phone is back online.

### Role switcher (sample mode)

In sample mode the home page (`/`) has two buttons, **Worker** and **Supervisor**, and there is no login.

### Developer panel

In development builds (`npm run dev`) a **Dev** button sits at the bottom right. It does not appear in production. It only changes sample data; in api mode the real data comes from the backend. It lets you:

- set the worker's risk level from 1 (Low) to 4 (Critical)
- force field mode on, to see the offline layout while online
- load W-0412's sample health profile answers
- reset onboarding (clears the worker's consent and health profile)
- reset demo data (clears the worker's saved state and resets the panel)

### Precaution levels

In api mode the worker's level comes from the backend (`GET /me`). A worker with no health profile sees no precaution card. In sample mode the levels come from `src/data/mock.ts` and match the backend demo: W-0412 is on High-priority precautions and W-0384 on Enhanced. Supervisor **Today** shows only the action for each worker, for example "Worker W-0412 needs reduced exposure today", never the level name or any health reason.

### Field mode on a phone

1. Open the live site in Chrome on Android and choose **Install app** (or **Add to Home screen**).
2. Open HeatGuard from the home screen, sign in as a worker (api mode) and wait for the **Status** screen to load once, so the forecast is saved on the phone.
3. Turn on airplane mode, close the app and open it again.
4. Status opens in field mode: no connection, "Assume High", the last known level, the standard heat plan and the saved forecast.
5. Turn airplane mode off: the app returns to the normal Status screen and shows "Back online. Data updated."

### Still to come

These are not built yet, by agreement with the backend team:

- Push notifications (sending a plan marks it as sent but notifies no one yet)
- SMS alerts
- The engine's "possible" level and forecast confidence (shown automatically once the backend sends them)
- Pidgin advice and the translations for Hausa, Yoruba, Igbo and Pidgin
- An incident log (Measures shows "not tracked yet")
- The wristband (Bluetooth band pairing and readings)

## Notes

- In api mode every screen uses the backend. Sample data is used only when `VITE_DATA_SOURCE=mock`.
- `src/lib/heat-risk/types.ts` belongs to the risk engine work and is not used by the frontend.
- The language choice is saved but visual only. Translations for Hausa, Yoruba, Igbo and Pidgin are the next phase.
