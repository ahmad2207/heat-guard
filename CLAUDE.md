# HeatGuard AI

Heat-risk warning PWA for outdoor workers, supervisors and occupational health. React 19, TypeScript (strict), Vite, Tailwind CSS v4, vite-plugin-pwa. Deployed on Vercel at https://heat-guard-nine.vercel.app.

- `npm run dev` to develop, `npm run build` to type-check and build, `npm run lint` to lint.
- `design-reference/` is the source of truth for the UI. Start with `design-reference/README.md`, `TOKENS.md` and `SCREENS.md`. The phased plan is in `design-reference/BUILD-PROMPTS.md`.

## Project rules

- This is an existing project. Reuse and restyle existing routes, components, state and logic wherever possible. Extend instead of rewriting.
- Never delete or rename an existing feature, route, file or dependency that is not in the design without asking first.
- Match `design-reference/` for layout, spacing, colours, type and wording. When unsure, open the matching file in `design-reference/html/` for exact values.
- Use Tailwind theme tokens from `design-reference/TOKENS.md`. No raw hex codes in components.
- Keep any existing data fetching or backend calls working. Where the design needs data the project does not have yet, add it to `src/data/mock.ts` and mark it as sample data.
- Accessibility: real buttons, links, inputs and labels; touch targets at least 44px; `aria-label` on icon-only buttons; risk levels always show number, name and colour.
  - Any element with overflow scrolling must also be position relative, so screen-reader-only text inside it cannot escape and cause sideways scrolling. Check every new scroll box at 390px.
- Never use em dashes in UI copy, comments, docs or commit messages.
- Work one phase at a time. Show the diffs, run the build, then stop and wait for review. Do not refactor code outside the current phase without asking.
- Do not commit until the user approves.
