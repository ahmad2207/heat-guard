# Screens, routes and behaviour

Three roles share one app. For the frontend-only build there is no login: a role switcher on `/` lets testers pick Worker, Supervisor or Occupational health. All data comes from one mock data file.

## Worker app (mobile first, 390px design width)

On wider screens, centre the worker app in a column about 430px wide. Bottom navigation: **Status**, **Report**, **My data**.

| # | Screen | Route | Reference | What it must do |
|---|---|---|---|---|
| 1 | Consent and choices | `/worker/welcome` | `01-consent` | Step dots, language select (English, Hausa, Yoruba, Igbo, Pidgin). Work details shown as "Always on". Switches for health precautions, wearable band and symptom reports. Promise box. "Agree and continue" goes to the health profile. |
| 2 | Health profile | `/worker/health-profile` | `02-health-profile` | Six sections: about you (ID read-only, age range), health conditions (multi-select, "None of these" clears the rest), past heat illness (single choice), medicines by type (multi-select with "Not sure"), getting used to the heat (single choice), precautions set for you (read-only with "Request a review"). Every question optional. Send shows a success state and a link to Status. |
| 3 | Home | `/worker` | `03-home`, `03b-home-critical` | Data source chips, risk card that changes with the level (Low, Elevated, High, Critical), Listen button, next break, water tracker with "+ Cup", "Why" chips, 6-hour forecast with confidence, other hazards. "See what to do" opens screen 4. |
| 4 | What to do | `/worker/what-to-do` | `04-what-to-do` | Back link, level banner, action list (rest, water, cool down, lighter work, shift change possible, feel unwell), why it matters, when, who. "I understand, starting now" switches to a confirmed state. "I feel unwell" opens screen 5. |
| 5 | Report symptoms | `/worker/report` | `05-report-symptoms` | Emergency block first (alert first aider, call `[EMERGENCY NO.]` as a `tel:` link). Symptom tiles as real checkboxes. Optional note. Send button shows the count ticked, then a confirmation state. Privacy line at the bottom. |
| 6 | My data and privacy | `/worker/my-data` | `06-my-data` | Precaution level with "Health profile" (links to screen 2) and "Request a review". Sharing switches that match screen 1. "Who looked at your data" log. Promise box. |
| 7 | Field mode | shown inside `/worker` | `07-field-mode` | Not a separate page. Home switches to this layout when offline (`navigator.onLine` false), or when the dev panel forces it. Status rows for connection, band and battery, "Try to reconnect", "Assume High" safety card, standard heat plan, saved forecast with dashed outlines. |

## Supervisor (responsive page, 1440px design width)

Dark header with tabs **Today**, **Plan**, **Measures**.

| # | Screen | Route | Reference | What it must do |
|---|---|---|---|---|
| 8 | Today | `/supervisor` | `08-supervisor-today` | Filters (crew, activity, shift). Site heat now with the hour-by-hour strip and current hour outlined. Workers by risk level with a stacked bar. Other climate hazards. System health. Needs attention (symptom report first). Actions today with Done, Acknowledged and Pending pills. Today so far figures. Crews table. Last 7 days bar chart. Privacy footer. |
| 9 | Shift plan | `/supervisor/plan` | `09-supervisor-plan`, `09b-...-suggested` | Toggle between Current and Suggested plan. Summary cards recalculate. Timeline grid: site heat row, then one row per crew with task cells. Cells too strenuous for the heat get a red outline and "Too hot". Changes list. "Use suggested plan" shows a sent state. The rule and sample plans are in `source/Planner.dc.html`. |
| 10 | Measures | `/supervisor/measures` | `10-supervisor-measures` | "Sample data" badge, period select, eight measure cards, "How early warnings came" bars, "Actions followed, by crew" bars, privacy footer. |

## Occupational health (responsive page, 1440px design width)

| # | Screen | Route | Reference | What it must do |
|---|---|---|---|---|
| 11 | Cases and profiles | `/occupational-health` | `11-occupational-health` | Navy header with "Confidential" badge. Escalation card with clinical note and outcome buttons. Profiles to review list. Profile panel: what you record, precaution level as radio options, work restrictions, and a live preview of what the supervisor and worker will see, which updates with the selected level. Save shows a confirmation. |

## Shared components to build once

`RiskBadge` (level 1 to 4, sizes sm, md, lg), `RiskCard`, `ForecastStrip`, `Card`, `Button` (primary, secondary, danger), `Switch` (accessible checkbox with role switch), `CheckTile`, `RadioTile`, `Chip`, `StatusPill`, `SectionLabel`, `ListenButton`, `WorkerBottomNav`, `SupervisorHeader`, `PrivacyFooter`.
