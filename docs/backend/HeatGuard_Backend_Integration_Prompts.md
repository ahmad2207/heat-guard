# HeatGuard AI: connecting the frontend to the backend

Phased Claude Code prompts for the work in "Connecting the app to the backend" (12 November 2026) and FRONTEND_BACKEND_GAPS.md.

## Before you start

1. In the repo, create a folder `docs/backend/` and put these files in it:
   - `HeatGuard_Frontend_To-Do.pdf` (the backend team's to-do: this is the main brief)
   - `FRONTEND_BACKEND_GAPS.md` (the detailed status and decisions D1 to D8)
   - `FRONTEND_TASKS.md` only if the backend team sends it. It is optional: Phase 0 gets the exact field names from the live API docs instead.
2. Get the backend URL from the backend team (the Render address). Replace `[API_URL]` in Phase 0 with it.
3. Paste one phase at a time into Claude Code. Each phase stops for your review. Bring the report back if you want a second opinion before approving.

**Status, 12 November 2026.** The phases were run in this order: wording and occupational health removal (Phase 3 below), then the API client (Phase 1 below). Both are done. Next: login (Phase 2), worker profile (4), worker live screens (5), shift buttons (6), supervisor pages (8), hardening (9), wristband (7, optional). The backend team's answers (`HeatGuard_Answers_For_Frontend.pdf`) are recorded in `DECISIONS.md`; the phases below were updated to match them.

## Where each part of the to-do is handled

| To-do section                                                                                             | Phase                  |
| --------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1. Set-up (API address, one module, token, errors, codes and UTC times, device clock, slow first request) | 1                      |
| 2. Login (ID and PIN, tokens, "Invalid ID or PIN", GET /me, role routing)                                 | 2                      |
| 3. Worker screens (consent, health profile, home, what to do, report, my data, field mode)                | 4 and 5                |
| 4. Start shift and break buttons, "still here" signal                                                     | 6                      |
| 4. Wristband (optional) and the simulator                                                                 | 7                      |
| 5. Supervisor pages (Today, needs attention buttons, shift plan, measures)                                | 8                      |
| 6. Three wording changes for privacy (D1, D4, D5)                                                         | 3                      |
| 7. No occupational health (wording, hide "Request a review", remove the route)                            | 3                      |
| 8. Things that switch on later (possible level, confidence, Pidgin advice)                                | 5 (shown when present) |
| 9. Before the demo (allowed addresses, demo logins)                                                       | 9                      |

## Decisions already built into these prompts

| Topic                         | Decision                                                                                                                                  | Why                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Sample data                   | Keep it behind a switch: `VITE_DATA_SOURCE=api` or `mock`. Production uses `api`                                                          | The demo still works if Render is down, and screens can be developed without the backend |
| Occupational health           | Remove the route and the role switcher entry now. Keep the code folder unused until the team confirms it can be deleted                   | The handout says do not build it; deleting a whole feature needs a team yes              |
| Getting used to the heat (D4) | Keep the question where it is, but mark it "Shared with your work record" and change the privacy wording                                  | Simplest honest fix: the answer now feeds the risk engine                                |
| Tokens                        | Access token in memory, refresh token in localStorage, cleared on sign out                                                                | Acceptable for a prototype; note it for a security review before any pilot               |
| Offline and login             | An expired token while offline never blocks field mode. Button presses made offline are queued and sent after the next successful refresh | Fail safe, not silent                                                                    |
| Too-hot rule                  | The backend owns it. The plan editor may preview locally, but the numbers shown after saving come from the backend                        | "Rules decide" on the server                                                             |
| Role switcher                 | Development builds only                                                                                                                   | Login replaces it                                                                        |
| Backend answers               | Every later phase follows `docs/backend/DECISIONS.md` (wording, codes, needs attention buttons, policy version)                           | Agreed with the backend team, 12 November 2026                                           |
| Worker IDs                    | Screens show the worker code (W-0388). The UUID `workerId` is only used in API paths                                                      | Answers, DECISIONS.md                                                                    |

---

## Phase 0: Read the backend docs and plan (no code)

```
We are now connecting the HeatGuard frontend to the real backend. Follow CLAUDE.md.

Read fully:
- docs/backend/HeatGuard_Frontend_To-Do.pdf (the backend team's to-do; this is the main brief)
- docs/backend/FRONTEND_BACKEND_GAPS.md (status and decisions D1 to D8)
- docs/backend/FRONTEND_TASKS.md if it exists (optional)
- The live API docs at [API_URL]/docs. This is the source for exact field names and response shapes. If an OpenAPI JSON file is linked from that page, download it and save it to docs/backend/openapi.json. If you cannot reach it, tell me and list the endpoints whose shapes you still need. The first request may take up to 2 minutes while the server wakes up.

Then do three things:

1. Add a section "Backend integration" to CLAUDE.md with these rules:
   - All backend calls go through one module in src/api/. Components never call fetch directly.
   - The backend sends codes, IDs and UTC times. Convert them into the app's own types in small converter functions in src/api/converters/, and format words and times in the site's timezone in the UI. Never show raw codes to users.
   - Keep sample data working behind VITE_DATA_SOURCE=mock. Production uses api.
   - Every screen that loads data has loading, error and empty states. Requests wait up to 90 seconds; after 3 seconds show "Waking up the server...".
   - Never send health details anywhere the spec does not allow. Supervisors never receive or display health status (decision D1).
   - Field mode must keep working offline and with an expired token.

2. Write me a report:
   - A table mapping every section of the to-do and every screen to its backend calls, which existing types and mock fields each call replaces, and anything in the spec that does not match the current UI.
   - Every wording change required (sections 6 and 7 of the To-Do), with the file it lives in.
   - Everything the occupational health removal touches: route, role switcher, stores, cross-role demo state, and any worker or supervisor screen that reads them.
   - Anything unclear or contradictory in the backend docs, as questions I can send to the backend team.
   - A check of whether the backend is reachable from localhost:5173 (CORS), using GET [API_URL]/health or the nearest equivalent.

3. Confirm the phase order below still makes sense, or propose changes:
   1 API client and data switch, 2 login and session, 3 wording and occupational health removal, 4 worker profile screens, 5 worker live screens and field mode, 6 shift buttons and heartbeat, 7 wristband (optional), 8 supervisor pages, 9 hardening and demo readiness.

Do not change any app code yet. Only update CLAUDE.md and save openapi.json if available. STOP for review.
```

---

## Phase 1: API client, data switch and formatting

```
Follow CLAUDE.md. Phase 1: foundations for real data. No screen changes yet.

1. Environment
   - Add VITE_API_URL and VITE_DATA_SOURCE (api or mock) with a .env.example. Default to mock in development if VITE_API_URL is empty.
   - Add both to the README, and tell me exactly what to set in the Vercel project settings (I will do that myself).

2. API client in src/api/client.ts
   - One function for all calls: base URL, JSON, the access token header, a 90 second timeout, and a "slow" signal after 3 seconds so screens can show "Waking up the server...".
   - On 401: try POST /auth/refresh once with the refresh token, retry the call, and if that fails clear the session and send the person to /login.
   - On 403 and other errors: return a typed error with a readable message the UI can show.
   - Never log tokens or health data to the console.

3. Data switch
   - A thin data layer (for example src/api/data.ts) that each screen will use, which returns either the API result (converted) or the existing mock data, based on VITE_DATA_SOURCE. Do not wire any screen to it yet.

4. Converters and formatting
   - src/api/converters/ with typed converters for the codes in the spec: languages (en, ha, yo, ig, pcm), precaution levels (standard, enhanced, high_priority), age ranges, crew IDs and names, risk levels, action codes.
   - src/lib/format.ts: format UTC times in the site's timezone (taken from the backend's site data when available), and relative times like "in 12 min".
   - Replace the demo clock in src/lib/clock.ts with the device clock in api mode. Keep the demo clock in mock mode.

5. A shared loading pattern
   - A small hook (for example useApiData) that gives loading, slow, error and data states, and a reusable "Waking up the server..." and error message component in the design style.

Add unit-level checks for the converters if a test runner is already set up; if not, tell me what you would add. Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 2: Login and session

```
Follow CLAUDE.md. Phase 2: login.

1. Login screen at /login, in the HeatGuard design style (tokens, fonts, 44px targets):
   - Logo and name, heading "Sign in".
   - Two labelled fields: "Worker or staff ID" (for example W-0412 or S-001) and "PIN" (4 to 6 digits, numeric keyboard, masked, with a show/hide button).
   - "Sign in" button with a loading state and the "Waking up the server..." message after 3 seconds.
   - Any failure shows exactly "Invalid ID or PIN". Do not reveal lockouts.
   - Works at 360px, keyboard friendly, focus moves to the error message.

2. Session
   - POST /auth/login. Keep the access token in memory and the refresh token in localStorage (wrapped in try/catch).
   - After login, GET /me, store the person in a session context, and route by role (`user.role`): workers to /worker, supervisors to /supervisor. GET /me is documented in the spec (`MeResponse` in src/api/types/responses.ts): `user`, `worker` (null for supervisors), `site`, `assignment`, `consents`, `precaution`. Supervisors get `site: null`, so load their site with GET /sites.
   - On app start, if a refresh token exists, refresh silently and load /me before showing protected screens.
   - Sign out clears both tokens and all cached personal data, then goes to /login. Add a "Sign out" control to My data for workers and to the account button menu for supervisors.

3. Route guards
   - Worker routes need a worker session; supervisor routes need a supervisor session. A wrong role goes to that person's own home with no error page.
   - /worker/report stays reachable for a signed-in worker even without consent.
   - Offline with an expired token: a worker who was signed in keeps field mode and cached data. Do not send them to /login while offline.

4. Role switcher
   - In api mode the home route / goes to /login or the person's home. Keep the role switcher only in development builds and in mock mode.

Test with S-001 and W-0412, PIN 1234, and a wrong PIN. Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 3: Wording changes and occupational health removal

```
Follow CLAUDE.md. Phase 3: wording and occupational health removal. These changes apply in both api and mock mode.

1. Privacy decisions
   - D1, supervisor Today: the worker care card shows only the action, for example "Worker W-0412 needs reduced exposure today". Remove the level name ("High-priority precautions") and the word "precautions" from every supervisor screen, including the Shift plan card "Workers needing reduced exposure". Scan all supervisor UI text for health words afterwards and report the result.
   - D4, health profile "Getting used to the heat": keep the question in place, add a visible tag "Shared with your work record", and add the line "This answer helps plan your breaks and is part of your work record." Update the page's privacy banner so it no longer promises that supervisors never see any answer: "Your health answers stay private and are never shown to your supervisor. Your answer about getting used to the heat is part of your work record."
   - D5, Report symptoms after sending: if symptom sharing is off, show "Your supervisor and first aider were alerted. No symptom details were kept."

2. No occupational health: apply every wording change in section 7 of docs/backend/HeatGuard_Frontend_To-Do.pdf exactly, including:
   - Consent: "Lets HeatGuard give you extra care based on your health answers" and "Share symptom details: kept private; your supervisor only sees that you need help".
   - Health profile: remove every nurse promise; button "Save my answers"; hide "Request a review".
   - My data: hide "Request a review"; "Set on [date]" instead of "Set by occupational health".
   - Report: "Details stay private; your supervisor only sees that you need help."
   - Supervisor help card: "First aider notified"; remove the escalation outcome line. "I am on my way" and "Mark resolved" still work.

3. Remove occupational health from the app
   - Remove the /occupational-health route and its role switcher button. Unknown URLs still show the not-found page.
   - Remove the cross-role demo stores and the escalation outcome from worker and supervisor screens. In mock mode, precaution levels come from mock.ts only (W-0412 high_priority, W-0384 enhanced).
   - Remove the related dev panel buttons that no longer apply.
   - Do NOT delete src/features/occupational-health/. Leave it unused and list it for deletion later.

Run build and lint, show me the diffs with a list of every text change (old and new), and STOP for review. Do not commit.
```

---

## Phase 4: Worker profile screens on real data

```
Follow CLAUDE.md. Phase 4: consent, health profile and My data on the backend. Use the data switch so mock mode still works.

- Consent and first run: language and the three switches are saved with PATCH /me/preferences and PUT /me/consents, always with `policyVersion` set to CONSENT_POLICY_VERSION ("2026-11-v1", src/api/constants.ts). GET /me `consents` holds the current switches as true or false only, so check GET /workers/:id/consents (the consent history) to tell "never chosen" from "chose off": if the worker has never chosen, show /worker/welcome. Replace the localStorage version in api mode. `:id` is `worker.id` from /me (a UUID).
- Health profile: load and save with GET and PUT /workers/:id/health-profile using the backend codes. To clear a saved age range, send `ageRange: null`. A save without health consent returns 409: show "Turn on health sharing in My data to save your answers." with a link to My data. Precautions come from GET /me `precaution` (`level`, `setOn`, `restrictions`, `nextReviewOn`), not from the health profile. `null` means the worker has no health profile: show no precaution card on Home, Health profile or My data (not "Standard"). `setOn` shows as "Set on [date]". Ignore `reviewRequested`; "Request a review" stays hidden.
- My data: switches use the server; "Who looked at your data" uses GET /me/access-log, with roles in plain words: `occupational_health` shows "Occupational health viewed your health profile", unknown roles show "Someone at your site viewed your data", never the raw role. Download uses GET /workers/:id/data-export and saves the file. Delete uses DELETE /workers/:id/health-profile with the existing two-step confirmation; it does not withdraw consent, and the confirmation already says so. Read aloud stays a preference.
- Show loading, slow and error states on each screen.

Test with W-0412 and W-0384 (PIN 1234): change a switch, reload, sign out and in again, and confirm it persisted. Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 5: Home, What to do, Report and field mode on real data

```
Follow CLAUDE.md. Phase 5: the live worker screens.

- Home: risk level, action, reasons, next break, 6-hour forecast, hazards and data sources from GET /me/risk; water count from GET /me/water and "+ Cup" with POST /me/water.
  - Reasons are engine text already in the worker's language: show them as received, as chips.
  - Next break: `nextBreak.minutesUntil` and `durationMinutes`, with the fixed place "shaded rest area" (the backend has no break place).
  - Hazards: `{ type: "dust", severity: "moderate" | "high" }` and `{ type: "thunderstorm", severity: "possible" }` with `from` and `to`, mapped to the existing hazard rows and pills.
  - Data sources: `dataSources.weather` is `{ ok, at }`; `siteSensor` and `wearable` are null when there is none.
  - dataQuality "degraded": show a small "No fresh heat data" note.
  - source "fallback": the level is at least High by design; show it normally.
  - Fields the engine does not send yet (possible level, confidence): hide them when empty, show them when present.
  - Refresh the risk every 5 minutes while the app is open and when it comes back to the foreground.
- What to do: keep our per-level copy (decision D8) and show the engine's action as the headline. "Who" compares the worker's level with crewLevel from /me/risk. "I understand" acknowledges the first item of /me/risk `recommendations` (highest level first) with POST /recommendations/:id/interventions and `{ "status": "acknowledged" }`.
- Report: real emergency number from /me (`site.emergencyNumber`). "Alert first aider" uses POST /me/first-aid-alert, "Send" uses POST /me/symptom-reports. The alert must always be sent, even if symptom sharing is off; details only when allowed. Keep the D5 message from Phase 3.
- Field mode: save the latest /me/risk response (level, forecast, time) on the device whenever it loads. Offline, use it as the saved forecast and last known level. Queue "+ Cup", "I understand", first-aid alerts and symptom reports made offline, and send them in order when back online and signed in. Show the worker that a queued alert will be sent as soon as there is signal, and keep the emergency call link visible.

Test online, offline in the browser, and with the backend asleep. Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 6: Shift buttons and the "still here" signal

```
Follow CLAUDE.md. Phase 6: two things the backend needs from the worker app.

1. Shift buttons on Home, in a compact card below the risk card, matching the design style:
   - Use `assignment` from GET /me: `id`, `startsAt`, `endsAt`, `plannedBreaks`, `breakMinutes`, and the state fields `clockedInAt`, `onBreakSince`, `lastBreakEndedAt` and `clockedOutAt`. A 409 means the state already changed (for example "Already clocked in"): reload /me and show the current state.
   - One button at a time based on state: "Start shift", then "Start break" and "End shift", then "End break" during a break.
   - Calls: POST /assignments/:id/clock-in, /break/start, /break/end, /clock-out. Show the time of the last action, for example "On break since 12:10".
   - Offline presses are queued like the others and keep their original time if the backend accepts it; otherwise tell me.
   - 44px targets, clear labels, confirmation for "End shift".

2. Heartbeat
   - While a worker is signed in and the app is open, send POST /me/heartbeat every 5 minutes with the battery level from useBattery (omit it if unknown). Pause when offline or the tab is hidden; send one straight away when it becomes visible again.
   - No UI, no console noise.

Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 7: Wristband (optional, do last if time allows)

```
Follow CLAUDE.md. Phase 7: optional wristband. Only active when GET /me/wearable says enabled: true and the worker has the "Wearable band" switch on.

- On My data, add a "Your band" card: Connect (Web Bluetooth, standard heart_rate service), register with PUT /me/wearable, show connected or not, and Disconnect.
- Collect about one reading a minute and send in batches with POST /me/wearable/readings. Buffer while offline.
- Hide the card entirely where Web Bluetooth is not supported (for example iPhone), with no error.
- Home's "Your band" data source chip reflects the real connection.
- Supervisors only ever see the count of connected bands, never readings.

Test without hardware using the backend simulator described in section 4 of the To-Do (ask the backend team to enable WEARABLES_ENABLED). Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 8: Supervisor pages on real data

```
Follow CLAUDE.md. Phase 8: supervisor pages. Use the data switch so mock mode still works.

- Today: load everything from GET /sites/:id/today (site from GET /sites: a supervisor's /me has `site: null`). Crew, activity and shift filters now all work through the query parameters in the spec, with the shift dropdown filled from the shifts list. Refresh every 5 minutes and on focus. Show worker codes (`workerCode`), never the UUID.
  - Needs attention, `needsAttention.items` in the order sent, buttons as in DECISIONS.md:
    - help: "I am on my way" (POST /help-requests/:id/acknowledge), then "Mark resolved" (/resolve).
    - critical: new card in the danger style, "Worker [code] is at Critical. Stop their activity now." Buttons Acknowledge (`acknowledged`) and Activity stopped (`implemented`).
    - crew_risk: Acknowledge (`acknowledged`) and Change shift timing (a link to the shift plan).
    - worker_care: the `need` only, never the reason. Acknowledge (`acknowledged`) and Reassign (`reassigned`, chosen option in `note`).
    - critical, crew_risk and worker_care use POST /recommendations/:recommendationId/interventions.
  - Map supervisor action codes to our own wording in one place (the list is in DECISIONS.md); fall back to the backend's English text for unknown codes.
  - System health: `siteSensors` null shows "No site sensors"; otherwise the last reading time and an OK or Check pill.
- Shift plan: GET and PUT /sites/:id/plan, then POST /sites/:id/plan/send with `{ "use": "current" }`. The backend owns the too-hot rule: the editor may preview changes locally, but after saving, show the backend's tooHotCrewHours, workingCrewHours and too-hot cells. Remove the frontend rule from the api path.
  - "What the suggested plan changes" is written by the app by comparing `current` and `suggested` tasks per crew, for example "Crew B: heavy work moved out of 11:00 to 14:00 and into 16:00".
  - Send notifies no one yet, so keep "Plan applied for today. Let your crews know about the changes."
  - "Workers needing reduced exposure" uses `workersNeedingReducedExposure` (a count only) and stays.
- Measures: GET /sites/:id/measures with the period select (7d, 30d, season) now working. Show a "Provisional" badge wherever the backend marks a figure as provisional, and "Not tracked yet" where incidents are null. Keep "Sample data" only in mock mode.

Test with S-001. Run build and lint, show me the diffs, and STOP for review. Do not commit.
```

---

## Phase 9: Hardening and demo readiness

```
Follow CLAUDE.md. Phase 9: final pass for the connected app.

1. Go through every screen in api mode and report any missing loading, slow, error or empty state, then fix them.
2. Run the earlier checks again: 360, 390, 768 and 1440px; keyboard and focus; contrast; 44px targets; Lighthouse accessibility and best practices on /login, /worker, /worker/report and /supervisor.
3. Confirm the production build has no dev panel, no role switcher and no mock data in api mode.
4. Confirm the app works from https://heat-guard-nine.vercel.app and a Vercel preview link. The backend already allows production, previews ending in `-ahmads-projects-727aea25.vercel.app` and localhost:5173; list any other address I must ask the backend team to allow.
5. Update README.md and the handover notes: environment variables, login and demo accounts (S-001, W-0412, W-0384, PIN 1234), the waking-up behaviour, what is still mock or later (push, SMS, possible level, Pidgin advice, incident log), and how to switch to mock mode.
6. Write a short demo script for demo day: sign in as W-0412, show Home, What to do, Report; sign in as S-001, show Today, the alert without health details, the shift plan and Measures.

Run build and lint, give me the report and the phone test checklist, and STOP for review. Do not commit or push.
```
