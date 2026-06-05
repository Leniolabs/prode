# Plan 00: Prerequisites and Decisions

Status: IN PROGRESS — decisions resolved, code tasks partially complete (see checklist).

## Decisions (resolved 2026-06-05)

| Decision | Answer |
|---|---|
| Puntos por podio | **Out of scope.** Do not implement. Document in a follow-up ticket. Phase 04 proceeds without it. |
| Per-user backgrounds | **Remove.** Drop the `backgroundImage` prop from all `<Layout>` call sites. Fixed gradient for all users. Schema column (`User.background`) stays but is unused for styling. |
| Login providers | **Google only.** Remove GitHub and Microsoft buttons from the UI. Provider config in `auth.ts` unchanged. |
| Mobile frames | **No frames available.** Use the documented fallback: Predicciones / Posiciones tab toggle on mobile for the group-stage screen (Phase 05). |

Depends on: nothing. All subsequent phases depend on this one.

---

## Goal

Unblock every downstream phase by resolving four outstanding product decisions, exporting all required Figma assets into `public/`, adding the missing `finals` route to the visual-regression harness, and confirming the Sass `@use` path-alias wiring works in Next.js. No visual change ships to users from this phase.

---

## Files Likely Affected

| File | Change |
|---|---|
| `harness/routes.ts` | Add the `finals` route spec so it is covered by baseline/check runs |
| `public/` | Drop in new image assets (trophy, Improving logo variants) |
| `src/styles/_tokens.scss` | **Create new file** — SCSS variable declarations only, no values changed yet |
| Any `*.module.scss` that imports tokens | Add `@use '@/styles/tokens' as t;` at the top — no value changes yet |

---

## Step-by-Step Checklist

### 1. Resolve the four product decisions (human task, not code)

Before writing a single line of code, get written answers to these questions from the design/product owner:

- [ ] **Podio field**: Is "Puntos por podio" in the create-prode Figma a new scoring field, a rename of `pointsPenal`, or out of scope? If new: this becomes a backend schema change and must be scoped as a separate task before Phase 04 begins.
- [ ] **Per-user backgrounds**: Does the `User.background` feature (three PNG backgrounds per user) survive the migration, or does the new fixed gradient replace it? If replacing: the `background` column on `User` can be treated as dead code for styling purposes, but do not drop it from the schema in this phase.
- [ ] **Login providers**: Does the login screen keep Google + GitHub + Microsoft, or reduce to Google-only as Figma shows?
- [ ] **Mobile frames**: Are Figma mobile designs available for any of the four screens, especially the group-stage screen? If not, agree a documented fallback pattern (recommended: tab/toggle between Predictions and Standings panels on mobile).

Record each answer in writing (Jira ticket, Confluence, or a comment on this plan file). Phase 02 is gated on the login-providers answer; Phase 04 is gated on the podio answer; Phase 05 is gated on the mobile answer.

### 2. Export Figma assets into `public/`

- [ ] Export the FIFA 2026 trophy / "26" logo (replaces `/qatar.png`). Confirm filename with the design owner; suggested: `wc2026-trophy.png` or `wc2026-trophy.svg`.
- [ ] Export the Improving logo, light variant (white, for use on dark/gradient backgrounds). Suggested: `improving-logo-light.svg`.
- [ ] Export the Improving logo, dark variant (blue, for use on white backgrounds), if the design uses one. Suggested: `improving-logo-dark.svg`.
- [ ] Confirm or export the exact gradient stop values for the page background (`#00192C` → `#112632` top-to-bottom or the exact Figma gradient definition) and the footer bar (`#4597D3` → `#5BC2A7` left-to-right). Write them down — they go into `_tokens.scss` in Phase 01.
- [ ] Get a decision on the `LeniCard` decorative SVG in the group-stage screen: remove without replacement, or replace with a 2026 asset? Same question for `LeniBall` in the header.

### 3. Add the `finals` route to the harness

The `harness/baseline/finals.png` file already exists but `finals` is not in `harnessRoutes` in `harness/routes.ts`. This means shared-component changes can silently break the finals screen.

- [x] Open `harness/routes.ts`. *(Already present — route was added previously)*
- [x] Add a new entry to `harnessRoutes`. *(Already present)*
- [ ] Run `npm run harness:baseline` to capture the current finals screen as the new baseline. Commit `harness/baseline/finals.png` alongside the `routes.ts` change. *(Requires running environment — human step)*
- [ ] Run `npm run harness:check` to confirm the baseline is stable (two consecutive identical hashes). *(Human step)*

### 4. Create `src/styles/_tokens.scss` (scaffold only, no value changes)

The purpose of this file is to centralize every brand color and spacing token so Phase 01 can change them in one place. In this phase, populate it with the **current** hex values so no visual change occurs.

- [x] Create `src/styles/_tokens.scss` with the following token declarations using the current codebase values: *(Already exists with correct content)*
  ```scss
  // Brand — will be updated in Phase 01
  $color-bg-dark:        #1f2740;
  $color-bg-dark-alpha:  #1f2740cc;
  $color-bg-card:        #f6f5f5cc;
  $color-accent-yellow:  #ffca30;
  $color-table-header:   #cbd2e9;
  $color-text-primary:   #354156;
  $color-text-dark:      #1f2740;
  $color-border:         #1f274050;

  // Gameplay semantics — do NOT change these in any design phase
  $color-correct:        #309e3a;
  $color-winner:         #0093dd;
  $color-wrong:          #f9aa51;

  // Spacing / radius — will be populated in Phase 01
  $radius-card:          0px;
  $radius-input:         0px;
  $radius-button:        0px;
  ```
- [ ] Do **not** `@use` this file from any component yet. That wiring happens in Phase 01, module by module.
- [ ] Confirm that Sass compiles correctly with this file present: run `npm run build` or `npm run dev` and verify no Sass errors. Next.js has built-in Sass support; no additional config is needed.

### 5. Confirm `@use` path alias works

**Resolution:** `@/styles/tokens` does NOT work in Sass — the `@/` alias is TypeScript-only. `sassOptions.includePaths: [path.join(__dirname, 'src')]` has been added to `next.config.js`. All SCSS modules must use `@use 'styles/tokens' as t;` (no `@/` prefix). `Card.module.scss` already uses this pattern via a relative path; after the `includePaths` change both forms work, but prefer the bare `styles/tokens` form for consistency.

- [x] Determined that `@use '@/styles/tokens'` won't work. *(Sass ignores TS aliases)*
- [x] Added `sassOptions.includePaths: [path.join(__dirname, 'src')]` to `next.config.js`. *(Done)*
- [ ] Run `npm run dev` to confirm no Sass errors with the new config. *(Human verification step)*

---

## Acceptance Criteria

- [x] All four product decisions are answered in writing (see Decisions table above).
- [x] `public/` contains `wc2026-trophy.png` (FIFA World Cup trophy) and `improving-logo-light.png` (white Improving logo). Gradient documented in `_tokens.scss`: page bg `linear-gradient(180deg, #005596 0%, #4597D3 100%)`, footer `linear-gradient(90deg, #4597D3 0%, #5BC2A7 100%)`.
- [x] `harness/routes.ts` includes the `finals` route and `harness/baseline/finals.png` exists.
- [ ] `npm run harness:baseline` and `npm run harness:check` pass in a running environment. *(Pending — human step)*
- [x] `src/styles/_tokens.scss` exists with current-value scaffolding.
- [x] `sassOptions.includePaths` added to `next.config.js`; all SCSS modules will use `@use 'styles/tokens' as t;`.
- [ ] `npm run dev` confirms no Sass errors with the new config. *(Pending — human verification)*
- [ ] No existing visual baselines break after `npm run harness:check`. *(Pending — human step)*

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| Product decisions are not answered before a later phase starts | Each gated phase lists its dependency explicitly; do not start Phase 02–05 until their decision is resolved. |
| Sass `@use` path alias does not resolve in Next.js | Add `sassOptions.includePaths` to `next.config.js` and use relative-from-src paths; confirm before Phase 01. |
| Figma export formats (SVG vs PNG, exact gradient stops) differ from what the code expects | Confirm format with design before exporting; document the exact `linear-gradient()` CSS string from Figma. |
| `finals` route in the harness requires an authenticated session with a room that has reached the finals stage | Check `harness/boot.ts` and `harness/screenshot.ts` for how the `roomId` fixture is constructed; ensure the test room's `finalsStarted` flag is `true`. If not, the route may render in group-stage mode instead. |

---

## Commands

```sh
# Verify Sass compiles with no errors
npm run dev

# Capture new finals baseline and verify stability
npm run harness:baseline
npm run harness:check
npm run harness:check   # run twice; hashes must match

# Full build check
npm run build

# Lint
npm run lint
```

---

## What Must NOT Change

- Any existing color values in component SCSS files — token values in `_tokens.scss` carry the current values; no visual regressions are permitted in this phase.
- Any `.tsx` component logic, props, or markup.
- Any API route, data-fetching hook, or Prisma query.
- `src/styles/globals.css` — font and dark-mode changes are Phase 01.
- Any existing `harness/baseline/*.png` other than the newly added `finals.png`.
- The Prisma schema (`prisma/schema.prisma`) — the `background` and `dark` columns on `User` are not touched regardless of the per-user backgrounds decision.
