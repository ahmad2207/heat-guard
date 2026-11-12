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
npm run format       # format the code with Prettier
npm run generate-icons  # regenerate the PWA icons from public/logo.svg
```

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
4. Deploy. Pushes to `main` deploy automatically.

`vercel.json` sends every route to `index.html`, so links such as `/supervisor/plan` work on reload. Real files such as `/sw.js` and the assets are served first.

## Project structure

```
src/
  components/   Shared UI: Button, Card, RiskBadge, RiskCard, ForecastStrip, Switch, tiles, headers, icons
  data/         Sample data (mock.ts) and its types (types.ts)
  dev/          Developer panel and component library, development builds only
  features/
    worker/               Worker screens: consent, health profile, Home and field mode, What to do, Report, My data
    supervisor/           Supervisor screens: Today, Shift plan, Measures
  i18n/         Translations (next phase)
  layouts/      Worker and supervisor page shells
  lib/          Helpers: risk levels, demo clock, speech, online status, battery
  pages/        Not-found page
  router.tsx    Every route, with its page title
  index.css     Tailwind theme tokens and base styles
```

## Design reference

`design-reference/` is the source of truth for the UI. It holds a screenshot of every screen, the exact HTML with sizes, spacing and copy, the original design files with their interactive logic, the design tokens (`TOKENS.md`) and the screen list (`SCREENS.md`). When in doubt about a size, colour or word, check the matching file in `design-reference/html/`. Project rules for working on the code are in `CLAUDE.md`.

## Demo guide

### Role switcher

The home page (`/`) has two buttons: **Worker** and **Supervisor**. There is no login in the prototype.

### Developer panel

In development builds (`npm run dev`) a **Dev** button sits at the bottom right. It does not appear in production. It lets you:

- set the worker's risk level from 1 (Low) to 4 (Critical)
- force field mode on, to see the offline layout while online
- load W-0412's sample health profile answers
- reset onboarding (clears the worker's consent and health profile)
- reset demo data (clears the worker's saved state and resets the panel)

### Precaution levels

In sample mode the levels come from `src/data/mock.ts` and match the backend demo: W-0412 is on High-priority precautions and W-0384 on Enhanced. The worker **Home** and **My data** show W-0412's level. Supervisor **Today** shows only the action for each worker, for example "Worker W-0412 needs reduced exposure today", never the level name or any health reason.

### Field mode on a phone

1. Open the live site in Chrome on Android and choose **Install app** (or **Add to Home screen**).
2. Open HeatGuard from the home screen once, and go to the worker **Status** screen.
3. Turn on airplane mode, close the app and open it again.
4. Status opens in field mode: no connection, "Assume High", the standard heat plan and the saved forecast.
5. Turn airplane mode off: the app returns to the normal Status screen and shows "Back online. Data updated."

## Notes

- All data is sample data from `src/data/mock.ts`. Nothing is sent to a server.
- `src/lib/heat-risk/types.ts` belongs to the risk engine work and is not used by the frontend.
- The language choice is saved but visual only. Translations for Hausa, Yoruba, Igbo and Pidgin are the next phase.
