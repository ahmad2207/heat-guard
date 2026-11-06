# HeatGuard AI: design reference

This folder is the source of truth for how the HeatGuard frontend should look and behave. It was exported from the HeatGuard design canvas. Build the React app to match it.

## What is in here

| Folder | What it is | How to use it |
|---|---|---|
| `screens/` | PNG screenshots of every screen at 2x. Pages also have a `-phone-width.png` showing the 390px layout. | The visual target. Compare against these at every checkpoint. |
| `html/` | Static HTML of every screen with exact inline styles, spacing and copy. Opens in any browser. | The exact values: colours, sizes, gaps, radii and wording. Translate into React and Tailwind. Do not copy the inline-style approach. |
| `source/` | The original design files, including small `renderVals()` scripts with the interactive logic and sample data. | Read for behaviour: toggles, selections, the shift-plan maths and level switching. |
| `TOKENS.md` | Colours, risk levels, type, radii, spacing and accessibility rules. | Put these into the Tailwind theme first. |
| `SCREENS.md` | Every screen mapped to a route, its parts and its behaviour. | The build checklist. |
| `BUILD-PROMPTS.md` | Phased prompts for Claude Code. | Paste one phase at a time. |

All figures on the screens are sample data. `[SITE NAME]` and `[EMERGENCY NO.]` are placeholders.
