# Frontend vs backend: gap report

**Compared:** the live frontend (`heat-guard-nine.vercel.app`, repo commit `27613d0`), its handover document and `src/data/types.ts`, against `heatguard-api` as it stands after the AI engine integration.

**Scope:** worker app and supervisor pages. The occupational health part is not integrated in the frontend. The OH role stays in the backend, and precaution levels are set by the demo data or a back-office script (`npm run precaution:set`). See `FRONTEND_TASKS.md` section 7 for the wording changes this needs.

**Status as of 12 November 2026, after phases 1 to 5.** **Legend:**
- ✅ Ready: an endpoint exists and gives what the screen needs
- 🟡 Partial: the data exists but the endpoint, shape or a field is missing
- ❌ Missing: nothing in the backend yet

## Summary

| Screen | Backend status | What's still open |
|---|---|---|
| Consent | Ready | None (band feature behind `WEARABLES_ENABLED`) |
| Health profile | Ready | None |
| Home (status) | Ready | "Possible" level and confidence waiting on engine request #4; band data in the risk level waiting on engine request #5 |
| What to do | Ready | None (the frontend keeps its per-level copy, D8) |
| Report symptoms | Ready | None |
| My data | Ready | None |
| Field mode | Ready | SMS fallback (later) |
| Supervisor Today | Ready | Sensor registry |
| Shift plan | Ready | Notifying crews when a plan is sent (with push, later) |
| Measures | Ready | Forecast-accuracy and compliance definitions are provisional (D6); incident log |

**Bottom line:** every worker and supervisor screen in scope now has a backend. What's left is either marked "later" in the handover (push, SMS, wearables, shift filter), or waiting on another team: the engine's "possible" level (request #4) and forecast-accuracy definitions (D6) from the AI team, and login, clock-in and data formatting on the frontend (section 4).

---

## Progress

- **Phase 1, foundations (done):**
  - ID plus PIN login with lockout
  - CORS allowlist
  - demo seed
  - `GET /me`
  - worker preferences
  - consent switches
  - site emergency number and shifts
- **Phase 2, worker essentials (done):**
  - health profile with the frontend's codes, past heat illness, restrictions and next review
  - acclimatisation start date (D4)
  - symptom reports and first-aider alert (D5)
  - water tracker
  - `/me/risk` next break, crew level and data sources
  - "Who looked at your data"
  - 30-day retention
- **Phase 3, supervisor Today (done):**
  - `GET /sites/:id/today` with every section
  - site heat per hour from a reference worker, with forecast history
  - device heartbeat and "No recent data"
  - dust and storm hazards (worker home too)
  - system health
  - needs attention, including help requests, critical workers, crew risk, and precaution alerts showing the action only (D1)
  - grouped actions today and today so far
  - crews table
  - last 7 days
  - "Reassign"
- **Phase 4, shift plan (done):**
  - `GET`, `PUT` and `POST send` on `/sites/:id/plan`
  - the too-hot rule
  - a suggested plan that reproduces the frontend sample (10 of 32 too-hot crew-hours down to 0, same working hours)
  - a sent plan feeds per-hour work and breaks to engine forecasts
- **Phase 5, measures (done):** `GET /sites/:id/measures`. Forecast-accuracy and compliance figures are provisional until D6.
- **Added after:**
  - the shift filter
  - the wearable band (behind `WEARABLES_ENABLED`; sending band data to the engine waits on request #5, `ENGINE_SUPPORTS_WEARABLES`)
- **Still later:**
  - push and SMS alerts, including notifying crews when a plan is sent
  - an incident log
  - the shift filter
  - the "possible" level from the engine (request #4)

## 1. Cross-cutting

| Need | Status | Notes |
|---|---|---|
| Login and roles | ✅ | The backend has JWT login by **email and password**. The frontend has no login yet (role switcher). Outdoor workers may not have email, so consider **employee code and PIN** for workers (decision D3) **Now:** ID + PIN for everyone, lockout (D3) |
| CORS for the frontend | ✅ | Allow `https://heat-guard-nine.vercel.app` and the Vite dev origin **Now:** `CORS_ORIGINS` allowlist |
| Worker "me" profile | ✅ | `GET /users/me` returns the account only. The worker app needs crew, task, language, precaution summary and consent state in one call **Now:** `GET /me` |
| Risk levels 1 to 4 | ✅ | Same numbers and names everywhere |
| Precaution level names | 🟡 | Frontend `high`, backend and engine `high_priority`. Align (simplest: the frontend maps it) **Now:** Frontend maps `high` ↔ `high_priority` |
| Languages | 🟡 | Frontend uses names (`'English'`, `'Pidgin'`); backend uses codes (`en`, `ha`, `yo`, `ig`). Pidgin is pending the engine team **Now:** Backend codes `en`, `ha`, `yo`, `ig`, `pcm`; frontend maps names |
| Crews | 🟡 | Frontend has fixed letters `A` to `D`; backend has crew records with IDs and names. The frontend should use IDs from the API **Now:** Frontend uses crew IDs from the API |
| Site details | ✅ | Name ✅. Missing: shift name and times, workers on shift, **emergency number** (the frontend shows `[EMERGENCY NO.]`) **Now:** `Site.shifts`, `emergencyNumber`, workers on shift in `/today` |
| Response style | Decision D7 | Frontend types hold pre-formatted text (`meta: "Crew B · 10:21"`). We recommend the API returns raw data (times, IDs, levels) and the frontend formats it, which also helps translation |
| Push notifications and SMS | ❌ | Handover step 6, later **Now:** Later (handover step 6) |

---

## 2. Worker app

### 2.1 Consent and choices (`/worker/welcome`)

| Field or action | Backend | Status |
|---|---|---|
| Language select (5 incl. Pidgin) | `Worker.preferredLanguage`, but only admin and supervisor can PATCH it | ✅ Needs a worker self-service preferences endpoint **Now:** `PATCH /me/preferences` |
| Work details "Always on" | Operational data, no consent needed | ✅ |
| Switch: Health precautions | Consent purpose `health_data_processing` | ✅ |
| Switch: Wearable band | No consent purpose, no wearable data | ✅ Add purpose; wearable data is a later phase (handover step 7) **Now:** Consent purpose `wearable_band` (wearable data itself is later) |
| Switch: Symptom reports to OH | No purpose, no feature | ✅ See 2.5 **Now:** Consent purpose `symptom_reports` |
| "Agree and continue" | `POST /workers/:id/consents` (one call per purpose) | ✅ |

### 2.2 Health profile (`/worker/health-profile`)

| Field or action | Backend | Status |
|---|---|---|
| Worker ID shown (e.g. W-0412) | `Worker.employeeCode` | ✅ |
| Age range (fixed options) | `ageRange` (free text, encrypted) | ✅ Add validation of the option list |
| Health conditions (ticks incl. "None of these") | `healthConditions: string[]` | ✅ Store option IDs; validate |
| Past heat illness (single choice) | No field | ✅ Add `heatIllness` (encrypted) **Now:** `heatIllness` |
| Medicines (ticks incl. "Not sure") | `medications: string[]` | ✅ Store option IDs |
| Getting used to the heat (single choice) | Not in profile. Acclimatisation is `Worker.acclimatized`, set by the supervisor | ✅ Decision D4: how the worker's answer feeds the engine's `acclimatized` **Now:** Sets the acclimatisation start date (D4) |
| "Precautions set for you": level, restrictions list, set date, next review | `precautionLevel`, `precautionNotes` (free text), `approvedAt` | ✅ Add `restrictions: string[]` and `nextReviewOn` **Now:** `restrictions`, `nextReviewOn` in `/me` |
| Request a review | `POST /workers/:id/health-profile/request-review` | ✅ |
| Send to occupational health | `PUT /workers/:id/health-profile` (requires consent) | ✅ |

### 2.3 Home / status (`/worker`)

| Field or action | Backend | Status |
|---|---|---|
| Risk level, name, one-line action | `GET /me/risk` (engine `level`, `label`, `action`) | ✅ |
| Updated time | `assessedAt` | ✅ |
| Data sources: Weather, Site sensor, Your band (ok or not) | Reading source and `dataQuality` exist | ✅ Add a `dataSources` block; band is ❌ until wearables exist **Now:** `dataSources` in `/me/risk` (band: later) |
| Next break "in 12 min, 15 min in the shaded rest area" | `plannedBreaks` (start times only) | ✅ Add break duration and place, and expose the next break in `/me/risk` **Now:** `nextBreak` in `/me/risk`, `breakMinutes` |
| Water: cups today and "+ Cup" | Nothing | ✅ Hydration log **Now:** `GET/POST /me/water` |
| Why (reasons) | Engine `reasons[].effect` | ✅ |
| Next 6 hours (time and level) | `forecast.hours` | ✅ (covers the rest of the shift) |
| Forecast "Possible" flag (Critical possible, not certain) and "Confidence: moderate" | Engine gives no uncertainty; we have `dataQuality` only | 🟡 Decision D2 **Now:** Backend ready; waiting on engine request #4 |
| "Also today": dust, storms | Nothing | ✅ Hazards from Open-Meteo air quality (dust, PM10) and storm indicators, rule-based **Now:** `hazards` in `/me/risk` |
| Clock-in and breaks | `POST /assignments/:id/clock-in` etc. | ✅ backend, but **the frontend has no clock-in UI**. Without it, exposure is counted from the planned shift start (safe, less precise) |

### 2.4 What to do (`/worker/what-to-do`)

| Field or action | Backend | Status |
|---|---|---|
| Level banner and headline | `/me/risk` level, label, forecast `firstReached` | ✅ |
| Action list with icons (rest, water, cool, lighter, shift…) | Engine gives **one** `action.what` sentence; the frontend has rich per-level copy | ✅ Decision D8 **Now:** Frontend keeps per-level copy (D8) |
| Why it matters | Engine reasons | ✅ |
| When | `action.when` plus forecast `firstReached` | ✅ |
| Who (worker above, same as, or below crew level) | No crew level in `/me/risk` | ✅ Add `crewLevel` (highest or typical level in the worker's crew; level only) **Now:** `crewLevel` in `/me/risk` |
| "I understand, starting now" | `POST /recommendations/:id/interventions` (worker may acknowledge own) | ✅ |

### 2.5 Report symptoms (`/worker/report`)

| Field or action | Backend | Status |
|---|---|---|
| Emergency number (`tel:`) | Not stored | ✅ `Site.emergencyNumber` **Now:** `/me` site `emergencyNumber` |
| "Alert first aider" | Nothing | ✅ Urgent alert to the supervisor and first aider **Now:** `POST /me/first-aid-alert` |
| Symptom ticks and note, send | Nothing | ✅ `SymptomReport`: encrypted details for OH; the supervisor sees only "needs help" **Now:** `POST /me/symptom-reports` (D5) |
| Reachable without consent | n/a | Decision D5 |

### 2.6 My data and privacy (`/worker/my-data`)

| Field or action | Backend | Status |
|---|---|---|
| Precaution level and set date | Health profile | ✅ |
| Request a review | ✅ | ✅ |
| Switches: health, band, reports, read aloud | Consent records (health only) | ✅ Add purposes; "read aloud" is a preference, not consent **Now:** `PUT /me/consents`; read aloud in preferences |
| Who looked at your data (last 30 days) | `audit_logs` exists, but workers can't read it, and **supervisor views of a worker's risk are not logged** | ✅ Add `GET /me/access-log` and log supervisor overview views per worker **Now:** `GET /me/access-log` |
| Download my data | `GET /workers/:id/data-export` | ✅ |
| Delete my health information | `DELETE /workers/:id/health-profile` | ✅ |
| "Deleted 30 days after you leave the site" | No retention job | ✅ **Now:** Nightly retention job |

### 2.7 Field mode (offline)

| Field or action | Backend | Status |
|---|---|---|
| Saved forecast | `/me/risk` `forecast.hours`, saved while online | ✅ |
| Last known level | `/me/risk` | ✅ |
| "Assume High" when there's no fresh data | Client-side, matches our fail-safe | ✅ |
| SMS fallback for critical alerts | Nothing | ❌ Later (handover step 6) **Now:** Later |

---

## 3. Supervisor pages

### 3.1 Today (`/supervisor`)

| Field or action | Backend | Status |
|---|---|---|
| Site name | `GET /sites` | ✅ |
| Shift name, hours, workers on shift | Active assignments exist; no shift entity | ✅ Add to the overview **Now:** `/today` shift and workersOnShift |
| Filter: crew | `?crewId=` | ✅ |
| Filter: activity | Activity is on assignments | ✅ Add `?activityId=` **Now:** `?activity=` |
| Filter: shift | The frontend treats it as visual only | ✅ **Now:** `?shift=` on `/today` and `/crews-summary`; `shifts` list for the dropdown |
| Header "Updated 10:32 · WBGT estimated" | `assessedAt`, `wbgtMethod` | ✅ |
| Site heat now: **level** plus WBGT | WBGT ✅. **Site level ✅**: we removed our own rules, so a site level needs an engine call for a reference worker (moderate work, standard PPE) | 🟡 **Now:** `siteHeat.now` (reference worker) |
| Peak window, "may reach Critical", confidence | From the reference-worker forecast | ✅ Depends on the above and D2 **Now:** `siteHeat.peak` (confidence via request #4) |
| Today hour by hour, 07 to 17 (incl. past hours) | No per-hour site level history | ✅ Store site level per hour **Now:** `siteHeat.hours` incl. past hours |
| Workers by level | `distribution` | ✅ |
| "No recent data", counted as High | No app heartbeat | ✅ Device heartbeat endpoint **Now:** Heartbeat; `distribution.noRecentData` |
| Other climate hazards | Nothing | ✅ Same source as worker hazards **Now:** `hazards` |
| System health: weather feed | Last reading time | ✅ Expose **Now:** `systemHealth.weatherFeed` |
| System health: site sensors | Sensor readings exist; no sensor registry or status | 🟡 **Now:** Last sensor reading only; no sensor registry |
| System health: worker apps reporting, low battery | Nothing | ✅ Heartbeat (with battery) **Now:** `systemHealth.workerApps` |
| System health: consented wearables | Nothing | ✅ **Now:** `systemHealth.wearables` (count only; needs `WEARABLES_ENABLED`) |
| Needs attention: symptom alert ("I am on my way", "Mark resolved") | Nothing | ✅ Needs 2.5 **Now:** Help requests, acknowledge or resolve |
| Needs attention: crew risk ("Crew B, excavation: 7 at High", why, do, before time) | `crew.rotate_and_cool` recommendation exists | ✅ Richer crew alert (activity, count, deadline) **Now:** `crew_risk` with activity, counts and deadline |
| Needs attention: precaution alert ("High-priority precautions", "needs reduced exposure") | Deliberately **not** sent to supervisors (engine guide §6) | Decision D1 |
| Actions: Acknowledge / Reassign | Interventions (acknowledged, implemented, dismissed) | ✅ "Reassign" needs a status or action type |
| Actions today ("2 of 5 done", grouped by crew or site) | Recommendations plus status, but **per worker** | ✅ Add a crew- and site-level grouping **Now:** `actionsToday` grouped |
| Today so far: lead time, warnings not borne out, actions followed %, symptom reports, escalations, work time paused | Nothing | ✅ See 3.3 **Now:** `todaySoFar` (forecast figures provisional, D6) |
| Crews table: activity, workload, PPE, workers, now, peak, next action | Data exists across assignments, assessments and recommendations | ✅ Add `GET /sites/:id/crews-summary` **Now:** `crews` / `GET /crews-summary` |
| Last 7 days: hours at High or above per day, actions on time | Assessments are stored (history is derivable) | ✅ Endpoint plus hourly aggregation **Now:** `last7Days` / `GET /history` |

### 3.2 Shift plan (`/supervisor/plan`)

| Field or action | Backend | Status |
|---|---|---|
| Crew × hour grid (Heavy / Moderate / Light / Break) | Nothing | ✅ `ShiftPlan` model (site, date, crew, hourly slots) **Now:** `ShiftPlan` |
| Site heat level per hour | Same gap as Today (reference worker) | ✅ **Now:** `plan.hours[].level` |
| "Too hot" rule (heavy at level ≥3, moderate at 4) | Nothing. Should run on the backend ("rules decide") | ✅ **Now:** Backend rule |
| Suggested plan (move heavy work out of hot hours, same working hours) | Nothing | ✅ **Now:** Reproduces the frontend sample (10 to 0) |
| Summary: too-hot crew-hours, working hours | Derived from the plan | ✅ **Now:** `tooHotCrewHours`, `workingCrewHours` |
| "Workers needing reduced exposure: 2" | Precaution count | Decision D1 |
| Edit mode, "Send to crews" | Nothing | ✅ Save plan, then notify (later) **Now:** `PUT` / `POST send` (crew notification later) |
| **Bonus:** the plan gives the engine per-hour `workload` and `rest_break` for forecasts | Today the forecast repeats the current workload | ✅ Wire it in once plans exist **Now:** A sent plan feeds forecasts |

### 3.3 Measures (`/supervisor/measures`)

| Card or chart | Status | Notes |
|---|---|---|
| Period select (30 days, 7 days, season) | ✅ | **Now:** `?period=7d|30d|season` |
| Warning lead time, false alarms, missed warnings, lead-time histogram | ✅ | Needs stored forecasts compared with observed WBGT. This is an **evaluation** task that overlaps with the AI teammate's work (decision D6) **Now:** Provisional (D6) |
| Actions followed (overall and by crew) | ✅ | Derivable from recommendations and interventions **Now:** Overall and by crew; small crews grouped |
| Symptoms and incidents | ✅ | Needs 2.5, plus an incident log **Now:** Symptom reports; `heatIncidents: null` (no incident log) |
| Emergency escalations | ✅ | Needs 2.5 **Now:** Incl. acknowledged within 10 min |
| Lost work time | ✅ | Needs break and pause logging (clock and break events help) **Now:** From break events |
| Compliance (shifts meeting the heat plan) | ✅ | Needs shift plans **Now:** Provisional |

---

## 4. Decisions (agreed)

| # | Topic | Decision |
|---|---|---|
| D1 | Precaution info for supervisors | **Action only.** The supervisor sees e.g. "W-0412 needs reduced exposure today", with no level name and no word "precautions". The frontend's precaution pill must drop the level name |
| D2 | "Possible" level and forecast confidence | **Requested from the engine** (request #4). The backend already stores and returns them when present |
| D3 | Login | **Everyone logs in with an ID plus PIN** (workers e.g. `W-0412`, staff e.g. `S-001`). Accounts are created manually (demo seed). An account locks briefly after 5 wrong PINs |
| D4 | Acclimatisation | **Derived from a start date:** `acclimatized = today − start ≥ 14 days` (the day count to confirm with the engine owner). The worker's health-profile answer sets the start date, and the supervisor can mark "returned after an absence". When both set it, the later (more cautious) date wins. Default `false`. The answer feeds the worker record, so the frontend should move or reword the question on the health profile ("supervisor never sees" no longer applies to it) |
| D5 | Symptom reports with consent off | **The alert always goes through;** the "needs help" alert reaches the supervisor and first aider. Symptom details are stored and sent to OH only when consented |
| D6 | Forecast-accuracy measures | The AI teammate defines them; needed only for the Measures phase |
| D7 | Raw data vs formatted text | **Raw data.** The API returns times, IDs and levels; the frontend formats text |
| D8 | What-to-do content | **The frontend keeps its per-level copy** (selected by `level`); the engine's `action` is shown as the headline |

**For the frontend developer:**
- add a login screen (ID plus PIN) and clock-in and break buttons
- drop the precaution level name on the supervisor alert (D1)
- move or reword the acclimatisation question (D4)
- format raw API data (D7)

## 5. Suggested build phases

1. **Foundations:**
   - CORS, allowing only the frontend origins (`CORS_ORIGINS`)
   - ID plus PIN login for everyone, with lockout (D3)
   - a demo seed matching the frontend's sample site, crews and workers
   - `GET /me` worker profile
   - worker preferences (language, read aloud)
   - site fields (shift times, emergency number)
   - consent purposes
   - naming alignment
2. **Worker essentials:**
   - health profile fields
   - symptom reports and first-aider alert
   - hydration log
   - `/me/risk` additions: next break, crew level, data sources
   - access log, with supervisor views audited
3. **Supervisor Today:**
   - site level and hourly history (reference worker)
   - crews summary
   - needs-attention feed
   - grouped actions
   - device heartbeat and system health
   - 7-day history
   - hazards
4. **Shift plan:** model, too-hot rule, suggested plan, and feeding per-hour workload to engine forecasts.
5. **Measures:** after the forecast-accuracy definitions (D6).
