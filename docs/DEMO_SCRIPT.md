# HeatGuard AI: demo script

About 8 minutes. Two parts: a worker on a phone, then a supervisor on a laptop. Every account uses PIN **1234**.

Live site: https://heat-guard-nine.vercel.app

## Before the demo

Do these 15 to 30 minutes before you start.

- [ ] **Demo data reseeded.** Ask the backend team to reseed (alerts, plans and test answers from rehearsals are reset).
- [ ] **Vercel in api mode.** In the Vercel project settings, `VITE_API_URL` is `https://health-heat.onrender.com` and `VITE_DATA_SOURCE` is `api`, and the latest deploy happened after that change. Check: opening the live site shows **Sign in**, not the Worker and Supervisor buttons.
- [ ] **Backend awake.** Open https://health-heat.onrender.com/api/v1/health in a browser. It should show `"status":"ok"`. The first time can take up to a minute.
- [ ] **First request done.** Sign in once as S-001 and once as W-0412 and let each home screen load, then sign out. After that the app answers in seconds. Repeat if the app has been unused for more than about 15 minutes.
- [ ] **Weather data present.** Supervisor Today shows a site heat level, not "No current reading". If it does not, tell the backend team before the demo.
- [ ] **Phone ready.** The app is installed from the live site (Chrome menu, **Install app**), the phone is charged, and the screen is set not to lock during the demo.
- [ ] **Laptop ready.** The live site is open in a browser window at full width.
- [ ] **Signal plan.** Decide whether you will show field mode (airplane mode on the phone). If yes, load the worker's Home once while online first, so the forecast is saved.

## Part 1: worker (W-0412, on the phone)

1. **Sign in.** Open the app. Enter `W-0412` and PIN `1234`, then **Sign in**.
   - Say: workers sign in with their site ID and a short PIN, no email needed. If the server is slow to wake, the screen says so.
2. **Home (Status).**
   - Point to the risk card: the level shows as a number, a name and a colour, with one clear instruction.
   - Point to **Why**: the reasons come from the risk engine in the worker's own language.
   - Point to the next break ("in the shaded rest area"), the water count (tap **+ Cup**), the next 6 hours and the data sources.
3. **Shift card** (below the risk card, if W-0412 has an assignment today).
   - Tap **Start shift**, then **Start break**, then **End break**. Each tap shows the time.
   - Do not tap **End shift** if you still want to show the card afterwards: an ended shift hides the card on the next visit.
4. **What to do.** Tap **See what to do**.
   - Show the headline, **Do this now**, **When** and **Who**.
   - Tap **I understand, starting now**. Say: the supervisor sees that the worker confirmed.
5. **Report.** Go back and tap **Report** in the bottom bar.
   - Show the red emergency box: **Alert first aider** and the call button with the site's emergency number.
   - Tick **Headache** and tap **Send report**.
   - Say: the supervisor is told the worker needs help, never which symptoms. If the worker has turned symptom sharing off, no details are kept at all.
6. **My data** (optional). Show the precaution card ("High-priority precautions", "Set on ..."), the sharing switches and **Who looked at your data**.
7. **Field mode** (optional). Turn on airplane mode and reopen the app: it shows field mode with "Assume High", the last known level and the saved forecast. Taps made now are sent when signal returns. Turn airplane mode off again.
8. **Sign out** from the bottom of **My data**.

## Part 2: supervisor (S-001, on the laptop)

1. **Sign in** as `S-001`, PIN `1234`. The app opens on **Today**.
2. **Today.**
   - Site heat now, hour by hour, and the peak window.
   - Workers by risk level, including workers with no recent data.
   - **Needs attention**:
     - The help request from W-0412's report: **I am on my way**, then **Mark resolved**.
     - The worker care card: **"Worker W-0412 needs reduced exposure today"** with "Health reasons are never shown." Say: the supervisor sees the action only, never the level name, a condition or a symptom. Tap **Reassign** and pick **Lighter duty**.
     - A crew card: **Acknowledge**, or **Change shift timing**, which opens the shift plan.
   - Filters: pick a crew, then **All crews** again.
   - **Today so far**, the crews table and the last 7 days.
3. **Shift plan.**
   - Show the current plan with the red **Too hot** cells, then **Suggested plan**: fewer strenuous crew-hours, same working hours.
   - Read **What the suggested plan changes**.
   - Tap **Adjust first**, tap one cell to change it (the totals update as a preview), then **Use this plan**. It shows "Plan applied for today. Let your crews know about the changes."
4. **Measures.**
   - Change the period (Last 7 days, Last 30 days, This season).
   - Point to the **Provisional** badges: those figures are still being validated, and the app says so.
   - Point to "not tracked yet" for heat-related incidents.
   - Say: measures are by crew and site only; individual workers are never ranked.
5. **Sign out** from the account button (top right).

## If something goes wrong

- **"Waking up the server..." for more than a minute:** wait for the Try again button, or open the health link above in another tab and try again.
- **"Invalid ID or PIN":** check the ID (for example `W-0412`, with the dash) and PIN `1234`. Too many wrong tries can lock an account for a while; use another demo account.
- **"No connection":** the phone has no signal. Use the laptop for the rest, or show field mode on purpose.
- **Last resort:** a copy of the app with sample data can run on a laptop with `VITE_DATA_SOURCE=mock` (see the README). It needs no backend and no sign-in.
