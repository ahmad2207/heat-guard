# HeatGuard design tokens

Use these exact values. Add them to the Tailwind theme with the names below so components never use raw hex codes.

## Core colours

| Token | Hex | Use |
|---|---|---|
| `ink` | #14181D | Main text, primary buttons, dark panels, supervisor header |
| `muted` | #4A5561 | Secondary text and labels (passes 4.5:1 on white and on `ground`) |
| `subtle` | #8A949E | Text on dark panels only, inactive switch track |
| `ground` | #EEF1F3 | App background, chip background |
| `surface` | #FFFFFF | Cards |
| `line` | #D5DBE0 | Card borders, dividers, nav border |
| `line-soft` | #E3E7EB | Row dividers inside cards |
| `field` | #C7CFD6 | Input and secondary button borders |
| `ink-raised` | #2E3741 | Active tab on the dark header |
| `ok` | #1E7B4F | Success icons, switch on |
| `ok-bg` / `ok-text` | #E2F1E9 / #14532F | Success messages, "Done" pills |
| `info-bg` / `info-text` | #E3EDF7 / #1D4E80 | Info chips, "Acknowledged" pills, selected rows |
| `warn-bg` | #FDF0E6 | Selected tiles and checkboxes |
| `danger-bg` / `danger-text` | #FBE9EA / #7A1219 | Warning-sign boxes |
| `oh-header` | #1D3A57 | Occupational health header (sets that role apart) |

## Additional colours

These appear in `html/` but were not in the core list. They are in the Tailwind theme with the names below.

| Token | Hex | Use |
|---|---|---|
| `brand` | #E8742A | Thermometer logo in the app and supervisor headers. Same value as `risk-3`, kept separate so the logo never reads as a risk level |
| `task-moderate` | #5B6875 | "Moderate" task cells and legend swatch on the shift plan |
| `status-live` | #4FC38A | "Updated" and "Forecast updated" dot on the dark supervisor header |
| `ink-control` | #222A33 | Account button background on the dark supervisor header |
| `warn` | #C2410C | Status dot for rows marked "Check" in System health |
| `warn-text` | #7A3510 | Text on "Check" pills in System health (on `warn-bg`) |
| `warn-strong` | #9A4310 | Dashed outline of saved level 3 hours in field mode, and the supervisor shield icon in "Who looked at your data" |
| `oh-header-raised` | #2B4E71 | "Confidential" badge on the occupational health header |
| `oh-header-muted` | #D5E2EF | "Occupational health" role label on the navy header |
| `oh-header-line` | #5A7896 | Divider before the role label on the navy header |
| `oh-selected` | #F4F7FA | Selected precaution level option on the occupational health profile |
| `oh-accent` | #F4C542 | Thermometer logo on the occupational health header. Same value as `risk-2`, kept separate so the logo never reads as a risk level |
| `ink-accent` | #F4C542 | Icons and headings on `ink` panels: field mode status icons, the "Our promise" heading and the health profile lock. Same value as `risk-2`, kept separate so these never read as a risk level |
| `link` | #2F6FB0 | Text links on the supervisor pages, for example "All safety and productivity measures". Hover uses `info-text` |
| `chart-primary` | #2F6FB0 | Bars in neutral charts, for example "How early warnings came" on Measures. Same value as `risk-1`, kept separate so a chart never reads as a risk level |

`#000000` is only used as the link hover colour in the exported HTML, so it has no token.

## Risk levels

Every level always shows its number and name as well as its colour. Never colour alone.

| Level | Name | Background | Text on it |
|---|---|---|---|
| 1 | Low | #2F6FB0 | #FFFFFF |
| 2 | Elevated | #F4C542 | #14181D |
| 3 | High | #E8742A | #14181D |
| 4 | Critical | #9E1B24 | #FFFFFF |

In the Tailwind theme these are `risk-1` to `risk-4` for the background and `risk-1-text` to `risk-4-text` for the text on it.

A forecast hour that may reach Critical shows `4?` and the word "Possible". The brand accent is the High orange, #E8742A. The current site uses #ea580c as its theme colour: change it to #E8742A so the app matches the design.

## Type

- Text: **Public Sans** (400, 500, 600, 700, 800). Self-host with `@fontsource/public-sans` so it works offline.
- Numbers and readings (WBGT, times, counts): **IBM Plex Mono** (500, 600) via `@fontsource/ibm-plex-mono`.
- Common sizes: 12, 13, 14, 15, 16, 17, 18, 20 and 22px. Large: 28 to 30px for dashboard figures, 34 to 46px for the risk level name.
- Uppercase labels: 12 to 13px, weight 700, letter spacing about 0.06 to 0.08em, colour `muted`.

## Shape and spacing

- Radii: 999px pills, 20px for the big risk card, 16 to 18px for cards, 12 to 14px for buttons and tiles, 8 to 10px for small blocks.
- Phone screens: 16px side padding, 12px gap between cards, 16px card padding.
- Pages: max width 1360px, 24px padding, 20px gap between sections, 18px card radius, 22px card padding.

## Accessibility rules (non-negotiable)

- Touch targets at least 44px. Primary buttons 48 to 54px tall.
- Real `<button>`, `<a>`, `<input>` and `<label>` elements. Icon-only buttons get `aria-label`.
- Text contrast at least 4.5:1.
- Every risk display has number plus name plus colour.
- Pages must work at 390px wide: stack columns, wrap toolbars, scroll wide tables inside their own box.
