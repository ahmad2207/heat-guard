# HeatGuard frontend: Claude Code prompts

This pack works on an existing project: Phase 0 audits what you already have, and every later phase restyles and extends existing code before creating anything new. Paste one phase at a time. Wait for Claude Code to stop, check the result against the screenshots in `design-reference/screens/`, then paste the next phase. Phase 0 saves the project rules in `CLAUDE.md`, so later phases stay short.

---

## Phase 0: Audit the existing project against the design (no code)

```
You are working on HeatGuard AI, a heat-risk warning app for outdoor workers. This is an EXISTING project with screens, components and logic already built and deployed on Vercel. The goal is to bring it in line with the new design, not to start again.

The folder design-reference/ is the source of truth for the UI. Read design-reference/README.md, TOKENS.md and SCREENS.md fully. Look at every image in design-reference/screens/ and skim the matching files in design-reference/html/.

Then do two things:

1. Create CLAUDE.md in the repo root (or add to it if it exists, keeping what is there) with these project rules:
   - This is an existing project. Reuse and restyle existing routes, components, state and logic wherever possible. Extend instead of rewriting.
   - Never delete or rename an existing feature, route, file or dependency that is not in the design without asking me first.
   - Match design-reference/ for layout, spacing, colours, type and wording. When unsure, open the matching file in design-reference/html/ for exact values.
   - Use Tailwind theme tokens from TOKENS.md. No raw hex codes in components.
   - Keep any existing data fetching or backend calls working. Where the design needs data the project does not have yet, add it to src/data/mock.ts and mark it as sample data.
   - Accessibility: real buttons, links, inputs and labels; touch targets at least 44px; aria-label on icon-only buttons; risk levels always show number, name and colour.
   - Never use em dashes in UI copy, comments, docs or commit messages.
   - Work one phase at a time. Show me the diffs, run the build, then stop and wait for my review. Do not refactor code outside the current phase without asking.
   - Do not commit until I approve.

2. Audit the codebase and give me a report with:
   - The stack, folder structure, routing, state management, styling approach, PWA setup and theme colour as they are now.
   - A table with one row per screen in SCREENS.md: what exists today (file and route, or "missing"), how close it is to the design (matches, needs restyle, partly built, missing), and what needs to change.
   - Existing features, screens or components that are NOT in the design, so I can decide whether to keep them.
   - Anything in the existing code that conflicts with the design or the rules above.
   - A revised order for Phases 1 to 9 in design-reference/BUILD-PROMPTS.md if the existing project makes a different order safer, and which phases can be skipped or shortened.

Do not change any app code yet. STOP and wait for my review.
```

---

## Phase 1: Design tokens, fonts and shared components

```
Follow CLAUDE.md. Phase 1: foundations.

1. Install @fontsource/public-sans (400, 500, 600, 700, 800) and @fontsource/ibm-plex-mono (500, 600). Set Public Sans as the default font and IBM Plex Mono as the mono font.
2. Add every colour in TOKENS.md to the Tailwind theme with the token names given, plus the four risk levels as risk-1 to risk-4 with matching text colours.
3. Change the PWA theme colour and meta theme-color from #ea580c to #E8742A, and set the background colour to #EEF1F3.
4. Create src/lib/risk.ts with a RiskLevel type (1 to 4), names (Low, Elevated, High, Critical) and a helper that returns the background and text token for a level.
5. Build the shared components listed at the bottom of SCREENS.md in src/components/. Match their look in the screenshots.
6. Add a temporary route /dev/components that shows every component in every state, so I can check them on my phone.

Run the build. Show me the files changed. STOP for review.
```

---

## Phase 2: Mock data, routing and role switcher

```
Follow CLAUDE.md. Phase 2: data and navigation.

1. Create src/data/mock.ts with typed sample data taken from the design reference: the worker (W-0412, Crew C), current risk level, data sources, next break, water count, reasons, 6-hour forecast, hazards, crews, site heat by hour, workers by level, alerts, actions, shift plans (copy the plans and the "too hot" rule from design-reference/source/Planner.dc.html), measures, OH cases and profiles. Keep all numbers exactly as shown on the screens.
2. Install react-router-dom if it is not there. Add every route from SCREENS.md with an empty placeholder page that shows the screen name.
3. Build the role switcher on / with three large buttons: Worker, Supervisor, Occupational health.
4. Build the worker layout: centred column about 430px wide on large screens, full width on phones, with WorkerBottomNav (Status, Report, My data) on the three main worker screens.
5. Build the supervisor layout with SupervisorHeader and the Today, Plan, Measures tabs, and the occupational health layout with its navy header and Confidential badge.
6. Add a small dev panel (only in development builds) to change the worker risk level and force field mode.

Run the build. STOP for review.
```

---

## Phase 3: Worker Home and What to do

```
Follow CLAUDE.md. Phase 3: build screens 3 and 4 from SCREENS.md.

Match design-reference/screens/03-home.png, 03b-home-critical.png and 04-what-to-do.png exactly, using the html/ files for exact values.

- Home: data source chips, RiskCard driven by the current level (all four levels must look right; check with the dev panel), Listen button, next break, water tracker where "+ Cup" adds one, Why chips, 6-hour ForecastStrip with confidence, other hazards, "See what to do" link.
- What to do: back link, level banner, action list, why it matters, when, who, and the "I understand, starting now" button that switches to a confirmed state. "I feel unwell" links to the report screen.
- Listen buttons can use the browser's speechSynthesis to read the main text aloud.

Test at 360px and 390px wide. Run the build. STOP for review.
```

---

## Phase 4: Report symptoms and Field mode

```
Follow CLAUDE.md. Phase 4: screens 5 and 7.

- Report symptoms: match 05-report-symptoms.png. Emergency block first, with the call button as a tel: link to a placeholder number in mock.ts. Symptom tiles as real checkboxes with the selected style. Optional note. The send button shows how many are ticked and then switches to the confirmation state.
- Field mode: match 07-field-mode.png. Home shows this layout when navigator.onLine is false (listen to online and offline events) or when the dev panel forces it. Include the connection, band and battery rows, "Try to reconnect", the "Assume High" safety card, the standard heat plan and the saved forecast with dashed outlines.

Test field mode by turning on airplane mode on the phone after the app has loaded once. Run the build. STOP for review.
```

---

## Phase 5: Consent, Health profile and My data

```
Follow CLAUDE.md. Phase 5: screens 1, 2 and 6.

- Consent: match 01-consent.png. Language select, Work details "Always on", three working switches, promise box, "Agree and continue" goes to the health profile.
- Health profile: match 02-health-profile.png (it is one long scrolling page). Multi-select and single-choice tiles as real checkboxes and radio buttons. "None of these" clears the other options in its section, and picking another option clears "None of these". Precautions section is read-only. Send shows the success state and a link to Status.
- My data: match 06-my-data.png. The sharing switches share state with the consent screen (use one small React context or store). "Health profile" links to screen 2.

Save the consent choices and health answers in localStorage so they survive a reload. Run the build. STOP for review.
```

---

## Phase 6: Supervisor Today

```
Follow CLAUDE.md. Phase 6: screen 8.

Match 08-supervisor-today.png on desktop and 08-supervisor-today-phone-width.png on a phone. Build every section in order: title and filters, site heat now with the hour strip (current hour outlined), workers by risk level with the stacked bar, other climate hazards, system health, needs attention, actions today, today so far, crews table (scrolls sideways inside its card on phones), last 7 days bars, privacy footer.

Filters can be visual only for now. Run the build. STOP for review.
```

---

## Phase 7: Shift plan and Measures

```
Follow CLAUDE.md. Phase 7: screens 9 and 10.

- Shift plan: match 09-supervisor-plan.png and 09b-supervisor-plan-suggested.png. The Current and Suggested toggle switches the timeline, and the summary cards recalculate from the data using the rule in design-reference/source/Planner.dc.html: a cell is too hot when heavy work falls at level 3 or above, or moderate work at level 4. "Use suggested plan" switches to the suggested plan and shows the sent state. The timeline scrolls sideways on phones.
- Measures: match 10-supervisor-measures.png, including the Sample data badge and both bar charts built with plain divs.

Run the build. STOP for review.
```

---

## Phase 8: Occupational health

```
Follow CLAUDE.md. Phase 8: screen 11.

Match 11-occupational-health.png. Navy header with the Confidential badge, escalation card with clinical note and outcome buttons, profiles to review list, and the profile panel. The precaution level radio options must update the work restrictions and both previews (supervisor and worker) live, exactly as in design-reference/source/OccHealth.dc.html. Save shows the confirmation.

Run the build. STOP for review.
```

---

## Phase 9: Polish, accessibility and release

```
Follow CLAUDE.md. Phase 9: final pass.

1. Compare every screen against its screenshot side by side and list any differences, then fix them.
2. Check every page at 360px, 390px, 768px and 1440px. Nothing should scroll sideways except the tables and timeline inside their own boxes.
3. Accessibility check: keyboard focus visible and in a sensible order, every control labelled, contrast at least 4.5:1, touch targets at least 44px.
4. Confirm the PWA still installs and the worker app shell opens offline.
5. Remove the /dev/components route from production builds (keep it in development).
6. Search the whole codebase for em dashes and replace any you find.

Give me a summary of what changed and anything I should test on my phone. STOP for review before committing.
```
