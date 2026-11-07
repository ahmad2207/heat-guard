# HeatGuard AI

HeatGuard AI is a heat-risk warning and decision support app for outdoor workers, built for Population Health Challenge 07. Workers see their heat risk, what to do about it and how to report symptoms, even without a connection. Supervisors plan shifts and breaks around the heat, and occupational health sets personal precautions. Health details stay with occupational health: supervisors only ever see risk levels and actions.

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
    occupational-health/  Cases and profiles, plus the shared precaution levels and escalation outcomes
  i18n/         Translations (next phase)
  layouts/      Worker, supervisor and occupational health page shells
  lib/          Helpers: risk levels, demo clock, speech, online status, battery
  pages/        Not-found page
  router.tsx    Every route, with its page title
  index.css     Tailwind theme tokens and base styles
```

## Design reference

`design-reference/` is the source of truth for the UI. It holds a screenshot of every screen, the exact HTML with sizes, spacing and copy, the original design files with their interactive logic, the design tokens (`TOKENS.md`) and the screen list (`SCREENS.md`). When in doubt about a size, colour or word, check the matching file in `design-reference/html/`. Project rules for working on the code are in `CLAUDE.md`.

## Demo guide

### Role switcher

The home page (`/`) has three buttons: **Worker**, **Supervisor** and **Occupational health**. There is no login in the prototype.

### Developer panel

In development builds (`npm run dev`) a **Dev** button sits at the bottom right. It does not appear in production. It lets you:

- set the worker's risk level from 1 (Low) to 4 (Critical)
- force field mode on, to see the offline layout while online
- load W-0412's sample health profile answers
- reset onboarding (clears the worker's consent and health profile)
- reset demo data (clears everything saved across all three roles, and resets the panel)

### Cross-role demo

The three roles share saved demo state in the browser:

1. Open **Occupational health**, change W-0412's precaution level (for example to Standard) and press **Save and notify worker**.
2. Open the worker **Home**: the "Extra precautions on your profile" reason shows only on Enhanced or High-priority.
3. Open **My data**: it shows the new level and the date it was set.
4. Open supervisor **Today**: the alert for W-0412 follows the new level (none on Standard), without any health reasons.
5. Back in occupational health, choose an outcome for W-0388 (for example **Refer to clinic**). Supervisor **Today** then shows "Occupational health: Referred to clinic" on the W-0388 card, and never the symptoms or the clinical note.

If the worker sends health profile answers in the same browser, occupational health sees them as categories in "What you record".

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
