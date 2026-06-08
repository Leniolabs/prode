# Plan 04: Create Prode Screen

Status: Ready to execute after Plan 01 is complete. The "Puntos por podio" decision from Plan 00 gates the podio sub-task.

Depends on: Plan 01 (tokens). Plan 00 (podio decision, per-user background decision).

---

## Goal

Restyle the create-prode screen (`/new-prode`) to match the Figma "Crear nuevo prode" frame (`2010:32154`): green card header, white body, updated input and label styles (8px radius, `#A7A8A9` border, `#005596` labels), toggle recolor, and a Cancel/Save footer replacing the single Create button. Resolve the `emailDomain` field discrepancy. Apply form accessibility fixes (label association, error roles, toggle semantics). The "Puntos por podio" field is scoped separately and must not be added unless the backend task is completed first.

---

## Files Likely Affected

| File | Change |
|---|---|
| `src/app/new-prode/page.tsx` | Cancel button, Save vs Create button label, `backgroundImage` prop removal, `emailDomain` display decision |
| `src/components/common/Form/Form.module.scss` | Already token-updated in Phase 01; verify label color `#005596`, input radius `8px`, border `#A7A8A9` |
| `src/components/common/Form/FormInput.tsx` | `htmlFor`/`id` association; error element `role="alert"` |
| `src/components/common/Toggle/Toggle.tsx` | `role="switch"`, `aria-checked`; semantic fix `<div>` → `<button>` |
| `src/components/common/Toggle/Toggle.module.scss` | Already token-updated in Phase 01 (gray off, green on); verify |
| `src/layout/Card/Card.module.scss` | Already updated in Phase 01; verify green header, white body on this screen |
| `src/components/common/Form/FormFooter.tsx` | Add Cancel button alongside the existing action button |
| `src/locale/` (both locale files) | Add Cancel button label key if missing |

---

## Step-by-Step Checklist

### 1. Verify Phase 01 token changes on this screen

- [ ] `/new-prode` renders with green card header ("Crear nuevo prode"), white card body.
- [ ] Form section titles (General, Puntajes) render with the new `$color-table-header` background (light teal, not `#cbd2e9` lavender).
- [ ] Input borders are `#A7A8A9`, 8px radius.
- [ ] Input labels are `#005596` (Improving Blue), Poppins Medium.
- [ ] Toggle: off state is `$color-neutral-gray`, on state is `$color-brand-green`.
- [ ] Font is Poppins.

If any of these are wrong, fix in Phase 01 before continuing.

### 2. Remove per-user `backgroundImage` prop

If Phase 00 decided to remove per-user backgrounds:

- [ ] In `src/app/new-prode/page.tsx`, change `<Layout backgroundImage={...}>` to `<Layout>`.

If retaining per-user backgrounds: leave as-is.

### 3. Add Cancel / Save footer buttons

The Figma shows two footer buttons: "Cancelar" (outlined secondary) and "Guardar" (filled `#4597D3` = `$color-brand-light-blue`).

- [ ] In `src/app/new-prode/page.tsx`, update the `<FormFooter>` section:
  ```tsx
  <FormFooter>
    {error && <FormError>{formError(error)}</FormError>}
    <Button variant="secondary" href="/rooms">
      {i18n.buttonLabelCancel}
    </Button>
    <Button onClick={handleCreate}>
      {i18n.buttonLabelCreate}
    </Button>
  </FormFooter>
  ```
- [ ] Add `buttonLabelCancel` to both locale files in `src/locale/` (Spanish: `"Cancelar"`, English: `"Cancel"`).
- [ ] Verify the secondary button variant renders as outlined in `Button.module.scss`. The current secondary is `background: #3b4871`; after Phase 01 it should use the token. Confirm the Figma "Cancelar" button style matches `secondary` or requires a new `outlined` variant. If a new variant is needed, add it to `Button.tsx` props and `Button.module.scss` only.
- [ ] The "Guardar" / "Crear" button should use the primary variant (which is `$color-brand-light-blue` after Phase 01 token update, or `$color-accent-yellow` if the main CTA is still yellow). Confirm with the Figma which color the save button uses and adjust the primary token or add a `cta` variant accordingly.

### 4. Resolve the `emailDomain` field

The `emailDomain` field is present in the current form but absent from the Figma. Two options:

- [ ] **If hiding from UI (recommended interim)**: add a CSS class `sr-only` (or `display: none`) to the `emailDomain` `<FormInput>` so it is present in the DOM but not visible. Do not remove it from `FormType` or the API call, since existing rooms may have it set. This avoids a backend change.
- [ ] **If removing from UI entirely**: remove the `<FormInput>` for `emailDomain` from the JSX and remove `emailDomain` from the `form` state default values. The field still exists in the API payload; just pass an empty string for compatibility.

Do not remove `emailDomain` from the Prisma schema or the `/api/create` route handler.

### 5. Fix `FormInput` label association

Current: `FormInput` renders labels without `htmlFor`/`id` linkage — clicking the label does not focus the input.

- [ ] In `src/components/common/Form/FormInput.tsx`:
  - Derive an `id` from the `label` prop (e.g., `id={label.toLowerCase().replace(/\s+/g, '-')}`), or accept an explicit `id` prop.
  - Add `htmlFor={id}` to the `<label>` element.
  - Add `id={id}` to the `<input>` element.
- [ ] For the error element: change from whatever renders the error (likely a bare `<label>` or `<span>`) to:
  ```tsx
  {error && <span role="alert" className={styles.formInputError}>{error}</span>}
  ```
- [ ] Verify with keyboard: Tab to the label, confirm focus moves to the input.

### 6. Fix `<Toggle>` accessibility

The Toggle is a clickable `<div>`. Screen readers cannot interact with it as a switch.

- [ ] In `src/components/common/Toggle/Toggle.tsx`:
  - Change the root element from `<div>` to `<button type="button">`.
  - Add `role="switch"` and `aria-checked={props.value}`.
  - Add an `aria-label` prop (or use the parent label's `htmlFor`/`id` association from step 5).
  - Remove the inline `onClick` from the div; add it to the button.
- [ ] In `Toggle.module.scss`: reset button default styles and keep the visual pill styles.
- [ ] Verify the toggle is keyboard-activatable with Space and Enter.

### 7. Handle the "Puntos por podio" decision (branching task)

**This step is gated on the Phase 00 decision. Do not implement unless the decision is documented.**

- [ ] **If "podio" is a rename of `pointsPenal`**: Update the `i18n` label key for the penalties field in both locale files. No schema change.
- [ ] **If "podio" is a new field**: This requires a separate backend task first:
  1. Add `pointsPodio Int @default(3)` (or similar) to the Prisma schema.
  2. Create and run a migration: `npx prisma migrate dev`.
  3. Update `src/utils/points.ts` (TS scoring logic) to include podio points.
  4. Update `src/utils/raw.ts` (SQL scoring logic) to include podio points. Both must be updated together per Landmine #1.
  5. Update `/api/create` route handler to accept and persist `pointsPodio`.
  6. Only then: add the `pointsPodio` field to `FormType`, the form state, and the JSX in `new-prode/page.tsx`.
  
  **Do not start this sub-task in this plan.** Create a separate ticket for it and mark this step as blocked until it is merged.
- [ ] **If out of scope**: document the decision and do nothing.

### 8. Re-baseline affected routes

- [ ] Run `npm run harness:baseline` to capture the updated `new-prode.png`.
- [ ] Run `npm run harness:check` twice to confirm stability.
- [ ] Commit baseline alongside code changes.

---

## Acceptance Criteria

- [ ] `/new-prode` renders with green card header ("Crear nuevo prode"), white card body, Poppins font.
- [ ] Form inputs have `#A7A8A9` borders and 8px radius.
- [ ] Input labels are Improving Blue (`#005596`).
- [ ] Toggle is `<button role="switch">` with `aria-checked`; keyboard-activatable.
- [ ] Form labels are linked to inputs via `htmlFor`/`id`; clicking a label focuses the input.
- [ ] Error messages render as `role="alert"` spans.
- [ ] Footer shows "Cancelar" and the save action button side by side.
- [ ] `emailDomain` field is either hidden visually or removed from JSX (not removed from schema/API).
- [ ] No "Puntos por podio" field is present unless the backend task is explicitly merged first.
- [ ] `npm run build`, `npm run lint`, `npm test`, and `npm run harness:check` all pass.

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| Phase 00 podio decision not documented | Do not add the field. Mark step 7 as blocked in the ticket and proceed with all other steps. |
| `FormInput` `id` derivation from label text collides if two labels have identical text | Accept an optional explicit `id` prop as override. If none is provided, derive from label + index. |
| Toggle semantic change breaks existing tests | Check `npm test` — any test that mounts `<Toggle>` and finds a `<div>` will fail. Update the selector in those tests to find `<button role="switch">`. |
| "Cancelar" button navigates to `/rooms` but dirty form state is not confirmed | Out of scope for this plan; basic navigation is sufficient. A "are you sure?" dialog is a separate UX decision. |
| Secondary button variant is a filled blue in Figma, not outlined | The current `secondary` class is `background: #3b4871`. If the Figma "Cancelar" is outlined (`border: 1px solid; background: transparent`), add an `outlined` variant to `Button.tsx` rather than repurposing `secondary`. |

---

## Commands

```sh
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests (check for Toggle selector failures)
npm test

# Visual baseline
npm run harness:baseline

# Visual check (twice)
npm run harness:check
npm run harness:check

# Keyboard test: open /new-prode, Tab through all fields, Space on Toggle
npm run dev
```

---

## What Must NOT Change

- `FormType` structure beyond what the podio decision requires.
- `/api/create` route handler — pass `emailDomain` as-is even if hidden from UI.
- Prisma schema — `emailDomain`, `pointsWinner`, `pointsGoals`, `pointsPenal` columns on `ProdeRoom` are unchanged.
- `src/utils/points.ts` and `src/utils/raw.ts` — no scoring logic changes unless the podio backend task is explicitly in scope.
- All `useQuery` data fetching, form state management (`handleChange`, `handleCreate`), and validation (`checkRoomName`).
- `src/locale/` keys other than adding the new Cancel label.
- Any route outside `/new-prode`.
