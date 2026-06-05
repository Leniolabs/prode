# Plan 05: Group Stage Screen

Status: Ready to execute after Plans 01–04 are complete. The mobile pattern decision from Plan 00 must be resolved before step 8.

Depends on: Plan 01 (tokens), Plan 02 (`BrandLogo`), Plan 00 (mobile design decision, LeniCard/LeniBall replacement decision).

This is the largest and most complex phase. Allocate 5–7 working days.

---

## Goal

Restyle the group-stage screen (`/[id]/groups`) to match the Figma "Group predictions + standings" frame (`2010:41841`): recolor the group cards and match inputs, remove `<LeniCard>`, build a new `<TabBar>` component for "Fase de grupos / Fase final" navigation, update the welcome header bar with trophy and deadline, implement the agreed mobile standings pattern, and apply ranking/table accessibility fixes.

No changes to scoring logic, data fetching, or the Prisma schema.

---

## Files Likely Affected

| File | Change |
|---|---|
| `src/app/(room)/[id]/groups/page.tsx` | Remove `<LeniCard>`, add `<TabBar>`, add welcome header content, `backgroundImage` prop removal |
| `src/components/view/Groups/GroupsContainer.tsx` | Remove LeniCard rendering from the grid |
| `src/components/view/Groups/CardsContainer.tsx` | If it renders LeniCard, remove |
| `src/components/view/Groups/Groups.module.scss` | Remove `leniCard` grid rule; update indicator colors |
| `src/components/view/Groups/GroupsRankingContainer.tsx` | Standings panel — restyle, ensure column headers, position dots, avatar |
| `src/components/common/MatchInput/MatchInput.module.scss` | Already token-updated in Phase 01; verify state colors on this screen |
| `src/components/common/Header/DesktopHeader/DesktopHeader.tsx` | Welcome bar with trophy icon and deadline (same pattern as Phase 03) |
| `src/components/common/TabBar/TabBar.tsx` | **Create new file** — tab strip for Fase de grupos / Fase final |
| `src/components/common/TabBar/TabBar.module.scss` | **Create new file** — tab styles |
| `src/components/common/TabBar/index.ts` | **Create new file** — barrel export |
| `src/components/common/Header/LeniBall/` | Remove or replace based on Phase 00 decision |
| `src/locale/` | Add tab label keys if not present |
| `harness/baseline/id_view.png`, `id_ranking.png` | Re-baselines |

---

## Step-by-Step Checklist

### 1. Verify Phase 01 token output on this screen

- [ ] `/[id]/groups` renders with Poppins, gradient background, green card headers.
- [ ] Match input state colors (correct, winner, wrong) are visually unchanged from before Phase 01 (gameplay semantics preserved).
- [ ] Header background uses the brand color token.

If any regressions are found, fix them before continuing.

### 2. Remove `<LeniCard>` from the grid

`LeniCard` is a 594-line decorative SVG component rendered inside the group card grid.

- [ ] In `src/components/view/Groups/GroupsContainer.tsx` (or `CardsContainer.tsx`): locate and remove the `<LeniCard />` JSX and its import.
- [ ] In `src/components/view/Groups/Groups.module.scss`: remove the `.leniCard` grid column rule. Verify the grid reflows cleanly without it.
- [ ] Do not delete `src/components/common/LeniCard/` or `LeniBall/` yet. Simply stop rendering them.
- [ ] If the Phase 00 decision provided a replacement asset (e.g., a 2026 decorative image): render it in place of `LeniCard`. Use `<Image src="/wc2026-decorative.png" alt="" aria-hidden="true" ... />`.

### 3. Handle `<LeniBall>` in the header

- [ ] Check `src/components/common/Header/LeniBall/` and its render location.
- [ ] If the Phase 00 decision is "remove without replacement": remove the `<LeniBall />` JSX from the header component that renders it. Do not delete the directory.
- [ ] If a 2026 replacement asset was provided: swap the SVG for the new image.

### 4. Create the `<TabBar>` component

This is the only net-new UI primitive in the migration. The Figma shows an in-body tab strip with two tabs: "Fase de grupos" and "Fase final", plus a points/position indicator chip on the active tab.

- [ ] Create `src/components/common/TabBar/TabBar.tsx`:
  ```tsx
  'use client'
  import styles from './TabBar.module.scss';
  import { className } from '@/utils/classname';

  interface Tab {
    label: string;
    href: string;
    active?: boolean;
    indicator?: string; // e.g. "12 pts · 4to"
  }

  interface TabBarProps {
    tabs: Tab[];
  }

  export function TabBar({ tabs }: TabBarProps) {
    return (
      <nav aria-label="Fases del torneo" className={styles.tabBar}>
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={className(styles.tab, tab.active && styles.active)}
            aria-current={tab.active ? 'page' : undefined}
          >
            {tab.label}
            {tab.indicator && (
              <span className={styles.indicator}>{tab.indicator}</span>
            )}
          </a>
        ))}
      </nav>
    );
  }
  ```
- [ ] Create `src/components/common/TabBar/TabBar.module.scss` with styles derived from the Figma: horizontal flex row, active tab has bottom border or filled background in `$color-brand-light-blue`, inactive tab is muted; indicator chip is a small badge.
- [ ] Create `src/components/common/TabBar/index.ts`:
  ```ts
  export { TabBar } from './TabBar';
  ```
- [ ] The `href` values will be `/${roomId}/groups` and `/${roomId}/finals`. These are passed as props from the page so the component has no routing logic.

### 5. Integrate `<TabBar>` into the groups page

The current header buttons (`/groups`, `/finals`) are inside `<DesktopHeader>`. The Figma shows the tabs inside the page body.

- [ ] In `src/app/(room)/[id]/groups/page.tsx`:
  - Import `<TabBar>`.
  - Remove the `<Button href=".../groups">` and `<Button href=".../finals">` from `<DesktopHeader>` children (or leave them in the desktop header and add the TabBar below it as a secondary nav — confirm with Figma which placement is correct).
  - Add `<TabBar>` above the group cards with the two phase tabs. Pass `active={true}` on the groups tab.
  - Pass `indicator` prop showing the user's current points and position (read from the `userRanking` data already available in `props`). Format: e.g., `"${userRanking.points} pts · ${userRanking.position}°"`.
- [ ] Verify that the finals route link from the TabBar navigates correctly.

### 6. Add the welcome header bar (same pattern as Phase 03)

The groups screen Figma shows the same welcome header bar as the rooms screen: trophy icon, "Bienvenidos al Prode!" title, yellow-highlighted deadline.

- [ ] If `<HeaderMessage>` was created in Phase 03: import and render it in `<DesktopHeader>` on the groups page with the same `deadline` prop.
- [ ] If Phase 03 has not been merged yet: implement `<HeaderMessage>` here and coordinate a merge order.

### 7. Restyle the standings panel (`GroupsRankingContainer`)

The Figma "Tabla de posiciones" shows:
- Three columns: Posición (number with colored dot), Jugador (avatar + name), Puntos
- Position dots: gold for 1st, silver for 2nd, bronze for 3rd, gray for others
- User avatars using the existing `<UserImage>` component

- [ ] In `src/components/view/Groups/GroupsRankingContainer.tsx`:
  - Confirm the component already renders position, player name, and points. Add or expose the position-dot visual.
  - Add colored dot logic:
    ```tsx
    const dotColor = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : position === 3 ? '#CD7F32' : '$color-neutral-gray';
    ```
  - Confirm `<UserImage>` is rendered for each player. If it lacks an `alt` attribute: add `alt={user.name ?? 'Player'}`.
- [ ] Update `Groups.module.scss` or a `GroupsRankingContainer.module.scss` with the new column layout using the token colors.

### 8. Implement the mobile standings pattern

**This step is gated on the Phase 00 mobile-design decision.**

The group-stage screen has no mobile Figma design. The standings are only beside the group cards at ≥1300px. Below that, users must scroll past all group cards to reach standings.

**Recommended pattern (tab/toggle):**

- [ ] Add a `mobileView` state to the groups page: `'predictions' | 'standings'`.
- [ ] Render a simple toggle control (two buttons) below the `<TabBar>` on mobile only:
  ```tsx
  {/* Visible only below 1024px via CSS */}
  <div className={styles.mobileToggle}>
    <button
      className={className(styles.mobileToggleBtn, mobileView === 'predictions' && styles.active)}
      onClick={() => setMobileView('predictions')}
    >
      Predicciones
    </button>
    <button
      className={className(styles.mobileToggleBtn, mobileView === 'standings' && styles.active)}
      onClick={() => setMobileView('standings')}
    >
      Posiciones
    </button>
  </div>
  ```
- [ ] In the groups container, show/hide the standings panel based on `mobileView` with a CSS class on mobile:
  ```scss
  @media screen and (max-width: 1024px) {
    .standingsPanel { display: none; }
    .standingsPanel.visible { display: block; }
    .mobileToggle { display: flex; }
  }
  @media screen and (min-width: 1025px) {
    .mobileToggle { display: none; }
    .standingsPanel { display: block; }
  }
  ```
- [ ] Ensure both the predictions grid and the standings panel are in the DOM at all times (just shown/hidden with CSS classes). This preserves SSR and avoids state reset on resize.
- [ ] If the Phase 00 mobile decision chose a different pattern: implement that pattern instead. Document the chosen pattern in a comment in the SCSS.

### 9. Update `MatchInput` state colors for the new palette

Phase 01 wired tokens into `MatchInput.module.scss`. Verify on this screen:

- [ ] Match inputs show the correct three visual states: pending (unsaved), correct result, winner (exact score).
- [ ] Gameplay semantic colors (`$color-correct`, `$color-winner`, `$color-wrong`) are unchanged from their original hex values.
- [ ] The border and background colors of inputs in the new card style are consistent.

### 10. Apply ranking table accessibility fixes

- [ ] In the standings table: ensure `<th>` cells have `scope="col"`.
- [ ] If `<UserImage>` is used in the table, ensure each has a meaningful `alt` attribute.
- [ ] If row clicks navigate to user profiles, ensure the clickable rows have `role="button"` or are wrapped in `<a>` elements with keyboard support.

### 11. Re-baseline affected routes

The groups screen maps to `id_view.png` and potentially `id_ranking.png` in the harness.

- [ ] Run `npm run harness:baseline` to capture updated screenshots.
- [ ] Run `npm run harness:check` twice for stability.
- [ ] Also run a check on `finals.png` to verify the `LeniBall`/`LeniCard` removal did not break the finals screen (the finals route was added to the harness in Phase 00).
- [ ] Commit baselines alongside code changes.

---

## Acceptance Criteria

- [ ] `/[id]/groups` renders with Poppins, gradient background, recolored group cards.
- [ ] `<LeniCard>` is not rendered anywhere in the groups screen.
- [ ] `<TabBar>` renders "Fase de grupos" and "Fase final" tabs; active tab is visually distinct; both links navigate correctly.
- [ ] Points/position indicator chip appears on the active tab (when data is loaded).
- [ ] Welcome header bar shows trophy icon and yellow-highlighted deadline.
- [ ] Standings panel shows position dots (gold/silver/bronze/gray), avatars with non-empty alt text.
- [ ] At ≤1024px: a Predicciones/Posiciones toggle is visible; toggling it shows/hides the standings panel without a page reload.
- [ ] At ≥1300px: both predictions grid and standings panel are visible simultaneously.
- [ ] No horizontal scroll at 375px viewport.
- [ ] `<th>` elements in the standings table have `scope="col"`.
- [ ] Gameplay score state colors are visually unchanged from before Phase 01.
- [ ] `npm run build`, `npm run lint`, `npm test`, and `npm run harness:check` all pass.

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| Phase 00 mobile-design decision not resolved | Steps 1–7 and 9–10 can be completed without step 8. Mark step 8 blocked and complete it after the decision. |
| `GroupsContainer` / `CardsContainer` / `GroupsRankingContainer` are tightly coupled, making LeniCard removal risky | Read all three files before starting step 2. Confirm exactly which one renders `<LeniCard>` and trace all prop dependencies. |
| `LeniCard` removal affects CSS grid layout (gap, column count) | The `leniCard` grid rule in `Groups.module.scss` occupies a grid slot. Removing it may reflow other items unexpectedly. Test at 1300px, 1024px, and 600px. |
| `TabBar` uses `<a href>` which triggers a full page navigation (Next.js App Router needs `<Link>`) | Replace `<a>` with `import Link from 'next/link'` and use `<Link href={tab.href}>`. The `active` state must be derived from `usePathname()` since `active` prop passed from the page may be stale on hydration. |
| `Winner.tsx` (1849 lines) shares components with this screen and may regress | The harness `finals.png` baseline (added in Phase 00) will catch regressions in shared components. Check it after every commit. |
| Points/position indicator data may not be available in `userRanking` on initial load | Guard with optional chaining: `userRanking?.points ?? '–'`. Do not block render on it. |
| Mobile toggle state resets if the user resizes the window past 1024px | The CSS show/hide approach (not JS-controlled visibility) avoids this. Use CSS classes, not `display` toggled by React state directly. |

---

## Commands

```sh
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests
npm test

# Visual baseline
npm run harness:baseline

# Visual check (twice, all routes including finals)
npm run harness:check
npm run harness:check

# Verify mobile toggle at 375px
npm run dev
# DevTools → 375px → toggle Predicciones / Posiciones

# Verify two-pane layout at 1300px
# DevTools → 1300px → confirm side-by-side

# Check LeniCard is gone
grep -r "LeniCard" src/app src/components/view/Groups

# Check LeniBall is not rendered
grep -r "LeniBall" src/app src/components/common/Header
```

---

## What Must NOT Change

- Scoring logic in `src/utils/points.ts` and `src/utils/raw.ts` — no changes whatsoever.
- `src/utils/queries.ts` — do not touch.
- `src/components/view/Winners.tsx` — god-file, out of scope.
- The `finalsStarted` flag logic that determines which route the user is redirected to — preserve the existing conditional in `onRoomClick`.
- `src/app/(room)/[id]/finals/page.tsx` markup and logic — this plan does not touch the finals screen beyond shared component changes.
- Match score input handlers (`onScoreChange`, save debounce, API calls) — business logic is entirely preserved.
- The `GroupsRankingContainer` data query or its Prisma-backed API endpoint.
- Any Prisma schema column.
- `src/generated/prisma/` — do not run `prisma generate` unless a schema change was made (it was not, in this phase).
