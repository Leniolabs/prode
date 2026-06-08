# Plan 03: Rooms List Screen

Status: Ready to execute after Plan 01 is complete (tokens in place). Plan 02 can run concurrently since this screen does not share markup with login.

Depends on: Plan 01 (tokens and Poppins). Plan 02 for `BrandLogo` (footer) — run Plan 02 first or apply the `BrandLogo` change in Plan 02 and confirm it is merged before re-baselining here.

---

## Goal

Restyle the rooms list screen (`/rooms`) to match the Figma "Join a group" frame (`2019:29056`): green card header, white card body, gradient footer, welcome header bar with trophy icon and deadline, a prominent yellow CTA button above the card, and table updates (member icon, edit column, fluid action column). Fix the hardcoded `250px` action column that overflows on phones. Apply table and interactive-element accessibility fixes.

No data-fetching, routing, or business-logic changes.

---

## Files Likely Affected

| File | Change |
|---|---|
| `src/app/rooms/page.tsx` | Welcome header block, CTA button placement, remove inline `style` width on action column, `backgroundImage` prop removal |
| `src/layout/Card/Card.module.scss` | Already updated in Phase 01 (green header, white body, radius, shadow) — verify here |
| `src/layout/Footer/Footer.module.scss` | Already updated in Phase 01 (gradient) — verify here |
| `src/components/common/Table/Table.module.scss` | Header row color token, mobile font size, column width tokens |
| `src/components/common/Table/Table.tsx` | Confirm `hideInMobile` works; add `scope="col"` to `<th>` cells |
| `src/components/common/Header/DesktopHeader/DesktopHeader.tsx` | Welcome bar: trophy icon, "Bienvenidos al Prode!" title, deadline line with yellow-highlighted date |
| `src/components/common/Header/DesktopHeader/DesktopHeader.module.scss` | Welcome bar styles (already has header bg token from Phase 01) |
| `src/components/common/Header/HeaderMessage/HeaderMessage.tsx` | If this component exists and is used for the welcome message, update it; otherwise create a sub-element in DesktopHeader |
| `src/components/common/Button/Button.module.scss` | Already updated in Phase 01 (tokens); verify CTA yellow variant renders correctly |
| `src/components/common/PasswordModal/PasswordModal.tsx` | Semantic accessibility fixes (role, aria-modal, focus trap) |
| `src/components/common/Modal/Modal.tsx` | Same accessibility fixes — applied here so PasswordModal benefits |

---

## Step-by-Step Checklist

### 1. Verify Phase 01 token changes render correctly on this screen

Before making new changes, confirm the Phase 01 output is correct on `/rooms`:

- [ ] Card header is green (`$color-card-header: #5BC2A7`) with dark text.
- [ ] Card body is white.
- [ ] Footer shows horizontal gradient.
- [ ] Page background shows the brand gradient (not a PNG).
- [ ] Font is Poppins.

If any of these are wrong, fix the upstream token wiring in Phase 01 before continuing.

### 2. Remove the per-user `backgroundImage` prop

If the Phase 00 decision was to remove per-user backgrounds:

- [ ] In `src/app/rooms/page.tsx`, change:
  ```tsx
  <Layout backgroundImage={`/${props?.userRanking?.background}.png`}>
  ```
  to:
  ```tsx
  <Layout>
  ```
- [ ] Do the same for `new-prode/page.tsx` (to keep it consistent, even though Phase 04 covers that screen).
- [ ] Verify the gradient shows on `/rooms`.

If retaining per-user backgrounds: leave as-is and note that the inline style will override the gradient for users with a `background` set.

### 3. Add the welcome header bar

The Figma shows a top-of-page bar (inside or above the `<DesktopHeader>`) with:
- A small trophy icon (left)
- "Bienvenidos al Prode!" as the main text
- A deadline line, e.g. "El torneo termina el [date highlighted in yellow]"

- [ ] Locate or create a `HeaderMessage` sub-component inside `src/components/common/Header/`. If `HeaderMessage.tsx` already exists, update its markup; if not, create it as `HeaderMessage.tsx + HeaderMessage.module.scss + index.ts` in `src/components/common/Header/HeaderMessage/`.
- [ ] The deadline date should be wrapped in a `<span>` with the `$color-accent-yellow` token as background color and `$color-dark-navy` as text. Example:
  ```tsx
  <span className={styles.highlight}>26 de julio 2026</span>
  ```
- [ ] Add the trophy image: `<Image src="/wc2026-trophy.png" alt="" aria-hidden="true" width={32} height={32} />` (decorative use; `alt=""` is intentional).
- [ ] Render `<HeaderMessage>` inside `<DesktopHeader>` in `src/app/rooms/page.tsx`. This component is rooms-specific; if other screens need it, it can be promoted later.
- [ ] The deadline date value should come from the `props` data returned by `/api/rooms-page-data`, not be hardcoded. Check what fields are returned. If no deadline field exists in the API response, add it to the route handler (`src/app/api/rooms-page-data/route.ts` or `pages/api/rooms-page-data.ts`). Fetch the `Prode.endDate` or equivalent field from `prisma.prode.findFirst({})`. This is the only allowed API change in this phase.

### 4. Add the prominent "Crea Nuevo Prode" CTA

The Figma shows a yellow CTA button above the card, not in the header. There is also an "o" divider (for "or join an existing one").

- [ ] In `src/app/rooms/page.tsx`, add above the `<Card>`:
  ```tsx
  <div className={styles.ctaRow}>
    <Button variant="primary" href="/new-prode">
      {i18n.buttonLabelCreateRoom}
    </Button>
    <span className={styles.divider}>{i18n.roomsDivider ?? 'o'}</span>
  </div>
  ```
- [ ] Add `ctaRow` and `divider` styles to the page-level SCSS (create `src/app/rooms/rooms.module.scss` if it does not exist, or add a local `_components/` folder if following the App Router local component pattern).
- [ ] The existing "Crear Prode" button in `<DesktopHeader>` can be removed from the header once the in-page CTA is confirmed. Verify both the desktop and mobile headers are consistent.

### 5. Fix the action column overflow

The action column in the rooms table has `width: "250px"` hardcoded as an inline JSX style. On narrow phones this causes horizontal overflow.

- [ ] In `src/app/rooms/page.tsx`, find the fourth column definition:
  ```tsx
  { header: "", align: "RIGHT", width: "250px", accesor: (row) => ... }
  ```
- [ ] Change `width: "250px"` to `width: "auto"` or remove the `width` prop entirely. The button inside should size to its content.
- [ ] In `Table.module.scss`, ensure the action cell uses `white-space: nowrap` only on the button, not the cell, so it does not force column expansion.
- [ ] Test at 375px viewport width (iPhone SE equivalent) — no horizontal scroll should appear.

### 6. Reduce table font size on mobile

The current table uses 20px font, which is large on phones.

- [ ] In `src/components/common/Table/Table.module.scss`, add:
  ```scss
  @media screen and (max-width: 600px) {
    td, th { font-size: 14px; }
  }
  ```
- [ ] Verify the table is still readable at 375px.

### 7. Add `scope="col"` to table headers

- [ ] In `src/components/common/Table/Table.tsx`, locate the `<th>` element rendering and add `scope="col"`:
  ```tsx
  <th scope="col" ...>
  ```
- [ ] If the Table component renders `<td>` for header cells, change them to `<th scope="col">`.

### 8. Fix `<Modal>` and `<PasswordModal>` accessibility

The `<PasswordModal>` is rendered on this screen when a user clicks a password-protected room.

- [ ] In `src/components/common/Modal/Modal.tsx`:
  - Add `role="dialog"` and `aria-modal="true"` to the root modal element.
  - Add `aria-labelledby="modal-title"` and give the modal title element `id="modal-title"`.
  - On mount, move focus to the first focusable element inside the modal (use `useEffect` + `ref.current?.focus()`).
  - Add a keydown listener for `Escape` to call the `onClose` callback.
  - Trap focus within the modal: when focus reaches the last focusable element and Tab is pressed, cycle back to the first.
- [ ] Verify `<PasswordModal>` inherits these fixes.
- [ ] Note: this is a meaningful a11y fix, not a full Radix migration. Keep it scoped to these changes; do not refactor to Radix in this phase.

### 9. Re-baseline the `rooms` route

- [ ] Run `npm run harness:baseline` to capture the updated `rooms.png`.
- [ ] Run `npm run harness:check` twice to confirm stability.
- [ ] Commit baseline alongside code changes.

---

## Acceptance Criteria

- [ ] `/rooms` renders with green card header, white card body, gradient footer, Poppins font.
- [ ] Welcome header bar shows trophy icon, "Bienvenidos al Prode!" text, and a yellow-highlighted deadline date.
- [ ] A yellow "Crea Nuevo Prode" CTA button appears above the rooms table.
- [ ] No horizontal scroll at 375px viewport width.
- [ ] Table headers have `scope="col"` (verify in browser DevTools).
- [ ] `<PasswordModal>` has `role="dialog"`, `aria-modal="true"`, moves focus on open, closes on Escape.
- [ ] `npm run build`, `npm run lint`, `npm test`, and `npm run harness:check` all pass.

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| Deadline field not present in `/api/rooms-page-data` response | Add `prode.endDate` (or equivalent) to the API route handler; this is a minimal, safe read-only addition. |
| `HeaderMessage` component does not exist and needs to be created | Create it as a simple presentational component with no data fetching; props: `deadline: Date | string`. |
| `Modal` focus-trap implementation complexity | Keep it simple: track focusable children with `querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')`. A full Radix migration is out of scope. |
| `BrandLogo` not yet updated (depends on Plan 02) | If Plan 02 is not merged, the footer shows the old Leniolabs logo. Run Plan 02 first or accept the interim state and re-baseline after Plan 02 merges. |
| The "o" divider locale key (`roomsDivider`) may not exist in `locale/` | Add it to both locale files if missing, or hardcode `"o"` as a constant in the page for now. |

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

# Visual check (twice)
npm run harness:check
npm run harness:check

# Test at mobile width: open DevTools → 375px and scroll horizontally to verify no overflow
npm run dev
```

---

## What Must NOT Change

- `src/app/rooms/page.tsx` data fetching: `useQuery`, `useRequireSession`, `onRoomClick`, `handlePassword` — all business logic is preserved.
- The `Table` component's `hideInMobile` and `accesor` mechanisms — only styles and `scope` attribute change.
- `src/components/common/PasswordModal/PasswordModal.tsx` password submission logic (`handlePassword`, `axios.post`).
- `src/app/api/rooms-page-data/` route handler logic beyond adding the `endDate` field.
- `src/utils/queries.ts` — do not touch.
- `src/components/view/Winners.tsx` — not in scope.
- Any scoring or match-input components.
